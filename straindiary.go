package main

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/controllers"
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/util"
	"github.com/jerhow/straindiary/internal/views"
	"log"
	"net/http"
)

func simpleMw(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Do stuff here
		// fmt.Println("Hello from simpleMw()!")
		log.Println(r.RequestURI)
		// Call the next handler, which can be another middleware in the chain, or the final handler.
		next.ServeHTTP(w, r)
	})
}

func main() {

	util.Setup()
	db.SetUpEnv()

	r := mux.NewRouter()
	r.HandleFunc("/", controllers.Index_GET).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_GET).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_POST).Methods("POST")
	r.HandleFunc("/strain", controllers.Strain_PUT).Methods("PUT")
	r.HandleFunc("/strain", controllers.Strain_DELETE).Methods("DELETE")

	r.HandleFunc("/ui", views.Index).Methods("GET")
	r.HandleFunc("/ui/", views.Index).Methods("GET")
	r.HandleFunc("/ui/index", views.Index).Methods("GET")
	r.HandleFunc("/ui/strains", views.Strains).Methods("GET")

	r.HandleFunc("/login", controllers.Login_POST).Methods("POST")

	r.Use(simpleMw)

	if err := http.ListenAndServe(":"+config.LOCAL_PORT, r); err != nil {
		log.Fatal(err)
	}
}
