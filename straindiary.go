package main

import (
	"github.com/gorilla/mux"
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/controllers"
	"log"
	"net/http"
)

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/", controllers.Index).Methods("GET")

	if err := http.ListenAndServe(":"+config.LOCAL_PORT, r); err != nil {
		log.Fatal(err)
	}
}
