package main

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
)

type TimetableEntry struct {
    CourseID      string `json:"course_id"`
    DivisionLabel string `json:"division_label"`
    DayName       string `json:"day_name"`
    RoomID        string `json:"room_id"`
    StartTime     string `json:"start_time"`
    EndTime       string `json:"end_time"`
}

func (apiCfg *apiConfig) handlerTimetableByBatchYear(w http.ResponseWriter, r *http.Request) {
    batch := r.URL.Query().Get("batch")
    yearStr := r.URL.Query().Get("year")
    dayStr := r.URL.Query().Get("day")

    if batch == "" || yearStr == "" {
        respondWithError(w, 400, "Missing 'batch' or 'year' query parameter")
        return
    }

    year, err := strconv.Atoi(yearStr)
    if err != nil {
        respondWithError(w, 400, "Invalid year value")
        return
    }

    day, err := strconv.Atoi(dayStr)
    if err != nil{
        respondWithError(w, 400, "Invalid day selected")
        return
    }

    var rows *sql.Rows
    if day != 0{
        query := `
            SELECT 
                timetable.course_id,
                COALESCE(divisions.division_label, 'Combined Batch') AS division_label,
                days.day_name,
                timetable.room_id,
                time_slots.start_time,
                time_slots.end_time
            FROM timetable
            JOIN time_slots ON timetable.time_slot = time_slots.time_slot_id
            JOIN days ON timetable.day_of_week = days.day_of_week
            LEFT JOIN divisions ON timetable.division_id = divisions.division_id
            JOIN batches ON timetable.batch_id = batches.batch_id
            WHERE batches.batch_name = ? AND batches.admission_year = ? AND days.day_of_week = ?
            ORDER BY timetable.day_of_week, time_slots.start_time;
        `
        rows, err = apiCfg.DB.Query(query, batch, year, day)
    }else{
        query := `
            SELECT 
                timetable.course_id,
                COALESCE(divisions.division_label, 'Combined Batch') AS division_label,
                days.day_name,
                timetable.room_id,
                time_slots.start_time,
                time_slots.end_time
            FROM timetable
            JOIN time_slots ON timetable.time_slot = time_slots.time_slot_id
            JOIN days ON timetable.day_of_week = days.day_of_week
            LEFT JOIN divisions ON timetable.division_id = divisions.division_id
            JOIN batches ON timetable.batch_id = batches.batch_id
            WHERE batches.batch_name = ? AND batches.admission_year = ?
            ORDER BY timetable.day_of_week, time_slots.start_time;
        `
        rows, err = apiCfg.DB.Query(query, batch, year)
     }

    
    if err != nil {
        log.Println("Query error:", err)
        respondWithError(w, 500, "Database query failed")
        return
    }
    defer rows.Close()
    
    var timetable []TimetableEntry
    for rows.Next() {
        var t TimetableEntry
        if err := rows.Scan(&t.CourseID, &t.DivisionLabel, &t.DayName, &t.RoomID, &t.StartTime, &t.EndTime); err != nil {
            log.Println("Scan error:", err)
            respondWithError(w, 500, "Scan error")
            return
        }
        timetable = append(timetable, t)
    }

    respondWithJSON(w, 200, timetable)
}