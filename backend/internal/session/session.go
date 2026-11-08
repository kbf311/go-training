package session

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"sync"
	"time"
)

type UserSession struct {
	UserID    int64
	Username  string
	CreatedAt time.Time
}

type Store struct {
	mu       sync.RWMutex
	sessions map[string]UserSession
}

const CookieName = "monster_session"

func NewStore() *Store {
	return &Store{
		sessions: make(map[string]UserSession),
	}
}

func (s *Store) CreateSession(w http.ResponseWriter, userID int64, username string) string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	sessionID := hex.EncodeToString(b)

	s.mu.Lock()
	s.sessions[sessionID] = UserSession{
		UserID:    userID,
		Username:  username,
		CreatedAt: time.Now(),
	}
	s.mu.Unlock()

	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400 * 7, // 7 days
	})

	return sessionID
}

func (s *Store) GetSession(r *http.Request) (UserSession, bool) {
	cookie, err := r.Cookie(CookieName)
	if err != nil || cookie.Value == "" {
		return UserSession{}, false
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	sess, exists := s.sessions[cookie.Value]
	return sess, exists
}

func (s *Store) DestroySession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(CookieName)
	if err == nil && cookie.Value != "" {
		s.mu.Lock()
		delete(s.sessions, cookie.Value)
		s.mu.Unlock()
	}

	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

