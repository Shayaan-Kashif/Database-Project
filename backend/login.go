package main

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/Shayaan-Kashif/Database-Project/internal/auth"
	"github.com/Shayaan-Kashif/Database-Project/internal/database"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

func (cfg *apiConfig) signUp(res http.ResponseWriter, req *http.Request) {
	reqStruct := struct {
		Email     *string `json:"email"`
		Password  *string `json:"password"`
		Name      *string `json:"name"`
		AdminCode string  `json:"adminCode"`
	}{}

	if err := decodeJSON(req, &reqStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if reqStruct.Name == nil || reqStruct.Password == nil || reqStruct.Email == nil {
		respondWithError(res, http.StatusBadRequest, "invalid json structure")
		return
	}

	role := "user"

	if reqStruct.AdminCode == cfg.adminCode {
		role = "admin"
	} else if reqStruct.AdminCode != "" {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	}

	hashed_password, err := auth.Hashpassword(*reqStruct.Password)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	userDBEntry, err := cfg.dbQueries.CreateUser(req.Context(), database.CreateUserParams{
		Name:           *reqStruct.Name,
		Email:          *reqStruct.Email,
		HashedPassword: hashed_password,
		Role:           role,
	})

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	responceStruct := struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Role  string `json:"role"`
	}{
		Name:  userDBEntry.Name,
		Email: userDBEntry.Email,
		Role:  userDBEntry.Role,
	}

	respondWithJSON(res, http.StatusCreated, responceStruct)

}

func (cfg *apiConfig) login(res http.ResponseWriter, req *http.Request) {
	reqStruct := struct {
		Email    *string `json:"email"`
		Password *string `json:"password"`
	}{}

	if err := decodeJSON(req, &reqStruct); err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	if reqStruct.Email == nil || reqStruct.Password == nil {
		respondWithError(res, http.StatusBadRequest, "invalid JSON structure")
		return
	}

	userDB, err := cfg.dbQueries.GetUserFromEmail(req.Context(), *reqStruct.Email)

	if err == sql.ErrNoRows { //user does not exist with that email
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	} else if err != nil { //other server error
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	correctPassword, err := auth.CheckPasswordHash(*reqStruct.Password, userDB.HashedPassword)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	if !correctPassword {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	}

	//code below assumes the client is authenticated

	JWT, err := auth.MakeJWT(userDB.ID, userDB.Role, cfg.JWTSecret, (15 * time.Minute))
	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	refreshToken := ""

	for tries := 1; tries <= 3; tries++ {
		refreshToken, err = auth.MakeRefreshToken()

		if err != nil {
			respondWithError(res, http.StatusInternalServerError, err.Error())
			return
		}

		_, err = cfg.dbQueries.CreateRefreshToken(req.Context(), database.CreateRefreshTokenParams{
			Token:     refreshToken,
			UserID:    userDB.ID,
			ExpiresAt: time.Now().Add(time.Hour),
		})

		if err == nil {
			break
		}

		var pqErr *pq.Error
		if !(errors.As(err, &pqErr) && pqErr.Code == "23505") { //database connection error
			respondWithError(res, http.StatusInternalServerError, err.Error())
			return
		}

	}

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error()) //if unique refreshtoken cannnot be made
		return
	}

	http.SetCookie(res, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   false, //only for dev side, true for production
		SameSite: http.SameSiteLaxMode,
		Path:     "/api/refresh",
		MaxAge:   3600,
	})

	responseStruct := struct {
		AccessToken string `json:"access_token"`
		Name        string `json:"name"`
		Role        string `json:"role"`
	}{
		AccessToken: JWT,
		Name:        userDB.Name,
		Role:        userDB.Role,
	}

	respondWithJSON(res, http.StatusOK, responseStruct)

}

func (cfg *apiConfig) refresh(res http.ResponseWriter, req *http.Request) {
	refreshToken, err := auth.GetRefreshTokenFromCookie(req)
	if err != nil {
		respondWithError(res, http.StatusBadRequest, err.Error())
		return
	}

	dbToken, err := cfg.dbQueries.GetRefreshToken(req.Context(), refreshToken)

	if err == sql.ErrNoRows {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	} else if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	if dbToken.RevokedAt.Valid {
		respondWithError(res, http.StatusUnauthorized, "refresh token revoked/expired")
		return
	}

	if time.Now().Before(dbToken.ExpiresAt) {
		if !dbToken.RevokedAt.Valid {
			if err := cfg.dbQueries.RevokeToken(req.Context(), refreshToken); err != nil {
				respondWithError(res, http.StatusInternalServerError, err.Error())
				return
			}
		}

		respondWithError(res, http.StatusUnauthorized, "refresh token expired")
		return
	}

	JWT, err := auth.MakeJWT(dbToken.UserID, dbToken.Role, cfg.JWTSecret, 15*time.Minute)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(res, http.StatusOK, struct {
		AccessToken string `json:"access_token"`
		Role        string `json:"role"`
	}{AccessToken: JWT, Role: dbToken.Role})

}

func (cfg *apiConfig) getUserFromID(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	userDB, err := cfg.dbQueries.GetUserFromID(req.Context(), userID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := struct {
		ID           uuid.UUID     `json:"id"`
		Name         string        `json:"name"`
		Email        string        `json:"email"`
		Role         string        `json:"role"`
		ParkingLotID uuid.NullUUID `json:"parkingLotID"`
		CreatedAt    time.Time     `json:"createdAt"`
		UpdatedAt    time.Time     `json:"updatedAt"`
	}{
		ID:           userDB.ID,
		Name:         userDB.Name,
		Email:        userDB.Email,
		Role:         userDB.Role,
		ParkingLotID: userDB.ParkingLotID,
		CreatedAt:    userDB.CreatedAt,
		UpdatedAt:    userDB.UpdatedAt,
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) getAllUsers(res http.ResponseWriter, req *http.Request) {
	role := req.Context().Value(ctxRole).(string)

	if role != "admin" {
		respondWithError(res, http.StatusUnauthorized, "Unauthorized")
		return
	}

	usersDB, err := cfg.dbQueries.GetAllUsers(req.Context())

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	response := make([]struct {
		ID           uuid.UUID     `json:"id"`
		Name         string        `json:"name"`
		Email        string        `json:"email"`
		Role         string        `json:"role"`
		ParkingLotID uuid.NullUUID `json:"parkingLotID"`
		CreatedAt    time.Time     `json:"createdAt"`
		UpdatedAt    time.Time     `json:"updatedAt"`
	}, 0, len(usersDB))

	for _, u := range usersDB {
		response = append(response, struct {
			ID           uuid.UUID     `json:"id"`
			Name         string        `json:"name"`
			Email        string        `json:"email"`
			Role         string        `json:"role"`
			ParkingLotID uuid.NullUUID `json:"parkingLotID"`
			CreatedAt    time.Time     `json:"createdAt"`
			UpdatedAt    time.Time     `json:"updatedAt"`
		}{
			ID:           u.ID,
			Name:         u.Name,
			Email:        u.Email,
			Role:         u.Role,
			ParkingLotID: u.ParkingLotID,
			CreatedAt:    u.CreatedAt,
			UpdatedAt:    u.CreatedAt,
		})
	}

	respondWithJSON(res, http.StatusOK, response)
}

func (cfg *apiConfig) deleteUser(res http.ResponseWriter, req *http.Request) {
	userID := req.Context().Value(ctxUserID).(uuid.UUID)

	sqlResult, err := cfg.dbQueries.DeleteUser(req.Context(), userID)

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	rowsAffected, _ := sqlResult.RowsAffected()
	if rowsAffected == 0 {
		respondWithError(res, http.StatusNotFound, "No user with this ID was found")
		return
	}

	responseStruct := struct {
		Status string `json:"status"`
	}{"The user has been deleted"}

	respondWithJSON(res, http.StatusOK, responseStruct)
}
