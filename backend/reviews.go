package main

import (
	"database/sql"
	"net/http"

	"github.com/Shayaan-Kashif/Database-Project/internal/database"
	"github.com/google/uuid"
)

func (cfg *apiConfig) CreateReview(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	reqStruct := struct {
		ParkingLotID *uuid.UUID `json:"parkingLotID"`
		Title        *string    `json:"title"`
		Description  string     `json:"description"`
		Score        int        `json:"score"`
	}{}

	if err := decodeJSON(req, &reqStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if reqStruct.Title == nil || reqStruct.ParkingLotID == nil {
		respondWithError(res, http.StatusBadRequest, "incorrect JSON structure")
		return
	}

	if *reqStruct.Title == "" {
		respondWithError(res, http.StatusBadRequest, "title cannot be empty")
		return
	}

	_, err := cfg.dbQueries.CreateReview(req.Context(), database.CreateReviewParams{
		UserID:       userID,
		ParkingLotID: *reqStruct.ParkingLotID,
		Title:        *reqStruct.Title,
		Description: sql.NullString{
			String: reqStruct.Description,
			Valid:  reqStruct.Description != "",
		},
		Score: int32(reqStruct.Score),
	})

	if err != nil {
		hasPgErr, pgMessage := handlePgConstraints(err)

		if hasPgErr {
			respondWithError(res, http.StatusBadRequest, pgMessage)
			return
		}

		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	resStruct := struct {
		Status string `json:"status"`
	}{"Review created"}

	respondWithJSON(res, http.StatusCreated, resStruct)

}

func (cfg *apiConfig) ModifyReview(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	parkingLotID, err := uuid.Parse(req.PathValue("lotID"))
	if err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
	}

	reqStruct := struct {
		Title        *string    `json:"title"`
		Description  *string     `json:"description"`
		Score        *int        `json:"score"`
	}{}

	if err := decodeJSON(req, &reqStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if  (reqStruct.Title == nil && reqStruct.Description == nil && reqStruct.Score == nil) {
		respondWithError(res, http.StatusBadRequest, "modification request invalid")
		return
	}

	currentToModifiedReview, err := cfg.dbQueries.GetReviewByID(req.Context(), database.GetReviewByIDParams{
		UserID:       userID,
		ParkingLotID: parkingLotID,
	})
	

	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(res, http.StatusBadRequest, "no review exisit for that user and parkinglotID")
			return
		}

		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	if reqStruct.Title != nil {
		if *reqStruct.Title == "" {
			respondWithError(res, http.StatusBadRequest, "title cannot be empty")
			return
		}
		currentToModifiedReview.Title = *reqStruct.Title
	}

	if reqStruct.Description != nil {
		currentToModifiedReview.Description.String = *reqStruct.Description
		currentToModifiedReview.Description.Valid = *reqStruct.Description != ""
	}

	if reqStruct.Score != nil {
		currentToModifiedReview.Score = int32(*reqStruct.Score)
	}

	err = cfg.dbQueries.UpdateReview(req.Context(), database.UpdateReviewParams{
		Title: currentToModifiedReview.Title,
		Description: currentToModifiedReview.Description,
		Score: currentToModifiedReview.Score,
		UserID: userID,
		ParkingLotID: parkingLotID,
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

	responceStruct := struct{
		Status string `json:"status"`
	}{"The review has been modified"}

	respondWithJSON(res, http.StatusOK,responceStruct )

}
