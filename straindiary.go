package main

import (
	"github.com/gorilla/mux"
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/controllers"
	"github.com/jerhow/straindiary/internal/db"
	"log"
	"net/http"
)

func main() {

	db.SetUpEnv()

	r := mux.NewRouter()
	r.HandleFunc("/", controllers.Index).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_POST).Methods("POST")

	if err := http.ListenAndServe(":"+config.LOCAL_PORT, r); err != nil {
		log.Fatal(err)
	}
}
