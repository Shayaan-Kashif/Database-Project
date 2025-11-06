package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
)

func MakeRefreshToken() (string, error) {
	key := make([]byte, 32)

	_, err := rand.Read(key)

	if err != nil {
		return "", err
	}

	return hex.EncodeToString(key), nil
}

func GetRefreshTokenFromCookie(req *http.Request) (string, error){
	cookie, err := req.Cookie("refresh_token")

	if err == http.ErrNoCookie {
		return "", fmt.Errorf("no refresh token found")
	} else if err != nil {
		return "", fmt.Errorf("error reading cookie: %w", err)
	}

	return cookie.Value, nil
}

