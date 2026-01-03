package auth

import (
	"auth-service-go/internal/models"
	"crypto/rsa"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"time"
)

var privateKey *rsa.PrivateKey

func SetPrivateKey(key *rsa.PrivateKey) {
	privateKey = key
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateTokens(userID int, userName string, email string, role string) (string, string, error) {
	if privateKey == nil {
		return "", "", fmt.Errorf("private key not initialized")
	}

	accessClaims := &models.Claims{
		UserID:   userID,
		UserName: userName,
		Email:    email,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(60 * time.Minute)),
		},
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodRS256, accessClaims).SignedString(privateKey)
	if err != nil {
		return "", "", err
	}

	refreshClaims := &models.Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}

	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodRS256, refreshClaims).SignedString(privateKey)

	return accessToken, refreshToken, err
}
