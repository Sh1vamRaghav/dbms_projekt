package main

import(
	"net/http"
)

func(apicfg *apiConfig) handlerListTimeSlots(w http.ResponseWriter, r *http.Request){
	rows, err := apicfg.DB.Query("select time_slot_id, start_time, end_time from time_slots ORDER BY time_slot_id")
	if err != nil{
		respondWithError(w, 500, "database error")
		return
	}
	defer rows.Close()
	
	type timeSlot struct{
		TimeSlotID int `json:"time_slot_id"`
		StartTime string `json:"start_time"`
		EndTime string `json:"end_time"`
	}

	var list []timeSlot
	for rows.Next() {
		var c timeSlot

		rows.Scan(&c.TimeSlotID, &c.StartTime, &c.EndTime)
		list = append(list, c)
	}
	respondWithJSON(w, 200, list)

}