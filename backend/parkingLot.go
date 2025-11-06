package main

import (
	"net/http"

	"github.com/google/uuid"
)

func (cfg *apiConfig) getParkingLots(res http.ResponseWriter, req *http.Request) {
	parkingLotDB, err := cfg.dbQueries.GetParkingLots(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID            uuid.UUID `json:"id"`
		Name          string    `json:"name"`
		Slots         int32     `json:"slots"`
		Occupiedslots int32     `json:"ocupiedSlots"`
	}, 0, len(parkingLotDB))

	for _, u := range parkingLotDB {
		response = append(response, struct {
			ID            uuid.UUID `json:"id"`
			Name          string    `json:"name"`
			Slots         int32     `json:"slots"`
			Occupiedslots int32     `json:"ocupiedSlots"`
		}{
			ID:            u.ID,
			Name:          u.Name,
			Slots:         u.Slots,
			Occupiedslots: u.Occupiedslots,
		})
	}

	respondWithJSON(res, http.StatusCreated, response)

}
