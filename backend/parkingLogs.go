package main

import (
	"net/http"
	"time"

	"github.com/Shayaan-Kashif/Database-Project/internal/database"
	"github.com/google/uuid"
)

func (cfg *apiConfig) park(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)
	userData, err := cfg.dbQueries.GetUserFromID(req.Context(), userID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	tx, err := cfg.db.BeginTx(req.Context(), nil)
	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	defer tx.Rollback()

	qtx := cfg.dbQueries.WithTx(tx)

	requestStruct := struct {
		ParkinglotID *uuid.UUID `json:"parkingLotID"`
		Type         *string    `json:"type"`
	}{}

	if err := decodeJSON(req, &requestStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if requestStruct.ParkinglotID == nil || requestStruct.Type == nil {
		respondWithError(res, http.StatusBadRequest, "incorrect JSON input")
		return
	}

	increment := 0

	if *requestStruct.Type == "entry" {
		if userData.ParkingLotID.Valid {
			respondWithError(res, http.StatusBadRequest, "user already parked at a lot")
			return
		}
		increment = 1
	} else if *requestStruct.Type == "exit" {
		if userData.ParkingLotID.UUID != *requestStruct.ParkinglotID {
			respondWithError(res, http.StatusBadRequest, "user is not parked at that parking lot")
			return
		}
		increment = -1
	} else {
		respondWithError(res, http.StatusBadRequest, "incorrect type input")
		return
	}

	//update the parking lot occupied slots
	err = qtx.UpdateOccupiedSlot(req.Context(), database.UpdateOccupiedSlotParams{
		Occupiedslots: int32(increment),
		ID:            *requestStruct.ParkinglotID,
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

	//update user parkingloginfo
	if increment == 1 {
		err = qtx.UpdateUserParkingLot(req.Context(), database.UpdateUserParkingLotParams{
			ParkingLotID: uuid.NullUUID{
				UUID:  *requestStruct.ParkinglotID,
				Valid: *requestStruct.ParkinglotID != uuid.Nil,
			},
			ID: userData.ID,
		})
	} else {
		err = qtx.UpdateUserParkingLot(req.Context(), database.UpdateUserParkingLotParams{
			ParkingLotID: uuid.NullUUID{
				UUID:  uuid.Nil,
				Valid: false,
			},
			ID: userData.ID,
		})
	}

	if err != nil {

		hasPgErr, message := handlePgConstraints(err)
		if hasPgErr {
			respondWithError(res, http.StatusBadRequest, message)
			return
		}

		respondWithError(res, http.StatusInternalServerError, err.Error())
		return

	}

	//log data
	_, err = qtx.CreateLog(req.Context(), database.CreateLogParams{
		UserID:       userData.ID,
		ParkingLotID: *requestStruct.ParkinglotID,
		EventType:    *requestStruct.Type,
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

	//if each db action is valid

	if err := tx.Commit(); err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(res, http.StatusAccepted, struct {
		Status string `json:"status"`
	}{"accepted parking status"})

}

func (cfg *apiConfig) getParkingLogsFromUserID(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	parkingLogsDB, err := cfg.dbQueries.GetLogsFromUserID(req.Context(), userID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID           uuid.UUID `json:"id"`
		UserID       uuid.UUID `json:"userID"`
		ParkingLotID uuid.UUID `json:"parkingLotID"`
		EventType    string    `json:"eventType"`
		Time         time.Time `json:"time"`
	}, 0, len(parkingLogsDB))

	for _, u := range parkingLogsDB {
		response = append(response, struct {
			ID           uuid.UUID `json:"id"`
			UserID       uuid.UUID `json:"userID"`
			ParkingLotID uuid.UUID `json:"parkingLotID"`
			EventType    string    `json:"eventType"`
			Time         time.Time `json:"time"`
		}{
			ID:           u.ID,
			UserID:       u.UserID,
			ParkingLotID: u.ParkingLotID,
			EventType:    u.EventType,
			Time:         u.Time,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getAllParkingLogs(res http.ResponseWriter, req *http.Request) {
	role := req.Context().Value(ctxRole).(string)

	if role != "admin" {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	}

	parkingLogsDB, err := cfg.dbQueries.GetLogs(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID           uuid.UUID `json:"id"`
		UserID       uuid.UUID `json:"userID"`
		ParkingLotID uuid.UUID `json:"parkingLotID"`
		EventType    string    `json:"eventType"`
		Time         time.Time `json:"time"`
	}, 0, len(parkingLogsDB))

	for _, u := range parkingLogsDB {
		response = append(response, struct {
			ID           uuid.UUID `json:"id"`
			UserID       uuid.UUID `json:"userID"`
			ParkingLotID uuid.UUID `json:"parkingLotID"`
			EventType    string    `json:"eventType"`
			Time         time.Time `json:"time"`
		}{
			ID:           u.ID,
			UserID:       u.UserID,
			ParkingLotID: u.ParkingLotID,
			EventType:    u.EventType,
			Time:         u.Time,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}
