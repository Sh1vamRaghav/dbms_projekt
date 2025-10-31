package main

import(
	"net/http"
)

func(apicfg *apiConfig)handlerListRooms(w http.ResponseWriter, r *http.Request){
	rows, err := apicfg.DB.Query("SELECT room_id FROM rooms ORDER BY room_id")
	if err != nil{
		respondWithError(w, 500, "couldn't fetch rooms")
	}
	defer rows.Close()

	type Room struct{
		Room_id string `json:"room_id"`
	}

	var list []Room
	for rows.Next() {
		var r Room
		rows.Scan(&r.Room_id)
		list = append(list, r)
	}
	respondWithJSON(w, 200, list)
}