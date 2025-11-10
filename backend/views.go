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

func (cfg *apiConfig) getTopRatedLots(res http.ResponseWriter, req *http.Request) {
	topRatedLotsDB, err := cfg.dbQueries.GetTopRatedLots(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID       uuid.UUID `json:"id"`
		Name     string    `json:"name"`
		AvgScore string    `json:"avgScore"`
	}, 0, len(topRatedLotsDB))

	for _, u := range topRatedLotsDB {
		response = append(response, struct {
			ID       uuid.UUID `json:"id"`
			Name     string    `json:"name"`
			AvgScore string    `json:"avgScore"`
		}{
			ID:       u.ID,
			Name:     u.Name,
			AvgScore: u.Round,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getAvgTimeParkedFromUserID(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	timeParkedDB, err := cfg.dbQueries.GetAverageParkingTimeFromUserID(req.Context(), userID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := struct {
		Name             string `json:"name"`
		AvgMinutesParked string `json:"avgMinutesParked"`
	}{
		Name:             timeParkedDB.UserName,
		AvgMinutesParked: timeParkedDB.AvgMinutesParked,
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getCountOfLogsPerUser(res http.ResponseWriter, req *http.Request) {
	countOfLogsDB, err := cfg.dbQueries.GetCountOfLogsPerUser(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID           uuid.UUID `json:"id"`
		Name         string    `json:"name"`
		TotalEntries int64     `json:"totalEntries"`
	}, 0, len(countOfLogsDB))

	for _, u := range countOfLogsDB {
		response = append(response, struct {
			ID           uuid.UUID `json:"id"`
			Name         string    `json:"name"`
			TotalEntries int64     `json:"totalEntries"`
		}{
			ID:           u.Userid.UUID,
			Name:         u.Username.String,
			TotalEntries: u.Totalentries,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}
