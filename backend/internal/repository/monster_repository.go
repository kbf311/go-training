package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"backend/internal/db"
	"backend/internal/model"
)

type MonsterListParams struct {
	Query   string
	Element string
	Rarity  *int64
	Habitat string
	Sort    string
	Order   string
	Page    int
	Limit   int
}

type MonsterRepository struct {
	sqlDb   *sql.DB
	queries *db.Queries
}

func NewMonsterRepository(sqlDb *sql.DB, queries *db.Queries) *MonsterRepository {
	return &MonsterRepository{
		sqlDb:   sqlDb,
		queries: queries,
	}
}

func (r *MonsterRepository) Queries() *db.Queries {
	return r.queries
}

var validSortColumns = map[string]string{
	"id":       "id",
	"name":     "name",
	"element":  "element",
	"rarity":   "rarity",
	"habitats": "habitats",
	"hp":       "hp",
	"attack":   "attack",
}

func (r *MonsterRepository) List(ctx context.Context, params MonsterListParams) (model.MonsterListResponse, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.Limit < 1 {
		params.Limit = 10
	}

	whereClauses := []string{"1=1"}
	args := []interface{}{}

	if params.Query != "" {
		whereClauses = append(whereClauses, "name LIKE ?")
		args = append(args, "%"+params.Query+"%")
	}
	if params.Element != "" && model.IsValidElement(params.Element) {
		whereClauses = append(whereClauses, "element = ?")
		args = append(args, params.Element)
	}
	if params.Rarity != nil && model.IsValidRarity(*params.Rarity) {
		whereClauses = append(whereClauses, "rarity = ?")
		args = append(args, *params.Rarity)
	}
	if params.Habitat != "" && model.IsValidHabitat(params.Habitat) {
		whereClauses = append(whereClauses, "habitats LIKE ?")
		args = append(args, "%"+params.Habitat+"%")
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM monsters WHERE %s", whereSQL)
	var total int64
	err := r.sqlDb.QueryRowContext(ctx, countSQL, args...).Scan(&total)
	if err != nil {
		return model.MonsterListResponse{}, fmt.Errorf("failed to count monsters: %w", err)
	}

	sortCol, ok := validSortColumns[params.Sort]
	if !ok {
		sortCol = "id"
	}
	orderDir := "ASC"
	if strings.ToLower(params.Order) == "desc" {
		orderDir = "DESC"
	}

	offset := (params.Page - 1) * params.Limit
	selectSQL := fmt.Sprintf(
		"SELECT id, name, element, rarity, habitats, hp, attack, description FROM monsters WHERE %s ORDER BY %s %s LIMIT ? OFFSET ?",
		whereSQL, sortCol, orderDir,
	)
	listArgs := append(args, params.Limit, offset)

	rows, err := r.sqlDb.QueryContext(ctx, selectSQL, listArgs...)
	if err != nil {
		return model.MonsterListResponse{}, fmt.Errorf("failed to query monsters: %w", err)
	}
	defer rows.Close()

	monsters := []model.MonsterResponse{}
	for rows.Next() {
		var m db.Monster
		if err := rows.Scan(&m.ID, &m.Name, &m.Element, &m.Rarity, &m.Habitats, &m.Hp, &m.Attack, &m.Description); err != nil {
			return model.MonsterListResponse{}, fmt.Errorf("failed to scan monster: %w", err)
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

		monsters = append(monsters, model.MonsterResponse{
			ID:          m.ID,
			Name:        m.Name,
			Element:     m.Element,
			Rarity:      m.Rarity,
			Habitats:    m.Habitats,
			HabitatList: habitatList,
			Hp:          m.Hp,
			Attack:      m.Attack,
			Description: desc,
		})
	}

	totalPages := int((total + int64(params.Limit) - 1) / int64(params.Limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return model.MonsterListResponse{
		Monsters:   monsters,
		Total:      total,
		Page:       params.Page,
		Limit:      params.Limit,
		TotalPages: totalPages,
	}, nil
}

