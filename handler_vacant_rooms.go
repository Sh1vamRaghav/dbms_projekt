package main

import (
	"log"
	"net/http"
	"strconv"
)

func (apiCfg *apiConfig) handlerVacantRooms(w http.ResponseWriter, r *http.Request) {
	dayStr := r.URL.Query().Get("day")
	tidStr := r.URL.Query().Get("tid")
	dateStr := r.URL.Query().Get("date")

	if dayStr == "" || tidStr == "" {
		respondWithError(w, 400, "Missing required fields: day or time slot")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		respondWithError(w, 400, "Invalid day")
		return
	}
	tid, err := strconv.Atoi(tidStr)
	if err != nil {
		respondWithError(w, 400, "Invalid time slot")
		return
	}

	query := `
		SELECT room_id FROM rooms
		WHERE room_id NOT IN (
			SELECT room_id FROM timetable WHERE day_of_week = ? AND time_slot = ?
			UNION
			SELECT room_id FROM extra_classes WHERE day_of_week = ? AND time_slot = ? AND class_date = ?
		)
		ORDER BY room_id;
	`

	rows, err := apiCfg.DB.Query(query, day, tid, day, tid, dateStr)
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
