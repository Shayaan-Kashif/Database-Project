package main

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/Shayaan-Kashif/Database-Project/internal/database"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

func (cfg *apiConfig) CreateReview(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	reqStruct := struct {
		ParkingLotID uuid.UUID `json:"parkingLotID"`
		Title        *string   `json:"title"`
		Description  string    `json:"description"`
		Score        int       `json:"score"`
	}{}

	if err := decodeJSON(req, &reqStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if reqStruct.Title == nil {
		respondWithError(res, http.StatusBadRequest, "incorrect JSON structure")
		return
	}

	_, err := cfg.dbQueries.CreateReview(req.Context(), database.CreateReviewParams{
		UserID:       userID,
		ParkingLotID: reqStruct.ParkingLotID,
		Title:        *reqStruct.Title,
		Description: sql.NullString{
			String: reqStruct.Description,
			Valid:  reqStruct.Description != "",
		},
		Score: int32(reqStruct.Score),
	})

	var pqErr *pq.Error
	if errors.As(err, &pqErr) && (pqErr.Code == "23505" || pqErr.Code == "23503" || pqErr.Code == "23514") {
		respondWithError(res, http.StatusBadRequest, pqErr.Message)
		return
	}

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	resStruct := struct {
		Status string `json:"status"`
	}{"Review created"}

	respondWithJSON(res, http.StatusCreated, resStruct)

}
