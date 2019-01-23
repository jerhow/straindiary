package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/jerhow/straindiary/internal/auth"
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/helpers"
	"github.com/jerhow/straindiary/internal/util"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

func Index_GET(w http.ResponseWriter, r *http.Request) {

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

func Login_POST(w http.ResponseWriter, r *http.Request) {
	var un string = r.PostFormValue("un")
	var pw string = r.PostFormValue("pw")
	var authResult bool = false
	var userId int = -1
	var nickname string = ""
	var authToken string = ""
	var newSessionResult bool
	var newSessionMsg string

	type Payload struct {
		Msg         string
		LoginStatus bool
		UserId      int
		Nickname    string
		AuthToken   string
	}
	payload := Payload{
		Msg:         "",
		LoginStatus: false,
		UserId:      -1,
		Nickname:    "",
		AuthToken:   "",
	}

	util.SetCommonHttpHeaders(w)

	authResult, userId, nickname = auth.Login(un, pw)

	if authResult {
		newSessionResult, newSessionMsg, authToken = auth.NewSession(userId)
		if newSessionResult {
			payload.Msg = "Login successful"
			payload.LoginStatus = true
			payload.UserId = userId
			payload.Nickname = nickname
			payload.AuthToken = authToken
			w.WriteHeader(http.StatusOK) // 200
		} else {
			// Problem with auth.NewSession(userId)
			log.Println("Error from auth.NewSession: " + newSessionMsg)
			payload.Msg = "Well shit, there's been some kind of server error"
			w.WriteHeader(http.StatusInternalServerError) // 500
		}
	} else {
		payload.Msg = "Invalid login, please try again"
		payload.AuthToken = authToken
		w.WriteHeader(http.StatusUnauthorized) // 401
	}

	dataJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(dataJson)
}

func CheckAvailableEmail_GET(w http.ResponseWriter, r *http.Request) {
	var available bool = false

	type Payload struct {
		Msg string
	}
	payload := Payload{
		Msg: "",
	}

	email := r.Header.Get("X-email")
	available = db.CheckAvailableEmail(email)

	util.SetCommonHttpHeaders(w)

	if !available {
		payload.Msg = "This email address already exists in the system"
		w.WriteHeader(http.StatusPreconditionFailed) // HTTP 412
	} else {
		payload.Msg = "Email address can be used" // does not imply that it has been input-validated
		w.WriteHeader(http.StatusOK)
	}

	dataJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(dataJson)
}

func CheckAvailableNickname_GET(w http.ResponseWriter, r *http.Request) {
	var available bool = false

	type Payload struct {
		Msg string
	}
	payload := Payload{
		Msg: "",
	}

	nickname := r.Header.Get("X-nickname")
	available = db.CheckAvailableNickname(nickname)

	util.SetCommonHttpHeaders(w)

	if !available {
		payload.Msg = "This nickname is already in use"
		w.WriteHeader(http.StatusPreconditionFailed) // HTTP 412
	} else {
		payload.Msg = "Nickname is free to use"
		w.WriteHeader(http.StatusOK)
	}

	dataJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(dataJson)
}

func User_GET(w http.ResponseWriter, r *http.Request) {
	type Payload struct {
		Msg          string
		UserSettings db.UserSettings
	}
	payload := Payload{
		Msg: "",
	}

	userId, _ := strconv.Atoi(r.Header.Get("X-user-id"))
	authToken := r.Header.Get("X-auth-token")

	result, userSettings := db.FetchUserSettings(userId, authToken)
	if !result {
		payload.Msg = "Something went wrong with this request"
		w.WriteHeader(http.StatusBadRequest)
	} else {
		payload.Msg = "Success"
		payload.UserSettings = userSettings
		util.SetCommonHttpHeaders(w)
		w.WriteHeader(http.StatusOK)
	}

	dataJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(dataJson)
}

func Strain_GET(w http.ResponseWriter, r *http.Request) {
	userIdRaw := r.Header.Get("X-user-id")
	sortByRaw := r.URL.Query().Get("sb")
	orderByRaw := r.URL.Query().Get("ob")
	var userId int
	var result bool = true

	type Payload struct {
		Msg        string
		StrainData map[int]db.StrainRow
	}
	payload := Payload{
		Msg: "",
	}

	// validate userId (as input)
	if util.UserIdValidFormat(userIdRaw) {
		userId, _ = strconv.Atoi(userIdRaw)
	} else {
		result = false
		payload.Msg = "Bad or missing input for userId"
	}

	// TODO: validate userId against session

	sortBySQL, orderBySQL := helpers.Strain_GET_SortOrderQsParams(sortByRaw, orderByRaw)

	var strainRows map[int]db.StrainRow
	strainRows = db.UserStrainList(userId, sortBySQL, orderBySQL)
	payload.StrainData = strainRows

	if !result {
		w.WriteHeader(http.StatusBadRequest)
	} else {
		// Set whatever HTTP headers and status we need, and write (dispatch) the output
		// NOTE: The order of w.Header().Set() and w.WriteHeader() seems to matter.
		// Any w.Header().Set() calls AFTER w.WriteHeader() don't seem to get applied.
		payload.Msg = "Success"
		util.SetCommonHttpHeaders(w)
		w.WriteHeader(http.StatusOK)
	}

	dataJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(dataJson)
}

// Wherein a user's new strain gets written to the DB
func Strain_POST(w http.ResponseWriter, r *http.Request) {
	var userId, stars int
	var price, sativaPct, indicaPct, thcPct, cbdPct float64
	var currency, unitOfMeasure, strainName, strainType, comments, company, dispensary string
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
	strainType = r.PostFormValue("strain_type")
	stars, _ = strconv.Atoi(r.PostFormValue("stars"))
	price, _ = strconv.ParseFloat(r.PostFormValue("price"), 64)
	currency = r.PostFormValue("currency")
	unitOfMeasure = r.PostFormValue("unit_of_measure")
	sativaPct, _ = strconv.ParseFloat(r.PostFormValue("sativa_pct"), 64)
	indicaPct, _ = strconv.ParseFloat(r.PostFormValue("indica_pct"), 64)
	thcPct, _ = strconv.ParseFloat(r.PostFormValue("thc_pct"), 64)
	cbdPct, _ = strconv.ParseFloat(r.PostFormValue("cbd_pct"), 64)
	company = r.PostFormValue("company")
	dispensary = r.PostFormValue("dispensary")
	comments = r.PostFormValue("comments")

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
	dbWriteResult, dbWriteMsg = db.WriteNewStrain(userId, strainName, strainType, stars, price,
		currency, unitOfMeasure, sativaPct, indicaPct, thcPct, cbdPct, company, dispensary, comments)
	if dbWriteResult {
		fmt.Println("PostToDb() call completed successfully")
		payload.Msg = "Looks like everything was written successfully"
		w.WriteHeader(http.StatusOK)
	} else {
		payload.Msg = dbWriteMsg
		w.WriteHeader(http.StatusBadRequest)
	}

	payloadJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(payloadJson)
}

// Wherein a user strain is update/replaced via PUT
func Strain_PUT(w http.ResponseWriter, r *http.Request) {
	var userId, strainId, stars int
	var price, sativaPct, indicaPct, thcPct, cbdPct float64
	var strainName, strainType, currency, unitOfMeasure, comments, company, dispensary string
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
	strainId, _ = strconv.Atoi(r.PostFormValue("strain_id"))
	strainName = r.PostFormValue("strain_name")
	strainType = r.PostFormValue("strain_type")
	price, _ = strconv.ParseFloat(r.PostFormValue("price"), 64)
	currency = r.PostFormValue("currency")
	unitOfMeasure = r.PostFormValue("unit_of_measure")
	sativaPct, _ = strconv.ParseFloat(r.PostFormValue("sativa_pct"), 64)
	indicaPct, _ = strconv.ParseFloat(r.PostFormValue("indica_pct"), 64)
	thcPct, _ = strconv.ParseFloat(r.PostFormValue("thc_pct"), 64)
	cbdPct, _ = strconv.ParseFloat(r.PostFormValue("cbd_pct"), 64)
	stars, _ = strconv.Atoi(r.PostFormValue("stars"))
	comments = r.PostFormValue("comments")
	company = r.PostFormValue("company")
	dispensary = r.PostFormValue("dispensary")

	// TODO: Validation
	validateResult = true // yeah yeah
	if validateResult {
		fmt.Println("Validate() call completed")
	}

	util.SetCommonHttpHeaders(w)

	// attempt to write to DB
	dbWriteResult, dbWriteMsg = db.UpdateStrain(userId, strainId, strainName, strainType,
		price, currency, unitOfMeasure, sativaPct, indicaPct, thcPct, cbdPct, stars,
		comments, company, dispensary)
	if dbWriteResult {
		payload.Msg = "Looks like everything was updated successfully"
		w.WriteHeader(http.StatusOK)
	} else {
		payload.Msg = dbWriteMsg
		w.WriteHeader(http.StatusBadRequest)
	}

	payloadJson, err := json.Marshal(payload)
	if err != nil {
		fmt.Fprintf(w, "Error: %s", err)
	}

	w.Write(payloadJson)
}

// Pulls the userId out of the custom header, passes it along,
// responds based on the result it gets back
func Logout_DELETE(w http.ResponseWriter, r *http.Request) {

	type Payload struct {
		Result bool
		Msg    string
	}
	payload := Payload{
		Result: false,
		Msg:    "",
	}
	userId, _ := strconv.Atoi(r.Header.Get("X-user-id"))
	authToken := r.Header.Get("X-auth-token")
	payload.Result, _ = auth.Logout(userId, authToken)

	util.SetCommonHttpHeaders(w)

	if payload.Result == true {
		payload.Msg = "Session deleted"
		w.WriteHeader(http.StatusOK)
	} else {
		payload.Msg = "ERROR: There was a problem deleting this session on the backend"
		w.WriteHeader(http.StatusInternalServerError)
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
	var strainsCSV string
	var strains []string
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

	// validate userId (as input)
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

	strains = strings.Split(strainsCSV, ",")

	util.SetCommonHttpHeaders(w)

	if !validateResult {
		// punch out
		w.WriteHeader(http.StatusBadRequest)
	} else {
		// proceed
		userIdInt, _ := strconv.Atoi(userId)
		dbWriteResult, dbWriteMsg = db.DeleteUserStrains(userIdInt, strains)
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
