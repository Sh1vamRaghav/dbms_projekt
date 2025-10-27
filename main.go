package main

import (
    "database/sql"
    "fmt"
    "log"
    "net/http"
    "os"

    "github.com/go-chi/chi"
    "github.com/go-chi/cors"

    _ "github.com/go-sql-driver/mysql"
    "github.com/joho/godotenv"
)

type apiConfig struct {
    DB *sql.DB
}

func main() {
    // Load .env
    godotenv.Load(".env")

    // Connect to DB
    dbUser := os.Getenv("DB_USER")
    dbPass := os.Getenv("DB_PASS")
    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbName := os.Getenv("DB_NAME")
    port := os.Getenv("PORT")

    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        dbUser, dbPass, dbHost, dbPort, dbName)

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    if err := db.Ping(); err != nil {
        log.Fatal(err)
    }

    log.Println("Connected to DB!")

    apiCfg := &apiConfig{DB: db}

    router := chi.NewRouter()
    router.Use(cors.Handler(cors.Options{
        AllowedOrigins: []string{"*"},
        AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
        AllowedHeaders: []string{"Content-Type"},
    }))

    // Serve frontend
    router.Handle("/", http.FileServer(http.Dir(".")))

    // API routes
    v1 := chi.NewRouter()
    v1.Get("/timetable", apiCfg.handlerTimetableByBatchYear)
    router.Mount("/v1", v1)

    log.Printf("Server running on port %s\n", port)
    http.ListenAndServe(":"+port, router)
}
