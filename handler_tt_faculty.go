package main

import(
	"database/sql"
	"log"
	"net/http"
	"strconv"
)

type facultyEntry struct{
	BatchName     string `json:"batch_name"`
    DivisionLabel string `json:"division_label"`
    CourseName    string `json:"course_name"`
    DayName       string `json:"day_name"`
    StartTime     string `json:"start_time"`
    EndTime       string `json:"end_time"`
}

func (apiCfg *apiConfig) handlerTimetableFaculty(w http.ResponseWriter, r *http.Request){
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
        respondWithError(w, 500, "Invalid faculty name")
        return
    }

	var rows *sql.Rows

	if day != 0{
		query := `
			select 
				batches.batch_name,
				divisions.division_label,
				courses.course_name,
				days.day_name,
				time_slots.start_time,
				time_slots.end_time
			FROM timetable
			join time_slots on timetable.time_slot = time_slots.time_slot_id
			join days on timetable.day_of_week = days.day_of_week
			join courses on courses.course_id = timetable.course_id
			join divisions on divisions.division_id = timetable.division_id
			join batches on batches.batch_id = timetable.batch_id
			join faculty on faculty.faculty_id = timetable.faculty_id
			WHERE faculty.faculty_id = ? AND days.day_of_week = ? AND batches.batch_name = ? AND batches.admission_year = ?
			ORDER BY timetable.day_of_week, time_slots.start_time;
		`
		rows, err = apiCfg.DB.Query(query,fid,day,batch,year)

	}else{
		query := `
			select 
				batches.batch_name,
				divisions.division_label,
				courses.course_name,
				days.day_name,
				time_slots.start_time,
				time_slots.end_time
			FROM timetable
			join time_slots on timetable.time_slot = time_slots.time_slot_id
			join days on timetable.day_of_week = days.day_of_week
			join courses on courses.course_id = timetable.course_id
			join divisions on divisions.division_id = timetable.division_id
			join batches on batches.batch_id = timetable.batch_id
			join faculty on faculty.faculty_id = timetable.faculty_id
			WHERE faculty.faculty_id = ? AND batches.batch_name = ? AND batches.admission_year = ?
			ORDER BY timetable.day_of_week, time_slots.start_time;
		`
		rows, err = apiCfg.DB.Query(query,fid,batch,year)
	}
	
	if err != nil {
        log.Println("Query error:", err)
        respondWithError(w, 500, "Database query failed")
        return
    }

	defer rows.Close()

	var timetable []facultyEntry
	for rows.Next(){
		var t facultyEntry
		if err := rows.Scan(&t.BatchName, &t.DivisionLabel, &t.CourseName, &t.DayName, &t.StartTime, &t.EndTime); err != nil {
            log.Println("Scan error:", err)
            respondWithError(w, 500, "Scan error")
            return
        }
        timetable = append(timetable, t)
	}
	respondWithJSON(w, 200, timetable)
}