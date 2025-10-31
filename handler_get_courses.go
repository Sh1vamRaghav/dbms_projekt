package main

import(
	"net/http"
)

func (apiCfg *apiConfig) handlerListCourses(w http.ResponseWriter, r *http.Request) {
	rows, err := apiCfg.DB.Query("SELECT course_id, course_name FROM courses ORDER BY COURSE_NAME")
	if err != nil {
		respondWithError(w, 500, "Database error")
		return
	}
	defer rows.Close()

	type Course struct {
		CourseID   string    `json:"course_id"`
		CourseName string `json:"course_name"`
	}

	var list []Course
	for rows.Next() {
		var c Course
		rows.Scan(&c.CourseID, &c.CourseName)
		list = append(list, c)
	}
	respondWithJSON(w, 200, list)
}