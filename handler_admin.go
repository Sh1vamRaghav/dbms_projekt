package main

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
)

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

	// Get batch ID
	var batchID int
	err = apiCfg.DB.QueryRow(
		`SELECT batch_id FROM batches WHERE batch_name = ? AND admission_year = ?`,
		batchStr, year,
	).Scan(&batchID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, 404, "Batch not found")
		} else {
			log.Println("DB error (batch lookup):", err)
			respondWithError(w, 500, "Error fetching batch")
		}
		return
	}

	// Get division ID (if provided)
	var divisionID sql.NullInt64
	if divStr != "" {
		err = apiCfg.DB.QueryRow(
			`SELECT division_id FROM divisions WHERE batch_id = ? AND division_label = ?`,
			batchID, divStr,
		).Scan(&divisionID)
		if err != nil {
			if err == sql.ErrNoRows {
				respondWithError(w, 404, "Division not found")
			} else {
				log.Println("DB error (division lookup):", err)
				respondWithError(w, 500, "Error fetching division")
			}
			return
		}
	}

	var divisionArg interface{}
	if divisionID.Valid {
		divisionArg = divisionID.Int64
	} else {
		divisionArg = nil
	}

	// Insert class
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

	var batchID int
	err = apiCfg.DB.QueryRow(
		`SELECT batch_id FROM batches WHERE batch_name = ? AND admission_year = ?`,
		batchStr, year,
	).Scan(&batchID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, 404, "Batch not found")
		} else {
			log.Println("DB error (batch lookup):", err)
			respondWithError(w, 500, "Error fetching batch")
		}
		return
	}

	var divisionID sql.NullInt64
	if divStr != "" {
		err = apiCfg.DB.QueryRow(
			`SELECT division_id FROM divisions WHERE batch_id = ? AND division_label = ?`,
			batchID, divStr,
		).Scan(&divisionID)
		if err != nil {
			if err == sql.ErrNoRows {
				respondWithError(w, 404, "Division not found")
			} else {
				log.Println("DB error (division lookup):", err)
				respondWithError(w, 500, "Error fetching division")
			}
			return
		}
	}

	var divisionArg interface{}
	if divisionID.Valid {
		divisionArg = divisionID.Int64
	} else {
		divisionArg = nil
	}

	query := `
		DELETE FROM timetable
		WHERE term_id = ? AND batch_id = ? AND division_id <=> ? 
			AND course_id = ? AND faculty_id = ? AND room_id = ?
			AND day_of_week = ? AND time_slot = ?
	`
	_, err = apiCfg.DB.Exec(query,
		termID, batchID, divisionArg, courseStr, facultyID, roomStr, dayOfWeek, timeSlot)
	if err != nil {
		log.Println("DB delete error:", err)
		respondWithError(w, 500, "Failed to delete class")
		return
	}

	respondWithJSON(w, 200, map[string]string{"message": "Class deleted successfully!"})
}
