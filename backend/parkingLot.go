package main

import (
	"database/sql"
	"net/http"

	"github.com/Shayaan-Kashif/Database-Project/internal/database"
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

	respondWithJSON(res, http.StatusOK, response)

}

func (cfg *apiConfig) createParkingLot(res http.ResponseWriter, req *http.Request) {
	reqStruct := struct {
		Name  *string `json:"name"`
		Slots *int32  `json:"slots"`
	}{}

	if err := decodeJSON(req, &reqStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if reqStruct.Name == nil || reqStruct.Slots == nil {
		respondWithError(res, http.StatusBadRequest, "Invalid JSON structure")
		return
	}

	role := req.Context().Value(ctxRole).(string)

	if role != "admin" {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	}

	parkingLotDBEntry, err := cfg.dbQueries.CreateParkingLot(req.Context(), database.CreateParkingLotParams{
		Name:  *reqStruct.Name,
		Slots: *reqStruct.Slots,
	})

	if err != nil {

		hasPgErr, message := handlePgConstraints(err)
		if hasPgErr {
			respondWithError(res, http.StatusBadRequest, message)
			return
		}

		respondWithError(res, http.StatusInternalServerError, err.Error())
		return

	}

	responseStruct := struct {
		ID            uuid.UUID `json:"id"`
		Name          string    `json:"name"`
		Slots         int32     `json:"slots"`
		Occupiedslots int32     `json:"occupiedSlots"`
	}{
		ID:            parkingLotDBEntry.ID,
		Name:          parkingLotDBEntry.Name,
		Slots:         parkingLotDBEntry.Slots,
		Occupiedslots: parkingLotDBEntry.Occupiedslots,
	}

	respondWithJSON(res, http.StatusCreated, responseStruct)
}

func (cfg *apiConfig) getParkingLotFromID(res http.ResponseWriter, req *http.Request) {
	lotID, err := uuid.Parse(req.PathValue("lotID"))

	if err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	parkingLotDB, err := cfg.dbQueries.GetParkingLotFromID(req.Context(), lotID)

	if err == sql.ErrNoRows {
		respondWithError(res, http.StatusBadRequest, "No lot for this uuid")
	}
	if err != nil {

		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := struct {
		ID            uuid.UUID `json:"id"`
		Name          string    `json:"name"`
		Slots         int32     `json:"slots"`
		Occupiedslots int32     `json:"ocupiedSlots"`
	}{
		ID:            parkingLotDB.ID,
		Name:          parkingLotDB.Name,
		Slots:         parkingLotDB.Slots,
		Occupiedslots: parkingLotDB.Occupiedslots,
	}

	respondWithJSON(res, http.StatusOK, response)
}
