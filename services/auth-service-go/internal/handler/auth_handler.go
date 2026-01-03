package handlerauth

import (
	"auth-service-go/internal/auth"
	"auth-service-go/internal/models"
	"auth-service-go/internal/store"
	"encoding/json"
	"github.com/gorilla/mux"

	"fmt"
	"net/http"
	"strconv"
	"time"
)

type AuthHandler struct {
	Store *store.Storage
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var creds models.User

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	hashedPassword, _ := auth.HashPassword(creds.Password)
	creds.Password = hashedPassword

	roleID, err := h.Store.GetUserRoleIDByName(creds.Role)
	if err != nil {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	if err := h.Store.CreateUser(&creds, roleID); err != nil {
		http.Error(w, "Could not create user", http.StatusInternalServerError)
		return
	}

	accToken, refToken, err := auth.GenerateTokens(creds.ID, creds.Username, creds.Email, creds.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	expirationDate := time.Now().Add(7 * 24 * time.Hour)

	err = h.Store.SaveRefreshToken(creds.ID, refToken, expirationDate)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"user_id": strconv.Itoa(creds.ID), "user_name": creds.Username, "user_role": creds.Role, "access_token": accToken, "refresh_token": refToken})
	w.WriteHeader(http.StatusCreated)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var creds models.User

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		fmt.Println("INVALID REQUEST")
		return
	}

	user, err := h.Store.GetUserByEmail(creds.Email)
	if err != nil || !auth.CheckPassword(creds.Password, user.Password) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		fmt.Println("INVALID CREDS")
		return
	}

	accToken, refToken, err := auth.GenerateTokens(user.ID, user.Username, user.Email, user.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	expirationDate := time.Now().Add(7 * 24 * time.Hour)

	err = h.Store.SaveRefreshToken(user.ID, refToken, expirationDate)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"user_name": user.Username, "user_id": strconv.Itoa(user.ID), "user_role": user.Role, "access_token": accToken, "refresh_token": refToken})
}

func (h *AuthHandler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	var user *models.UserPublic
	fmt.Println("PROFILE QUERIED")

	userIDStr := vars["userID"]
	if userIDStr == "" {
		http.Error(w, "User ID not found", http.StatusUnauthorized)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID format", http.StatusBadRequest)
		return
	}

	user, err = h.Store.GetUserByID(userID)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]*models.UserPublic{"userData": user})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var Token models.Token
	if err := json.NewDecoder(r.Body).Decode(&Token); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	userID, err := h.Store.ValidateRefreshToken(Token.RefreshToken)
	if err != nil {
		http.Error(w, "Invalid or expired refresh token", http.StatusUnauthorized)
		return
	}

	User, err := h.Store.GetUserByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusBadRequest)
		return
	}

	h.Store.RevokeRefreshToken(Token.RefreshToken)

	newAccToken, refToken, err := auth.GenerateTokens(userID, User.Username, User.Email, User.Role)
	if err != nil {
		http.Error(w, "Error refreshing the refresh token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"access_token": newAccToken, "refresh_token": refToken})
}

func (h *AuthHandler) GetNewAccToken(w http.ResponseWriter, r *http.Request) {
	var Token models.Token

	if err := json.NewDecoder(r.Body).Decode(&Token); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	userID, err := h.Store.ValidateRefreshToken(Token.RefreshToken)
	if err != nil {
		http.Error(w, "Invalid or expired refresh token", http.StatusUnauthorized)
		return
	}

	User, err := h.Store.GetUserByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusBadRequest)
		return
	}

	newAccToken, _, err := auth.GenerateTokens(userID, User.Username, User.Email, User.Role)
	if err != nil {
		http.Error(w, "Error issuing new access token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"access_token": newAccToken})
}
