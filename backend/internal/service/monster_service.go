package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"backend/internal/db"
	"backend/internal/model"
	"backend/internal/repository"
)

type MonsterService struct {
	repo      *repository.MonsterRepository
	seedPath  string
	sqlDb     *sql.DB
}

func NewMonsterService(sqlDb *sql.DB, repo *repository.MonsterRepository, seedPath string) *MonsterService {
	return &MonsterService{
		sqlDb:    sqlDb,
		repo:     repo,
		seedPath: seedPath,
	}
}

type initialMonsterData struct {
	Name        string `json:"name"`
	Element     string `json:"element"`
	Rarity      int64  `json:"rarity"`
	Habitats    string `json:"habitats"`
	Hp          int64  `json:"hp"`
	Attack      int64  `json:"attack"`
	Description string `json:"description"`
}

func (s *MonsterService) InitDataIfNeeded(ctx context.Context) error {
	count, err := s.repo.Queries().CountMonsters(ctx)
	if err == nil && count > 0 {
		return nil
	}
	return s.ResetData(ctx)
}

func (s *MonsterService) ResetData(ctx context.Context) error {
	bytes, err := os.ReadFile(s.seedPath)
	if err != nil {
		return fmt.Errorf("failed to read seed file (%s): %w", s.seedPath, err)
	}

	var seeds []initialMonsterData
	if err := json.Unmarshal(bytes, &seeds); err != nil {
		return fmt.Errorf("failed to parse seed json: %w", err)
	}

	tx, err := s.sqlDb.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	qtx := s.repo.Queries().WithTx(tx)

	if err := qtx.DeleteAllMonsters(ctx); err != nil {
		return fmt.Errorf("failed to delete all monsters: %w", err)
	}

	for _, seed := range seeds {
		desc := sql.NullString{
			String: seed.Description,
			Valid:  strings.TrimSpace(seed.Description) != "",
		}
		_, err := qtx.CreateMonster(ctx, db.CreateMonsterParams{
			Name:        seed.Name,
			Element:     seed.Element,
			Rarity:      seed.Rarity,
			Habitats:    seed.Habitats,
			Hp:          seed.Hp,
			Attack:      seed.Attack,
			Description: desc,
		})
		if err != nil {
			return fmt.Errorf("failed to seed monster (%s): %w", seed.Name, err)
		}
	}

	return tx.Commit()
}

func (s *MonsterService) List(ctx context.Context, params repository.MonsterListParams) (model.MonsterListResponse, error) {
	return s.repo.List(ctx, params)
}

func (s *MonsterService) GetByID(ctx context.Context, id int64) (model.MonsterResponse, error) {
	m, err := s.repo.Queries().GetMonsterByID(ctx, id)
	if err != nil {
		return model.MonsterResponse{}, errors.New("モンスターが見つかりません。")
	}

	desc := ""
	if m.Description.Valid {
		desc = m.Description.String
	}

	habitatList := []string{}
	if m.Habitats != "" {
		for _, h := range strings.Split(m.Habitats, ",") {
			if trimmed := strings.TrimSpace(h); trimmed != "" {
				habitatList = append(habitatList, trimmed)
			}
		}
	}

	return model.MonsterResponse{
		ID:          m.ID,
		Name:        m.Name,
		Element:     m.Element,
		Rarity:      m.Rarity,
		Habitats:    m.Habitats,
		HabitatList: habitatList,
		Hp:          m.Hp,
		Attack:      m.Attack,
		Description: desc,
	}, nil
}

func (s *MonsterService) Validate(payload model.MonsterPayload) []string {
	var errs []string
	if strings.TrimSpace(payload.Name) == "" {
		errs = append(errs, "名前は必須です。")
	}
	if !model.IsValidElement(payload.Element) {
		errs = append(errs, "属性を選択してください。")
	}
	if !model.IsValidRarity(payload.Rarity) {
		errs = append(errs, "レア度を選択してください。")
	}
	validHabitats := 0
	for _, h := range payload.Habitats {
		if model.IsValidHabitat(h) {
			validHabitats++
		}
	}
	if validHabitats == 0 {
		errs = append(errs, "出現地域を1つ以上選択してください。")
	}
	if payload.Hp < 0 {
		errs = append(errs, "HPは0以上の数値で入力してください。")
	}
	if payload.Attack < 0 {
		errs = append(errs, "攻撃力は0以上の数値で入力してください。")
	}
	return errs
}

func (s *MonsterService) Create(ctx context.Context, payload model.MonsterPayload) (model.MonsterResponse, []string, error) {
	validationErrors := s.Validate(payload)
	if len(validationErrors) > 0 {
		return model.MonsterResponse{}, validationErrors, nil
	}

	habitatsStr := strings.Join(payload.Habitats, ",")
	desc := sql.NullString{
		String: strings.TrimSpace(payload.Description),
		Valid:  strings.TrimSpace(payload.Description) != "",
	}

	m, err := s.repo.Queries().CreateMonster(ctx, db.CreateMonsterParams{
		Name:        strings.TrimSpace(payload.Name),
		Element:     payload.Element,
		Rarity:      payload.Rarity,
		Habitats:    habitatsStr,
		Hp:          payload.Hp,
		Attack:      payload.Attack,
		Description: desc,
	})
	if err != nil {
		return model.MonsterResponse{}, nil, fmt.Errorf("failed to create monster: %w", err)
	}

	return model.MonsterResponse{
		ID:          m.ID,
		Name:        m.Name,
		Element:     m.Element,
		Rarity:      m.Rarity,
		Habitats:    m.Habitats,
		HabitatList: payload.Habitats,
		Hp:          m.Hp,
		Attack:      m.Attack,
		Description: payload.Description,
	}, nil, nil
}

func (s *MonsterService) Update(ctx context.Context, id int64, payload model.MonsterPayload) ([]string, error) {
	validationErrors := s.Validate(payload)
	if len(validationErrors) > 0 {
		return validationErrors, nil
	}

	// 存在チェック
	_, err := s.repo.Queries().GetMonsterByID(ctx, id)
	if err != nil {
		return nil, errors.New("モンスターが見つかりません。")
	}

	habitatsStr := strings.Join(payload.Habitats, ",")
	desc := sql.NullString{
		String: strings.TrimSpace(payload.Description),
		Valid:  strings.TrimSpace(payload.Description) != "",
	}

	err = s.repo.Queries().UpdateMonster(ctx, db.UpdateMonsterParams{
		ID:          id,
		Name:        strings.TrimSpace(payload.Name),
		Element:     payload.Element,
		Rarity:      payload.Rarity,
		Habitats:    habitatsStr,
		Hp:          payload.Hp,
		Attack:      payload.Attack,
		Description: desc,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update monster: %w", err)
	}

	return nil, nil
}

func (s *MonsterService) Delete(ctx context.Context, id int64) error {
	// 存在チェック
	_, err := s.repo.Queries().GetMonsterByID(ctx, id)
	if err != nil {
		return errors.New("モンスターが見つかりません。")
	}

	return s.repo.Queries().DeleteMonster(ctx, id)
}

