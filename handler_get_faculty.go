package main

import "net/http"

func (apiCfg *apiConfig) handlerListFaculty(w http.ResponseWriter, r *http.Request) {
    rows, err := apiCfg.DB.Query(`SELECT faculty_id, faculty_name FROM faculty ORDER BY faculty_name`)
    if err != nil {
        respondWithError(w, 500, "Database error")
        return
    }
    defer rows.Close()

    type Faculty struct {
        ID   int    `json:"faculty_id"`
        Name string `json:"faculty_name"`
    }

    var list []Faculty
    for rows.Next() {
        var f Faculty
        if err := rows.Scan(&f.ID, &f.Name); err != nil {
            respondWithError(w, 500, "Scan error")
            return
        }
        list = append(list, f)
    }

    respondWithJSON(w, 200, list)
}
