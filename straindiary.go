package main

import (
	"github.com/gorilla/mux"
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/controllers"
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/util"
	"github.com/jerhow/straindiary/internal/views"
	"log"
	"net/http"
)

func main() {

	util.Setup()
	db.SetUpEnv()

	r := mux.NewRouter()
	r.HandleFunc("/", controllers.Index).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_GET).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_POST).Methods("POST")
	r.HandleFunc("/strain", controllers.Strain_PUT).Methods("PUT")
	r.HandleFunc("/strain", controllers.Strain_DELETE).Methods("DELETE")

	r.HandleFunc("/ui", views.Index).Methods("GET")
	r.HandleFunc("/ui/", views.Index).Methods("GET")
	r.HandleFunc("/ui/index", views.Index).Methods("GET")

	if err := http.ListenAndServe(":"+config.LOCAL_PORT, r); err != nil {
		log.Fatal(err)
	}
}
