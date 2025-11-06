package main

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/Shayaan-Kashif/Database-Project/internal/auth"
	"github.com/Shayaan-Kashif/Database-Project/internal/database"
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
		SameSite: http.SameSiteNoneMode,
		Path:     "/api/refresh",
		MaxAge:   3600,
	})

	responseStruct := struct {
		AccessToken string `json:"access_token"`
		Name        string `json:"name"`
	}{
		AccessToken: JWT,
		Name:        userDB.Name,
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

	if time.Now().After(dbToken.ExpiresAt) {
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
	}{AccessToken: JWT})

}
