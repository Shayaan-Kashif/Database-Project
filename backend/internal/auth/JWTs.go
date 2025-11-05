package auth

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type CustomeClaims struct {
		Role string `json:"role"`
		jwt.RegisteredClaims
	}

func MakeJWT(userID uuid.UUID, role, tokenSecret string, expiresIn time.Duration) (string, error) {

	


	token := jwt.NewWithClaims(jwt.SigningMethodHS256, CustomeClaims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer: "OntarioTechParkingGO",
			IssuedAt: jwt.NewNumericDate(time.Now().UTC()),
			ExpiresAt: jwt.NewNumericDate(time.Now().UTC().Add(expiresIn)),
			Subject: userID.String(),
		},
		
	})

	return token.SignedString([]byte(tokenSecret))

}

func ValidateJWT(tokenString, tokenSecret string) (uuid.UUID, string, error) {
	claim := &CustomeClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claim, func(t *jwt.Token)(interface{}, error){
		return []byte(tokenSecret), nil
	})

	if err != nil {
		return uuid.Nil,"", err
	}

	if token == nil || !token.Valid {
		return uuid.Nil,"", fmt.Errorf("token not valid")
	}

	userID, err := uuid.Parse(claim.Subject)
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("invalid subject UUID")
	}

	return userID, claim.Role, nil
}

func GetBearerToken(header http.Header) (string, error) {
	authData := header.Get("Authorization")
	if authData == "" {
		return authData, fmt.Errorf("there is no token")
	}

	return strings.Fields(authData)[1], nil
}
