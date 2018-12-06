package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func Index(w http.ResponseWriter, r *http.Request) {

	fmt.Println("Hello!")

	type Payload struct {
		Msg string
	}

	payload := Payload{
		Msg: "Hello!",
	}

	payloadJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write(payloadJson)
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/", Index).Methods("GET")

	if err := http.ListenAndServe(":3000", r); err != nil {
		log.Fatal(err)
	}
}
