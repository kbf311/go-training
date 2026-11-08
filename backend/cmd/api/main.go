package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"backend/internal/db"
	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/service"
	"backend/internal/session"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "modernc.org/sqlite"
)

func main() {
	dataDir := "data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatalf("failed to create data dir: %v", err)
	}

	dbPath := filepath.Join(dataDir, "app.db")
	sqlDb, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("failed to open sqlite db: %v", err)
	}
	defer sqlDb.Close()

	// SQLite のテーブル初期化
	schemaBytes, err := os.ReadFile("db/schema/schema.sql")
	if err != nil {
		log.Fatalf("failed to read schema file: %v", err)
	}
	if _, err := sqlDb.Exec(string(schemaBytes)); err != nil {
		log.Fatalf("failed to init schema: %v", err)
	}

	queries := db.New(sqlDb)
	repo := repository.NewMonsterRepository(sqlDb, queries)

	seedFile := filepath.Join(dataDir, "initial_monsters.json")
	authService := service.NewAuthService(queries)
	monsterService := service.NewMonsterService(sqlDb, repo, seedFile)

	ctx := context.Background()
	if err := authService.InitAdminUser(ctx); err != nil {
		log.Printf("warn: init admin user: %v", err)
	}
	if err := monsterService.InitDataIfNeeded(ctx); err != nil {
		log.Printf("warn: init monsters data: %v", err)
	}

	sessionStore := session.NewStore()
	authHandler := handler.NewAuthHandler(authService, sessionStore)
	monsterHandler := handler.NewMonsterHandler(monsterService)

	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Post("/login", authHandler.Login)

		// 認証保護ルート
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(sessionStore))

			r.Post("/logout", authHandler.Logout)
			r.Get("/auth/me", authHandler.Me)

			r.Get("/monsters", monsterHandler.List)
			r.Post("/monsters", monsterHandler.Create)
			r.Get("/monsters/{id}", monsterHandler.Get)
			r.Put("/monsters/{id}", monsterHandler.Update)
			r.Delete("/monsters/{id}", monsterHandler.Delete)

			r.Post("/data/reset", monsterHandler.Reset)
		})
	})

	port := 8080
	addr := fmt.Sprintf(":%d", port)
	log.Printf("Server starting on http://localhost%s ...", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server exited: %v", err)
	}
}

