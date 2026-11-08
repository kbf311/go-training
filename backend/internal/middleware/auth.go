package middleware

import (
	"context"
	"net/http"

	"backend/internal/session"
)

type contextKey string

const UserContextKey = contextKey("userSession")

func AuthMiddleware(store *session.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sess, ok := store.GetSession(r)
			if !ok {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), UserContextKey, sess)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserFromContext(ctx context.Context) (session.UserSession, bool) {
	sess, ok := ctx.Value(UserContextKey).(session.UserSession)
	return sess, ok
}

