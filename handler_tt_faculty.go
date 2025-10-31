package main

import(
	"database/sql"
	"log"
	"net/http"
	"strconv"
)

func (apiCfg *apiConfig) handlerTimetableFaculty(w http.ResponseWriter, r *http.Request) {
	batch := r.URL.Query().Get("batch")
	dayStr := r.URL.Query().Get("day")
	yearStr := r.URL.Query().Get("year")
	fidStr := r.URL.Query().Get("fid")

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		log.Println("Query error:", err)
		respondWithError(w, 500, "Invalid day")
		return
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		log.Println("Query error:", err)
		respondWithError(w, 500, "Invalid year")
		return
	}
	fid, err := strconv.Atoi(fidStr)
	if err != nil {
		log.Println("Query error:", err)
		respondWithError(w, 500, "Invalid faculty id")
		return
	}

	var rows *sql.Rows

	if day != 0 {
		query := `
			SELECT 
				batches.batch_name,
				COALESCE(divisions.division_label, 'Combined Batch') AS division_label,
				courses.course_name,
				days.day_name,
				time_slots.start_time,
				time_slots.end_time,
				'Regular' AS class_type
			FROM timetable
			JOIN time_slots ON timetable.time_slot = time_slots.time_slot_id
			JOIN days ON timetable.day_of_week = days.day_of_week
			JOIN courses ON courses.course_id = timetable.course_id
			LEFT JOIN divisions ON timetable.division_id = divisions.division_id
			JOIN batches ON timetable.batch_id = batches.batch_id
			WHERE timetable.faculty_id = ? AND days.day_of_week = ? 
			      AND batches.batch_name = ? AND batches.admission_year = ?

			UNION ALL

			SELECT 
				batches.batch_name,
				COALESCE(divisions.division_label, 'Combined Batch') AS division_label,
				courses.course_name,
				days.day_name,
				time_slots.start_time,
				time_slots.end_time,
				'Extra' AS class_type
			FROM extra_classes
			JOIN time_slots ON extra_classes.time_slot = time_slots.time_slot_id
			JOIN days ON extra_classes.day_of_week = days.day_of_week
			JOIN courses ON courses.course_id = extra_classes.course_id
			LEFT JOIN divisions ON extra_classes.division_id = divisions.division_id
			JOIN batches ON extra_classes.batch_id = batches.batch_id
			WHERE extra_classes.faculty_id = ? AND days.day_of_week = ?
			      AND batches.batch_name = ? AND batches.admission_year = ? 
			      AND extra_classes.class_date >= CURDATE()
			ORDER BY day_name, start_time;
		`
		rows, err = apiCfg.DB.Query(query, fid, day, batch, year, fid, day, batch, year)
	} else {
		query := `
			SELECT 
				batches.batch_name,
				COALESCE(divisions.division_label, 'Combined Batch') AS division_label,
				courses.course_name,
				days.day_name,
				time_slots.start_time,
				time_slots.end_time,
				'Regular' AS class_type
			FROM timetable
			JOIN time_slots ON timetable.time_slot = time_slots.time_slot_id
			JOIN days ON timetable.day_of_week = days.day_of_week
			JOIN courses ON courses.course_id = timetable.course_id
			LEFT JOIN divisions ON timetable.division_id = divisions.division_id
			JOIN batches ON timetable.batch_id = batches.batch_id
			WHERE timetable.faculty_id = ? AND batches.batch_name = ? AND batches.admission_year = ?

			UNION ALL

			SELECT 
				batches.batch_name,
				COALESCE(divisions.division_label, 'Combined Batch') AS division_label,
				courses.course_name,
				days.day_name,
				time_slots.start_time,
				time_slots.end_time,
				'Extra' AS class_type
			FROM extra_classes
			JOIN time_slots ON extra_classes.time_slot = time_slots.time_slot_id
			JOIN days ON extra_classes.day_of_week = days.day_of_week
			JOIN courses ON courses.course_id = extra_classes.course_id
			LEFT JOIN divisions ON extra_classes.division_id = divisions.division_id
			JOIN batches ON extra_classes.batch_id = batches.batch_id
			WHERE extra_classes.faculty_id = ? AND batches.batch_name = ? AND batches.admission_year = ? 
			      AND extra_classes.class_date >= CURDATE()
			ORDER BY day_name, start_time;
		`
		rows, err = apiCfg.DB.Query(query, fid, batch, year, fid, batch, year)
	}

	if err != nil {
		log.Println("Query error:", err)
		respondWithError(w, 500, "Database query failed")
		return
	}
	defer rows.Close()

	type facultyEntry struct {
		BatchName     string `json:"batch_name"`
		DivisionLabel string `json:"division_label"`
		CourseName    string `json:"course_name"`
		DayName       string `json:"day_name"`
		StartTime     string `json:"start_time"`
		EndTime       string `json:"end_time"`
		ClassType     string `json:"class_type"`
	}

	var timetable []facultyEntry
	for rows.Next() {
		var t facultyEntry
		if err := rows.Scan(&t.BatchName, &t.DivisionLabel, &t.CourseName, &t.DayName, &t.StartTime, &t.EndTime, &t.ClassType); err != nil {
			log.Println("Scan error:", err)
			respondWithError(w, 500, "Scan error")
			return
		}
		timetable = append(timetable, t)
	}

	respondWithJSON(w, 200, timetable)
}
