package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Shayaan-Kashif/Database-Project/internal/auth"
	"github.com/Shayaan-Kashif/Database-Project/internal/database"
	"github.com/joho/godotenv"
	"github.com/lib/pq"
)

type apiConfig struct {
	dbQueries *database.Queries
	JWTSecret string
	adminCode string
	db        *sql.DB
}

type ctxkey string

const (
	ctxUserID ctxkey = "userID"
	ctxRole   ctxkey = "role"
)

func main() {
	godotenv.Load()

	dbURL := os.Getenv("DB_URL")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		fmt.Println("Cannot load database")
		return
	}

	apiConfig := apiConfig{
		dbQueries: database.New(db),
		JWTSecret: os.Getenv("JWTSecret"),
		adminCode: os.Getenv("ADMINCODE"),
		db:        db,
	}

	serverMux := http.NewServeMux()

	server := http.Server{
		Addr:    ":8080",
		Handler: withCORS(serverMux),
	}

	serverMux.HandleFunc("GET /api/health", readiness)
	serverMux.HandleFunc("POST /api/testDB", apiConfig.testDB)
	serverMux.HandleFunc("POST /api/users", apiConfig.signUp)
	serverMux.HandleFunc("POST /api/login", apiConfig.login)
	serverMux.Handle("GET /api/user", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.getUserFromID)))
	serverMux.HandleFunc("POST /api/refresh", apiConfig.refresh)
	serverMux.HandleFunc("GET /api/parkingLots", apiConfig.getParkingLots)
	serverMux.HandleFunc("GET /api/parkingLots/{lotID}", apiConfig.getParkingLotFromID)
	serverMux.Handle("POST /api/parkingLots", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.createParkingLot)))
	serverMux.Handle("POST /api/reviews", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.CreateReview)))
	serverMux.Handle("PATCH /api/reviews/{lotID}", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.ModifyReview)))
	serverMux.HandleFunc("GET /api/reviews/{lotID}", apiConfig.getReviewsFromLotID)
	serverMux.HandleFunc("GET /api/topRatedLots", apiConfig.getTopRatedLots)
	serverMux.Handle("GET /api/avgTimeParked", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.getAvgTimeParkedFromUserID)))
	serverMux.HandleFunc("GET /api/countOfLogsPerUser", apiConfig.getCountOfLogsPerUser)
	serverMux.Handle("GET /api/highestLowestRatings", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.getHighestLowestRatingsFromUserID)))
	serverMux.HandleFunc("GET /api/averageLotRating/{lotID}", apiConfig.getAverageLotRatingFromID)
	serverMux.HandleFunc("GET /api/countOfReviewsPerUser", apiConfig.getCountOfReviewsPerUser)
	serverMux.HandleFunc("GET /api/countOfReviewsPerLot", apiConfig.getCountOfReviewsPerLot)
	serverMux.HandleFunc("GET /api/countOfLogsPerLot", apiConfig.getCountOfLogsPerLot)
	serverMux.HandleFunc("GET /api/fullLots", apiConfig.getFullLots)
	serverMux.Handle("POST /api/park", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.park)))
	serverMux.Handle("GET /api/parkingLogs", apiConfig.authMiddleWare(http.HandlerFunc(apiConfig.getParkingLogsFromUserID)))

	fmt.Println("server is running on http://localhost:8080")

	server.ListenAndServe()

}

func respondWithError(res http.ResponseWriter, code int, msg string) {
	errorStruct := struct {
		Error string `json:"error"`
	}{
		Error: msg,
	}
	dat, err := json.Marshal(errorStruct)

	if err != nil {
		log.Printf("Error marshalling JSON: %s", err)
		res.WriteHeader(500)
		return
	}

	res.Header().Set("Content-Type", "application/json")
	res.WriteHeader(code)
	res.Write(dat)
}

func respondWithJSON(res http.ResponseWriter, code int, payload interface{}) {
	dat, err := json.Marshal(payload)

	if err != nil {
		log.Printf("Error marshalling JSON: %s", err)
		res.WriteHeader(500)
		return
	}
	res.Header().Set("Content-Type", "application/json")
	res.WriteHeader(code)
	res.Write(dat)

}

func decodeJSON[T any](req *http.Request, insert *T) error {
	decoder := json.NewDecoder(req.Body)
	if err := decoder.Decode(insert); err != nil {
		return err
	}
	return nil
}

func readiness(res http.ResponseWriter, req *http.Request) {
	status := struct {
		Status string `json:"status"`
	}{Status: "the server is running fine"}
	respondWithJSON(res, 200, status)
}

func (cfg *apiConfig) testDB(res http.ResponseWriter, req *http.Request) {
	_, err := cfg.dbQueries.CreateTest(req.Context())

	if err != nil {
		respondWithError(res, 500, fmt.Sprintf("db error: %v", err))
		return
	}

	response := struct {
		Message string `json:"message"`
	}{"the test db works"}

	respondWithJSON(res, 200, response)

}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		res.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		res.Header().Set("Access-Control-Allow-Credentials", "true")
		res.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		res.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if req.Method == http.MethodOptions {
			res.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(res, req)
	})
}

func (cfg *apiConfig) authMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		token, err := auth.GetBearerToken(req.Header)
		if err != nil {
			respondWithError(res, http.StatusBadRequest, err.Error())
			return
		}

		userID, role, err := auth.ValidateJWT(token, cfg.JWTSecret)
		if err != nil {
			respondWithError(res, http.StatusUnauthorized, err.Error())
			return
		}

		ctx := req.Context()

		ctx = context.WithValue(ctx, ctxUserID, userID)
		ctx = context.WithValue(ctx, ctxRole, role)

		next.ServeHTTP(res, req.WithContext(ctx))

	})
}

func handlePgConstraints(err error) (bool, string) {
	var pqErr *pq.Error
	//postgres violation codes: unique, foreign key, check, not null violation in that order
	if errors.As(err, &pqErr) && (pqErr.Code == "23505" || pqErr.Code == "23503" || pqErr.Code == "23514" || pqErr.Code == "23502") {
		return true, pqErr.Message
	}

	return false, ""
}
