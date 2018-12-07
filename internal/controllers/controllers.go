package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/util"
	"net/http"
	"strconv"
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

// Wherein a user's new strain gets written to the DB
func Strain_POST(w http.ResponseWriter, r *http.Request) {

	// fmt.Printf("%+v\n", r) // dump out the request

	var userId int
	var strainName string
	var validateResult bool = false
	var dbWriteResult bool = false
	var dbWriteMsg string = ""

	type Payload struct {
		Msg string
	}
	payload := Payload{
		Msg: "",
	}

	userId, _ = strconv.Atoi(r.PostFormValue("user_id"))
	strainName = r.PostFormValue("strain_name")

	// Check for empty values, validate, sanity check, etc
	// When we have validation code, we'll invoke it here
	validateResult = true // yeah yeah
	if validateResult {
		fmt.Println("Validate() call completed")
	}

	util.SetCommonHttpHeaders(w)

	// fmt.Println("userId: " + fmt.Sprintf("%d", userId))
	// fmt.Println("strainName: " + strainName)

	// attempt to write to DB
	dbWriteResult, dbWriteMsg = db.WriteNewStrainToDb(userId, strainName)
	if dbWriteResult {
		fmt.Println("PostToDb() call completed successfully")
		payload.Msg = "Looks like everything was written successfully"
		w.WriteHeader(http.StatusOK)
	} else {
		payload.Msg = "Error: " + dbWriteMsg
		w.WriteHeader(http.StatusBadRequest)
	}

	payloadJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(payloadJson)
}
