package db

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql" // Imports the package solely for its side-effects
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

// Takes the relevant values for the INSERT
// Returns a boolean indicating success|failure, and a message which will be "" on success
func WriteNewStrainToDb(userId int, strainName string) (bool, string) {

	var result bool = true
	var msg string = ""

	dbh, err := sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	sql := `
		INSERT INTO t_user_strains
		(user_id, strain_name)
		VALUES 
		(?, ?);`

	stmtIns, err := dbh.Prepare(sql)
	util.ErrChk(err)
	defer stmtIns.Close()

	_, execErr := stmtIns.Exec(userId, strainName) // first return value is 'result', but it's db driver dependent as to whether it gets populated
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

func DeleteUserStrains(userId int, strainsCSV string) (bool, string) {

	// TODO: Replace the util.ErrChk() calls with something we can fail gracefully from

	var result bool = true
	var msg string = ""
	var dbh *sql.DB
	var err error

	dbh, err = sql.Open(DRIVER, dsn())
	util.ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	util.ErrChk(err)

	// I know, I know. Still, strainsCSV is validated before it gets here.
	// I'd prefer some magic way to use a prepared statement with the IN clause,
	// but failing that, I'll probably move this to multiple individual DELETEs
	// which can be prepared statements. I'm not sure that you could sneak an exploit
	// through with only digits and commas and no spaces, but I'm too paranoid to chance it.
	//
	// TODO: Refactor this to execute as multiple individual DELETEs as prepared statements
	sql := `DELETE FROM t_user_strains 
			WHERE user_id = ? 
			AND id IN (` + strainsCSV + `);`

	stmtIns, err := dbh.Prepare(sql)
	util.ErrChk(err)
	defer stmtIns.Close()

	_, execErr := stmtIns.Exec(userId)
	if execErr != nil {
		result = false
		msg = execErr.Error()
	}

	return result, msg
}
