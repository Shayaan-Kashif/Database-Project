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
		UserName    string         `json:"username"`
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
			UserName    string         `json:"username"`
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

func (cfg *apiConfig) getHighestLowestRatingsFromUserID(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	highestLowestRatingsDB, err := cfg.dbQueries.GetHighestLowestRatingsFromUserID(req.Context(), userID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		UserID      uuid.UUID      `json:"userID"`
		UserName    string         `json:"username"`
		LotID       uuid.UUID      `json:"lotID"`
		LotName     string         `json:"lotName"`
		Title       string         `json:"title"`
		Description sql.NullString `json:"description"`
		Score       int32          `json:"score"`
		CreatedAt   time.Time      `json:"createdAt"`
		UpdatedAt   time.Time      `json:"updatedAt"`
		ReviewType  string         `json:"reviewType"`
	}, 0, len(highestLowestRatingsDB))

	for _, u := range highestLowestRatingsDB {
		response = append(response, struct {
			UserID      uuid.UUID      `json:"userID"`
			UserName    string         `json:"username"`
			LotID       uuid.UUID      `json:"lotID"`
			LotName     string         `json:"lotName"`
			Title       string         `json:"title"`
			Description sql.NullString `json:"description"`
			Score       int32          `json:"score"`
			CreatedAt   time.Time      `json:"createdAt"`
			UpdatedAt   time.Time      `json:"updatedAt"`
			ReviewType  string         `json:"reviewType"`
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
			ReviewType:  u.Reviewtype,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getAverageLotRatingFromID(res http.ResponseWriter, req *http.Request) {
	lotID, err := uuid.Parse(req.PathValue("lotID"))

	if err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	averageLotRatingDB, err := cfg.dbQueries.GetAverageLotRatingFromID(req.Context(), lotID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := struct {
		AverageRating string `json:"averageRating"`
		TotalReviews  int64  `json:"totalReviewCount"`
	}{
		AverageRating: averageLotRatingDB.Averagerating,
		TotalReviews:  averageLotRatingDB.Totalreviews,
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getCountOfReviewsPerUser(res http.ResponseWriter, req *http.Request) {
	countOfReviewsDB, err := cfg.dbQueries.GetCountOfReviewsPerUser(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID           uuid.UUID `json:"id"`
		Name         string    `json:"name"`
		TotalReviews int64     `json:"totalReviews"`
	}, 0, len(countOfReviewsDB))

	for _, u := range countOfReviewsDB {
		response = append(response, struct {
			ID           uuid.UUID `json:"id"`
			Name         string    `json:"name"`
			TotalReviews int64     `json:"totalReviews"`
		}{
			ID:           u.Userid,
			Name:         u.Username,
			TotalReviews: u.Totalreviews,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getCountOfReviewsPerLot(res http.ResponseWriter, req *http.Request) {
	countOfReviewsDB, err := cfg.dbQueries.GetCountOfReviewsPerLot(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID           uuid.UUID `json:"id"`
		Name         string    `json:"name"`
		TotalReviews int64     `json:"totalReviews"`
	}, 0, len(countOfReviewsDB))

	for _, u := range countOfReviewsDB {
		response = append(response, struct {
			ID           uuid.UUID `json:"id"`
			Name         string    `json:"name"`
			TotalReviews int64     `json:"totalReviews"`
		}{
			ID:           u.Lotid,
			Name:         u.Lotname,
			TotalReviews: u.Totalreviews,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getCountOfLogsPerLot(res http.ResponseWriter, req *http.Request) {
	countOfLogsDB, err := cfg.dbQueries.GetCountOfLogsPerLot(req.Context())

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
			ID:           u.Lotid,
			Name:         u.Lotname,
			TotalEntries: u.Totalentries,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getFullLots(res http.ResponseWriter, req *http.Request) {
	fullLotsDB, err := cfg.dbQueries.GetFullLots(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID            uuid.UUID `json:"id"`
		Name          string    `json:"name"`
		Slots         int32     `json:"slots"`
		OccupiedSlots int32     `json:"occupiedSlots"`
	}, 0, len(fullLotsDB))

	for _, u := range fullLotsDB {
		response = append(response, struct {
			ID            uuid.UUID `json:"id"`
			Name          string    `json:"name"`
			Slots         int32     `json:"slots"`
			OccupiedSlots int32     `json:"occupiedSlots"`
		}{
			ID:            u.ID,
			Name:          u.Name,
			Slots:         u.Slots,
			OccupiedSlots: u.Occupiedslots,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}
