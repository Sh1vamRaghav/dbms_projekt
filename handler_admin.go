package main

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
)

func (apiCfg *apiConfig) getBatchAndDivision(batchName string, year int, divLabel string) (batchID int, divisionArg interface{}, err error) {
	err = apiCfg.DB.QueryRow(
		`SELECT batch_id FROM batches WHERE batch_name = ? AND admission_year = ?`,
		batchName, year,
	).Scan(&batchID)
	if err != nil {
		return 0, nil, err
	}

	var divisionID sql.NullInt64
	if divLabel != "" {
		err = apiCfg.DB.QueryRow(
			`SELECT division_id FROM divisions WHERE batch_id = ? AND division_label = ?`,
			batchID, divLabel,
		).Scan(&divisionID)
		if err != nil {
			return 0, nil, err
		}
	}

	if divisionID.Valid {
		return batchID, divisionID.Int64, nil
	}
	return batchID, nil, nil
}

// ===== CREATE CLASS =====
func (apiCfg *apiConfig) create_entry(w http.ResponseWriter, r *http.Request) {
	termStr := r.URL.Query().Get("term_id")
	batchStr := r.URL.Query().Get("batch_name")
	yearStr := r.URL.Query().Get("admission_year")
	divStr := r.URL.Query().Get("division_label")
	courseStr := r.URL.Query().Get("course_id")
	facultyStr := r.URL.Query().Get("faculty_id")
	roomStr := r.URL.Query().Get("room_id")
	dayStr := r.URL.Query().Get("day_of_week")
	timeStr := r.URL.Query().Get("time_slot")

	// ---- Parse and validate ----
	termID, err := strconv.Atoi(termStr)
	if err != nil {
		respondWithError(w, 400, "Invalid term selected")
		return
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		respondWithError(w, 400, "Invalid year selected")
		return
	}
	facultyID, err := strconv.Atoi(facultyStr)
	if err != nil {
		respondWithError(w, 400, "Invalid faculty selected")
		return
	}
	dayOfWeek, err := strconv.Atoi(dayStr)
	if err != nil {
		respondWithError(w, 400, "Invalid day selected")
		return
	}
	timeSlot, err := strconv.Atoi(timeStr)
	if err != nil {
		respondWithError(w, 400, "Invalid time slot selected")
		return
	}

	// ---- Lookup batch + division ----
	batchID, divisionArg, err := apiCfg.getBatchAndDivision(batchStr, year, divStr)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, 404, "Batch or division not found")
		} else {
			log.Println("DB error (batch/division lookup):", err)
			respondWithError(w, 500, "Error fetching batch/division")
		}
		return
	}

	// ---- Prevent duplicates ----
	var exists int
	err = apiCfg.DB.QueryRow(`
		SELECT COUNT(*) FROM timetable
		WHERE term_id = ? AND batch_id = ? AND division_id <=> ?
			AND course_id = ? AND faculty_id = ? AND room_id = ?
			AND day_of_week = ? AND time_slot = ?`,
		termID, batchID, divisionArg, courseStr, facultyID, roomStr, dayOfWeek, timeSlot,
	).Scan(&exists)

	if err != nil {
		log.Println("DB check error:", err)
		respondWithError(w, 500, "Error checking for duplicate class")
		return
	}
	if exists > 0 {
		respondWithError(w, 409, "Class already exists in timetable")
		return
	}

	// ---- Insert class ----
	query := `
		INSERT INTO timetable
			(term_id, batch_id, division_id, course_id, faculty_id, room_id, day_of_week, time_slot)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = apiCfg.DB.Exec(query,
		termID, batchID, divisionArg, courseStr, facultyID, roomStr, dayOfWeek, timeSlot)
	if err != nil {
		log.Println("DB insert error:", err)
		respondWithError(w, 500, "Failed to insert class")
		return
	}

	respondWithJSON(w, 200, map[string]string{"message": "Class scheduled successfully!"})
}

// ===== DELETE CLASS =====
func (apiCfg *apiConfig) delete_entry(w http.ResponseWriter, r *http.Request) {
	termStr := r.URL.Query().Get("term_id")
	batchStr := r.URL.Query().Get("batch_name")
	yearStr := r.URL.Query().Get("admission_year")
	divStr := r.URL.Query().Get("division_label")
	courseStr := r.URL.Query().Get("course_id")
	facultyStr := r.URL.Query().Get("faculty_id")
	roomStr := r.URL.Query().Get("room_id")
	dayStr := r.URL.Query().Get("day_of_week")
	timeStr := r.URL.Query().Get("time_slot")

	// ---- Parse and validate ----
	termID, err := strconv.Atoi(termStr)
	if err != nil {
		respondWithError(w, 400, "Invalid term selected")
		return
	}
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		respondWithError(w, 400, "Invalid year selected")
		return
	}
	facultyID, err := strconv.Atoi(facultyStr)
	if err != nil {
		respondWithError(w, 400, "Invalid faculty selected")
		return
	}
	dayOfWeek, err := strconv.Atoi(dayStr)
	if err != nil {
		respondWithError(w, 400, "Invalid day selected")
		return
	}
	timeSlot, err := strconv.Atoi(timeStr)
	if err != nil {
		respondWithError(w, 400, "Invalid time slot selected")
		return
	}

	// ---- Lookup batch + division ----
	batchID, divisionArg, err := apiCfg.getBatchAndDivision(batchStr, year, divStr)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, 404, "Batch or division not found")
		} else {
			log.Println("DB error (batch/division lookup):", err)
			respondWithError(w, 500, "Error fetching batch/division")
		}
		return
	}

	// ---- Delete class ----
	query := `
		DELETE FROM timetable
		WHERE term_id = ? AND batch_id = ? AND division_id <=> ? 
			  AND course_id = ? AND faculty_id = ? AND room_id = ?
			  AND day_of_week = ? AND time_slot = ?
	`
	res, err := apiCfg.DB.Exec(query,
		termID, batchID, divisionArg, courseStr, facultyID, roomStr, dayOfWeek, timeSlot)
	if err != nil {
		log.Println("DB delete error:", err)
		respondWithError(w, 500, "Failed to delete class")
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		respondWithError(w, 404, "No matching class found to delete")
		return
	}

	log.Printf("[ADMIN DELETE] term=%d batch=%d div=%v course=%s faculty=%d room=%s day=%d slot=%d rows=%d\n",
		termID, batchID, divisionArg, courseStr, facultyID, roomStr, dayOfWeek, timeSlot, rows)

	respondWithJSON(w, 200, map[string]string{"message": "Class deleted successfully!"})
}
