package main

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
)

func (apiCfg *apiConfig) handlerExtraClass(w http.ResponseWriter, r *http.Request) {
	fidStr := r.URL.Query().Get("fid")
	cidStr := r.URL.Query().Get("cid")
	bidStr := r.URL.Query().Get("bid")
	didStr := r.URL.Query().Get("did")
	ridStr := r.URL.Query().Get("rid")
	dayStr := r.URL.Query().Get("day")
	tidStr := r.URL.Query().Get("tid")
	dateStr := r.URL.Query().Get("date")
	yearStr := r.URL.Query().Get("year") 

	fid, err := strconv.Atoi(fidStr)
	if err != nil {
		log.Println("Query error (fid):", err)
		respondWithError(w, 400, "Invalid faculty id")
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		log.Println("Query error (year):", err)
		respondWithError(w, 400, "Invalid year")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		log.Println("Query error (day):", err)
		respondWithError(w, 400, "Invalid day")
		return
	}

	tid, err := strconv.Atoi(tidStr)
	if err != nil {
		log.Println("Query error (tid):", err)
		respondWithError(w, 400, "Invalid time slot id")
		return
	}

	var batchID int
	err = apiCfg.DB.QueryRow(
		`SELECT batch_id FROM batches WHERE batch_name = ? AND admission_year = ?`,
		bidStr, year,
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
	if didStr != "" {
		err = apiCfg.DB.QueryRow(
			`SELECT division_id FROM divisions WHERE batch_id = ? AND division_label = ?`,
			batchID, didStr,
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

	var divisionArg interface{} = nil
	if divisionID.Valid {
		divisionArg = divisionID.Int64
	}

	query := `
		INSERT INTO extra_classes
			(faculty_id, course_id, batch_id, division_id, room_id, day_of_week, time_slot, class_date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = apiCfg.DB.Exec(query,
		fid,
		cidStr,
		batchID,
		divisionArg,
		ridStr,
		day,
		tid,
		dateStr,
	)
	if err != nil {
		log.Println("DB error (insert extra class):", err)
		respondWithError(w, 500, "Failed to schedule extra class")
		return
	}

	respondWithJSON(w, 200, map[string]string{"message": "Extra class scheduled successfully!"})
}
