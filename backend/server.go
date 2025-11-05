package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Shayaan-Kashif/Database-Project/internal/database"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type apiConfig struct {
	dbQueries *database.Queries
	JWTSecret string
	adminCode string
}

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
	serverMux.HandleFunc("POST /api/refresh", apiConfig.refresh)
	

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
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request){
		res.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		res.Header().Set("Access-Control-Allow-Credentials", "true")
		res.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		res.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if req.Method == http.MethodOptions{
			res.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(res, req)
	})
}
