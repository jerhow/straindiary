package main

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/controllers"
	"github.com/jerhow/straindiary/internal/db"
	"log"
	"net/http"
)

func main() {

	db.SetUpEnv()

	// Smoke test db.UserStrainList()
	var sr []db.StrainRow
	sr = db.UserStrainList(1, "strain_name", "ASC")
	fmt.Printf("%+v\n", sr)

	r := mux.NewRouter()
	r.HandleFunc("/", controllers.Index).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_POST).Methods("POST")
	r.HandleFunc("/strain", controllers.Strain_PUT).Methods("PUT")
	r.HandleFunc("/strain", controllers.Strain_DELETE).Methods("DELETE")

	if err := http.ListenAndServe(":"+config.LOCAL_PORT, r); err != nil {
		log.Fatal(err)
	}
}
