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

func (cfg *apiConfig) deleteParkingLot(res http.ResponseWriter, req *http.Request) {
	role := req.Context().Value(ctxRole).(string)

	if role != "admin" {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	}

	lotID, err := uuid.Parse(req.PathValue("lotID"))

	if err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	sqlResult, err := cfg.dbQueries.DeleteParkingLot(req.Context(), lotID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	rowsAffected, _ := sqlResult.RowsAffected()
	if rowsAffected == 0 {
		respondWithError(res, http.StatusNotFound, "No lot with this ID was found")
		return
	}

	responseStruct := struct {
		Status string `json:"status"`
	}{"The parking lot has been deleted"}

	respondWithJSON(res, http.StatusOK, responseStruct)
}

func (cfg *apiConfig) updateParkingLot(res http.ResponseWriter, req *http.Request) {
	role := req.Context().Value(ctxRole).(string)

	if role != "admin" {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	}

	lotID, err := uuid.Parse(req.PathValue("lotID"))

	if err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	reqStruct := struct {
		Name  *string `json:"name"`
		Slots *int32  `json:"slots"`
	}{}

	if err := decodeJSON(req, &reqStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if reqStruct.Name == nil && reqStruct.Slots == nil {
		respondWithError(res, http.StatusBadRequest, "modification request invalid")
		return
	}

	currentToModifiedLot, err := cfg.dbQueries.GetParkingLotFromID(req.Context(), lotID)

	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(res, http.StatusBadRequest, "no lot exist for that parkinglotID")
			return
		}

		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	if reqStruct.Name != nil {
		if *reqStruct.Name == "" {
			respondWithError(res, http.StatusBadRequest, "name cannot be empty")
			return
		}
		currentToModifiedLot.Name = *reqStruct.Name
	}

	if reqStruct.Slots != nil {
		if *reqStruct.Slots < currentToModifiedLot.Occupiedslots {
			respondWithError(res, http.StatusBadRequest, "slots cannot be smaller than occupied slots")
			return
		}
		currentToModifiedLot.Slots = *reqStruct.Slots
	}

	err = cfg.dbQueries.UpdateParkingLot(req.Context(), database.UpdateParkingLotParams{
		Name:  currentToModifiedLot.Name,
		Slots: currentToModifiedLot.Slots,
		ID:    lotID,
	})

	hasPgErr, message := handlePgConstraints(err)

	if hasPgErr {
		respondWithError(res, http.StatusBadRequest, message)
		return
	}

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	responceStruct := struct {
		Status string `json:"status"`
	}{"The parking lot has been modified"}

	respondWithJSON(res, http.StatusOK, responceStruct)

}
