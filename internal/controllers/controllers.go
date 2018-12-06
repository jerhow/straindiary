package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/jerhow/straindiary/internal/db"
	"net/http"
)

func Index(w http.ResponseWriter, r *http.Request) {

	fmt.Println("Hello!")

	db.Db1()

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
