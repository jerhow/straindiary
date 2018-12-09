package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/util"
	"net/http"
	"regexp"
	"strconv"
	"strings"
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

// Wherein one or more strains can be deleted, within an individual user's strains
// Strains will come in as a comma-separated list of strain ids
func Strain_DELETE(w http.ResponseWriter, r *http.Request) {

	// fmt.Printf("%+v\n", r) // dump out the request

	// NOTE: By RESTful convention, DELETE is not meant for batch deletions.
	// It's really meant for something like DELETE /host/app/item/id
	// where you're deleting the thing represented by 'id'
	// As such, some folks will send multiple items in the query string,
	// while others will use a custom header. I'm doing the latter, but if
	// we ever need to use the QS instead, you can get it like this:
	// fmt.Println(strings.Split(r.RequestURI, "?")[1])
	// ...and then just do your parsing from what remains.
	//
	// Anyway, I'm using a custom header, like so:
	// fmt.Println(r.Header.Get("X-ids-for-deletion"))

	var userId string
	// var userId int
	var strainsCSV string
	var validateResult bool = true
	var dbWriteResult bool = false
	var dbWriteMsg string = ""

	// Payload is a struct (converted to and sent back as JSON),
	// so that we can arbitrarily add more things to it as needed
	type Payload struct {
		Msg string
	}
	payload := Payload{
		Msg: "",
	}

	userId = r.Header.Get("X-user-id")
	strainsCSV = r.Header.Get("X-ids-for-deletion")

	fmt.Println(userId)
	fmt.Println(strainsCSV)

	// validate userId as input
	re := regexp.MustCompile("^\\d+$")
	if !re.MatchString(userId) {
		validateResult = false
		payload.Msg = "Bad input for userId"
	}

	// TODO: validate userId against session
	// Obviously this is a show-stopper if it doesn't match the actual user

	// validate strainsCSV
	strainsCSV = strings.Replace(strainsCSV, " ", "", -1) // let's not complicate things with errant spaces
	re = regexp.MustCompile("[^\\d+,*]")                  // NOTICE: This regex looks for "anything other than digits and commas"
	if re.MatchString(strainsCSV) {                       // ...therefore, any positive match fails validation
		validateResult = false
		payload.Msg = "Invalid format for strain IDs. These need to be comma-separated."
	}

	util.SetCommonHttpHeaders(w)

	if !validateResult {
		// punch out
		w.WriteHeader(http.StatusBadRequest)
	} else {
		// proceed
		userIdInt, _ := strconv.Atoi(userId)
		dbWriteResult, dbWriteMsg = db.DeleteUserStrains(userIdInt, strainsCSV)
		if !dbWriteResult {
			// punch out
			w.WriteHeader(http.StatusBadRequest)
			payload.Msg = "Error: " + dbWriteMsg
			fmt.Println(dbWriteMsg)
		} else {
			payload.Msg = "Success"
			w.WriteHeader(http.StatusOK)
		}
	}

	payloadJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(payloadJson)
}
