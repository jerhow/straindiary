package db

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql" // Imports the package solely for its side-effects
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/util"
	"log"
	"strings"
)

var DRIVER string
var DB_USER string
var DB_PASS string
var DB_HOST string
var DB_PORT string
var DB_NAME string

// Reads ENV variables from the host environment, and sets up our
// "constants" with the appropriate values for the database and such.
func SetUpEnv() {
	DRIVER = util.FetchEnvVar("DB_DRIVER")
	DB_USER = util.FetchEnvVar("DB_USER")
	DB_PASS = util.FetchEnvVar("DB_PASS")
	DB_HOST = util.FetchEnvVar("DB_HOST")
	DB_PORT = util.FetchEnvVar("DB_PORT")
	DB_NAME = util.FetchEnvVar("DB_NAME")
}

func dsn() string {
	return DB_USER + ":" + DB_PASS + "@tcp(" + DB_HOST + ":" + DB_PORT + ")/" + DB_NAME
}

func Db1() {
	fmt.Println("sup from db()")
	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	stmtIns, err := dbh.Prepare("INSERT INTO t_user_strains (user_id, strain_name) VALUES (?, ?)")
	util.ErrChk(err)
	defer stmtIns.Close()

	_, err2 := stmtIns.Exec(1, "Strawberry Cough")
	util.ErrChk(err2)

	// insert, err := db.Query("INSERT INTO t_users (l_name, f_initial) VALUES ('Franklin', 'A')")
	// if err != nil {
	// 	log.Fatal(err) // panic(err.Error)
	// }
	// defer insert.Close()
}

func FetchPwdHashAndUserId(un string) (string, int) {
	var pwdHashFromDb string
	var idFromDb int
	var retHash string = ""
	var retId int = -1

	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	err = dbh.QueryRow("SELECT id, pw FROM t_user WHERE un = ?", un).Scan(&idFromDb, &pwdHashFromDb)

	switch {
	case err == sql.ErrNoRows:
		// TODO: Handle this case
		fmt.Println("No user with that ID")
	case err != nil:
		// TODO: Handle this case
		log.Fatal(err) // Fatal is equivalent to Print() followed by a call to os.Exit(1)
	default:
		// fmt.Println("Hey something happened")
		retHash = pwdHashFromDb
		retId = idFromDb
	}

	return retHash, retId
}

type StrainRow struct {
	Id         int
	UserId     int
	StrainName string
	SativaPct  float64
	IndicaPct  float64
	ThcPct     float64
	CbdPct     float64
	Stars      int
	Comments   string
	Company    string
	Dispensary string
	CreatedAt  string
	ModifiedAt string
}

// Expects the user's id, and sortBy and orderBy values
// Returns a numericall-indexed map of db.StrainRow structs
// NOTE: Assumes that sortBy and orderBy have been sanity-checked
func UserStrainList(userId int, sortBy string, orderBy string) map[int]StrainRow {

	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	sql := `SELECT 
				id,
				user_id,
				strain_name,
				ROUND(sativa_pct, 2) AS sativa_pct,
				ROUND(indica_pct, 2) AS indica_pct,
				ROUND(thc_pct, 2) AS thc_pct,
				ROUND(cbd_pct, 2) AS cbd_pct,
				stars,
				comments,
				company,
				dispensary,
				date_format(created_at, '%c/%e/%Y %r') as created_at,
				date_format(modified_at, '%c/%e/%Y %r') as modified_at
			FROM 
				t_user_strains
			WHERE
				user_id = ?
			ORDER BY ` + sortBy + ` ` + orderBy + `;`

	rows, err := dbh.Query(sql, userId)
	util.ErrChk(err)
	defer rows.Close()

	indexedRows := make(map[int]StrainRow)
	idx := 0
	for rows.Next() { // for each row, instantiate a StrainRow and scan the values into its fields
		var row StrainRow
		err := rows.Scan(&row.Id, &row.UserId, &row.StrainName, &row.SativaPct, &row.IndicaPct,
			&row.ThcPct, &row.CbdPct, &row.Stars, &row.Comments, &row.Company, &row.Dispensary,
			&row.CreatedAt, &row.ModifiedAt)
		util.ErrChk(err)

		// then add the struct containing the row values to the indexed map of rows, and increment the index
		indexedRows[idx] = row
		idx++
	}

	return indexedRows
}

// Takes the relevant values for the INSERT
// Returns a boolean indicating success|failure, and a message which will be "" on success
func WriteNewStrainToDb(userId int, strainName string, stars int, sativaPct float64, indicaPct float64,
	thcPct float64, cbdPct float64, company string, dispensary string, comments string) (bool, string) {

	var result bool = true
	var msg string = ""

	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	sql := `
		INSERT INTO t_user_strains
		(user_id, strain_name, stars, sativa_pct, indica_pct, thc_pct, cbd_pct, 
			company, dispensary, comments)
		VALUES 
		(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`

	stmtIns, err := dbh.Prepare(sql)
	util.ErrChk(err)
	defer stmtIns.Close()

	// first return value is 'result', but it's db driver dependent as to whether it gets populated
	_, execErr := stmtIns.Exec(userId, strainName, stars, sativaPct, indicaPct,
		thcPct, cbdPct, company, dispensary, comments)
	if execErr != nil {
		// set the result flag and investigate based on the error message
		result = false
		// we can stack the possible error cases here, and fail out hard otherwise
		if strings.Contains(execErr.Error(), "Error 1062: Duplicate entry") {
			msg = "Duplicate entry"
		} else {
			log.Fatal(execErr) // something else
		}
	}

	return result, msg
}

func WriteNewSessionAuth(userId int, authToken string) (bool, string) {
	var result bool = true
	var msg string = ""

	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	sql := `INSERT INTO t_session_auth
			(user_id, auth_token, expires_at)
			VALUES 
			(?, ?, (NOW() + ` + config.SQL_SESSION_OFFSET + `));`

	stmtIns, err := dbh.Prepare(sql)
	util.ErrChk(err)
	defer stmtIns.Close()

	// first return value is 'result', but it's db driver dependent as to whether it gets populated, so it's not reliable
	_, execErr := stmtIns.Exec(userId, authToken)

	if execErr != nil {
		// set the result flag and investigate based on the error message
		result = false
		// we can stack the possible error cases here, and fail out hard otherwise
		if strings.Contains(execErr.Error(), "Something something") {
			msg = "Something something"
		} else {
			log.Fatal(execErr) // something else
		}
	}

	return result, msg
}

// Expires any sessions for a given userId (by deleting them)
func ExpireSessionAuth(userId int) (bool, string) {
	var result bool = true
	var msg string = ""

	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	sql := `DELETE FROM t_session_auth WHERE user_id = ?;`

	stmtIns, err := dbh.Prepare(sql)
	util.ErrChk(err)
	defer stmtIns.Close()

	// first return value is 'result', but it's db driver dependent as to whether it gets populated, so it's not reliable
	_, execErr := stmtIns.Exec(userId)

	if execErr != nil {
		// set the result flag and investigate based on the error message
		result = false
		// we can stack the possible error cases here, and fail out hard otherwise
		if strings.Contains(execErr.Error(), "Something something") {
			msg = "Something something"
		} else {
			log.Fatal(execErr) // something else
		}
	}

	return result, msg
}

// Takes the relevant values for the UPDATE
// Returns a boolean indicating success|failure, and a message which will be "" on success
func UpdateStrainInDb(userId int, strainId int, strainName string, sativaPct float64,
	indicaPct float64, thcPct float64, cbdPct float64, stars int, comments string,
	company string, dispensary string) (bool, string) {

	var result bool = true
	var msg string = ""

	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	sql := `UPDATE t_user_strains
			SET strain_name = ?, sativa_pct = ?, indica_pct = ?, thc_pct = ?, cbd_pct = ?, 
				stars = ?, comments = ?, company = ?, dispensary = ?, modified_at = NOW()
			WHERE user_id = ? 
			AND id = ?;`

	stmtIns, err := dbh.Prepare(sql)
	util.ErrChk(err)
	defer stmtIns.Close()

	_, execErr := stmtIns.Exec(strainName, sativaPct, indicaPct, thcPct, cbdPct,
		stars, comments, company, dispensary, userId, strainId)
	if execErr != nil {
		// set the result flag and investigate based on the error message
		result = false
		// we can stack the possible error cases here, and fail out hard otherwise
		if strings.Contains(execErr.Error(), "Error 1062: Duplicate entry") {
			msg = "Duplicate entry"
		} else {
			log.Fatal(execErr) // something else
		}
	}

	return result, msg
}

func DeleteUserStrains(userId int, strains []string) (bool, string) {

	var result bool = true
	var msg string = ""
	var dbh *sql.DB
	var err error

	dbh, err = sql.Open(DRIVER, dsn())
	if err != nil {
		result = false
		msg = err.Error()
	}

	err = dbh.Ping()
	if err != nil {
		result = false
		msg = err.Error()
	}

	sql := `DELETE FROM t_user_strains 
			WHERE user_id = ? 
			AND id = ?;`

	// Deleting concurrently
	// for _, strain := range strains {
	// 	go func(strain string) {
	// 		stmtIns, _ := dbh.Prepare(sql)
	// 		_, _ = stmtIns.Exec(userId, strain)
	// 	}(strain)
	// }

	// Deleting sequentially
	for _, strain := range strains {
		stmtIns, _ := dbh.Prepare(sql)
		_, err = stmtIns.Exec(userId, strain)
		if err != nil {
			result = false
			msg = "Something went wrong when trying to delete this record"
			break
		}
	}

	return result, msg
}
