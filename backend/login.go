package main

import (
	"net/http"

	"github.com/Shayaan-Kashif/Database-Project/internal/auth"
	"github.com/Shayaan-Kashif/Database-Project/internal/database"
)

func (cfg *apiConfig) signUp(res http.ResponseWriter, req *http.Request) {
	reqStruct := struct {
		Email     *string `json:"email"`
		Password  *string `json:"password"`
		Name      *string `json:"name"`
		AdminCode  string `json:"adminCode"`
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
		Name: *reqStruct.Name,
		Email: *reqStruct.Email,
		HashedPassword: hashed_password,
		Role: role,
	})

	if err != nil {
		respondWithError(res, http.StatusInternalServerError, err.Error())
		return
	}

	responceStruct := struct{
		Name string `json:"name"`
		Email string `json:"email"`
		Role string `json:"role"`
	}{
		Name: userDBEntry.Name,
		Email: userDBEntry.Email,
		Role: userDBEntry.Role,
	}

	respondWithJSON(res,http.StatusCreated, responceStruct)


}
