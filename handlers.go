package main

import (
    // "encoding/json"
    "log"
    "net/http"
)

func (apiCfg *apiConfig) handlerRoomTypes(w http.ResponseWriter, r *http.Request) {
    rows, err := apiCfg.DB.Query("SELECT room_type_id, type_name FROM room_types")
    if err != nil {
        respondWithError(w, 500, "Database query failed")
        log.Println("Query error:", err)
        return
    }
    defer rows.Close()

    type RoomType struct {
        RoomTypeID int    `json:"room_type_id"`
        TypeName   string `json:"type_name"`
    }

    var rooms []RoomType
    for rows.Next() {
        var r RoomType
        if err := rows.Scan(&r.RoomTypeID, &r.TypeName); err != nil {
            respondWithError(w, 500, "Scan error")
            log.Println("Scan error:", err)
            return
        }
        rooms = append(rooms, r)
    }

    respondWithJSON(w, 200, rooms)
}
