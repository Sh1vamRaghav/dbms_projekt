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

func main() {
    // Load .env file
    err := godotenv.Load(".env")
    if err != nil {
        log.Println("Warning: .env file not found, continuing...")
    }
	
	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
        AllowedOrigins: []string{"*"},
        AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
        AllowedHeaders: []string{"Content-Type"},
    }))

	v1Router := chi.NewRouter()
	v1Router.Get("/healthz", handlerReadiness)
	v1Router.Get("/err",handlerErr)
	router.Mount("/v1", v1Router)


	portString := os.Getenv("PORT")
	srv := &http.Server{
		Handler: router,
		Addr: ":" + portString,
	}

	log.Printf("Server starting on port %v\n",portString)
	err = srv.ListenAndServe()
	if err!= nil{
		log.Fatal(err)
	}

    // Read environment variables
    dbUser := os.Getenv("DB_USER")
    dbPass := os.Getenv("DB_PASS")
    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbName := os.Getenv("DB_NAME")

    // Create DSN
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        dbUser, dbPass, dbHost, dbPort, dbName)

    // Connect to database
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal("Error opening database:", err)
    }
    defer db.Close()

    // Test connection
    err = db.Ping()
    if err != nil {
        log.Fatal("Error connecting to database:", err)
    }

    fmt.Println("Connected to MySQL database!")
}
