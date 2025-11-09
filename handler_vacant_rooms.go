package main

import (
	"log"
	"net/http"
	"strconv"
)

func (apiCfg *apiConfig) handlerVacantRooms(w http.ResponseWriter, r *http.Request) {
	dayStr := r.URL.Query().Get("day")
	startStr := r.URL.Query().Get("start_tid")
	endStr := r.URL.Query().Get("end_tid")

	if dayStr == "" || startStr == "" || endStr == "" {
		respondWithError(w, 400, "Missing required parameters: day, start_tid, or end_tid")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		respondWithError(w, 400, "Invalid day")
		return
	}
	startTid, err := strconv.Atoi(startStr)
	if err != nil {
		respondWithError(w, 400, "Invalid start time slot")
		return
	}
	endTid, err := strconv.Atoi(endStr)
	if err != nil {
		respondWithError(w, 400, "Invalid end time slot")
		return
	}

	if startTid > endTid {
		startTid, endTid = endTid, startTid
	}

	query := `
		SELECT room_id
		FROM rooms
		WHERE room_id NOT IN (
		SELECT room_id
		FROM (
			SELECT room_id, day_of_week, time_slot FROM timetable
			UNION ALL
			SELECT room_id, day_of_week, time_slot FROM extra_classes
		) AS all_classes
		WHERE day_of_week = ? AND time_slot BETWEEN ? AND ?
		)
		ORDER BY room_id;
	`

	rows, err := apiCfg.DB.Query(query, day, startTid, endTid)
	if err != nil {
		log.Println("DB error (vacant rooms):", err)
		respondWithError(w, 500, "Database error fetching vacant rooms")
		return
	}
	defer rows.Close()

	var rooms []string
	for rows.Next() {
		var room string
		if err := rows.Scan(&room); err == nil {
			rooms = append(rooms, room)
		}
	}

	respondWithJSON(w, 200, rooms)
}
