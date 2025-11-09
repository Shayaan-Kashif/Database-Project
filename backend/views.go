package main

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/google/uuid"
)

func (cfg *apiConfig) getReviewsFromLotID(res http.ResponseWriter, req *http.Request) {
	lotID, err := uuid.Parse(req.PathValue("lotID"))

	if err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	reviewsViewDB, err := cfg.dbQueries.GetReviewsFromLotID(req.Context(), lotID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		UserID      uuid.UUID      `json:"userID"`
		UserName    string         `json:"userName"`
		LotID       uuid.UUID      `json:"lotID"`
		LotName     string         `json:"lotName"`
		Title       string         `json:"title"`
		Description sql.NullString `json:"description"`
		Score       int32          `json:"score"`
		CreatedAt   time.Time      `json:"createdAt"`
		UpdatedAt   time.Time      `json:"updatedAt"`
	}, 0, len(reviewsViewDB))

	for _, u := range reviewsViewDB {
		response = append(response, struct {
			UserID      uuid.UUID      `json:"userID"`
			UserName    string         `json:"userName"`
			LotID       uuid.UUID      `json:"lotID"`
			LotName     string         `json:"lotName"`
			Title       string         `json:"title"`
			Description sql.NullString `json:"description"`
			Score       int32          `json:"score"`
			CreatedAt   time.Time      `json:"createdAt"`
			UpdatedAt   time.Time      `json:"updatedAt"`
		}{
			UserID:      u.Userid,
			UserName:    u.Username,
			LotID:       u.Lotid,
			LotName:     u.Lotname,
			Title:       u.Title,
			Description: u.Description,
			Score:       u.Score,
			CreatedAt:   u.CreatedAt,
			UpdatedAt:   u.UpdatedAt,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}
