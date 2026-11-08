package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"backend/internal/model"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/go-chi/chi/v5"
)

type MonsterHandler struct {
	monsterService *service.MonsterService
}

func NewMonsterHandler(monsterService *service.MonsterService) *MonsterHandler {
	return &MonsterHandler{
		monsterService: monsterService,
	}
}

func (h *MonsterHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	var rarity *int64
	if rStr := q.Get("rarity"); rStr != "" {
		if rVal, err := strconv.ParseInt(rStr, 10, 64); err == nil {
			rarity = &rVal
		}
	}

	page := 1
	if pStr := q.Get("page"); pStr != "" {
		if pVal, err := strconv.Atoi(pStr); err == nil && pVal > 0 {
			page = pVal
		}
	}

	limit := 10
	if lStr := q.Get("limit"); lStr != "" {
		if lVal, err := strconv.Atoi(lStr); err == nil && lVal > 0 {
			limit = lVal
		}
	}

	params := repository.MonsterListParams{
		Query:   q.Get("q"),
		Element: q.Get("element"),
		Rarity:  rarity,
		Habitat: q.Get("habitat"),
		Sort:    q.Get("sort"),
		Order:   q.Get("order"),
		Page:    page,
		Limit:   limit,
	}

	result, err := h.monsterService.List(r.Context(), params)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *MonsterHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "不正なモンスターIDです。"})
		return
	}

	monster, err := h.monsterService.GetByID(r.Context(), id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(monster)
}

func (h *MonsterHandler) Create(w http.ResponseWriter, r *http.Request) {
	var payload model.MonsterPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "リクエスト形式が不正です。"})
		return
	}

	monster, valErrs, err := h.monsterService.Create(r.Context(), payload)
	if len(valErrs) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"errors": valErrs})
		return
	}
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(monster)
}

func (h *MonsterHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "不正なモンスターIDです。"})
		return
	}

	var payload model.MonsterPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "リクエスト形式が不正です。"})
		return
	}

	valErrs, err := h.monsterService.Update(r.Context(), id, payload)
	if len(valErrs) > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"errors": valErrs})
		return
	}
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		status := http.StatusInternalServerError
		if err.Error() == "モンスターが見つかりません。" {
			status = http.StatusNotFound
		}
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "モンスターを更新しました。"})
}

func (h *MonsterHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "不正なモンスターIDです。"})
		return
	}

	if err := h.monsterService.Delete(r.Context(), id); err != nil {
		w.Header().Set("Content-Type", "application/json")
		status := http.StatusInternalServerError
		if err.Error() == "モンスターが見つかりません。" {
			status = http.StatusNotFound
		}
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "モンスターを削除しました。"})
}

func (h *MonsterHandler) Reset(w http.ResponseWriter, r *http.Request) {
	if err := h.monsterService.ResetData(r.Context()); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "モンスターデータを初期化しました。"})
}

