package handler

import (
	"encoding/json"
	"net/http"

	"backend/internal/middleware"
	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/session"
)

type AuthHandler struct {
	authService *service.AuthService
	store       *session.Store
}

func NewAuthHandler(authService *service.AuthService, store *session.Store) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		store:       store,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"リクエスト形式が不正です。"}`, http.StatusBadRequest)
		return
	}

	user, err := h.authService.Authenticate(r.Context(), req.Username, req.Password)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	h.store.CreateSession(w, user.ID, user.Username)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	h.store.DestroySession(w, r)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "ログアウトしました。"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	sess, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(model.UserResponse{
		ID:       sess.UserID,
		Username: sess.Username,
	})
}

