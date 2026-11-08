package service

import (
	"context"
	"errors"

	"backend/internal/db"
	"backend/internal/model"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	queries *db.Queries
}

func NewAuthService(queries *db.Queries) *AuthService {
	return &AuthService{queries: queries}
}

func (s *AuthService) InitAdminUser(ctx context.Context) error {
	count, err := s.queries.CountUsers(ctx)
	if err == nil && count > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.queries.CreateUser(ctx, db.CreateUserParams{
		Username: "admin",
		Password: string(hash),
	})
}

func (s *AuthService) Authenticate(ctx context.Context, username, password string) (*model.UserResponse, error) {
	user, err := s.queries.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, errors.New("ユーザーIDまたはパスワードが正しくありません。")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("ユーザーIDまたはパスワードが正しくありません。")
	}

	return &model.UserResponse{
		ID:       user.ID,
		Username: user.Username,
	}, nil
}

