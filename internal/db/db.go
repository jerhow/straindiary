package db

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql" // Imports the package solely for its side-effects
	"github.com/jerhow/straindiary/internal/util"
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
// Returns a boolean indicating success|failure
func WriteNewStrainToDb(userId int, strainName string) bool {

	var result bool = true

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

	_, err2 := stmtIns.Exec(userId, strainName)
	util.ErrChk(err2)

	// At this point, if any of the above were to fail, we would be hard exiting
	// via log.Fatal(), which gets you an os.Exit(1) anyway. So until I can think
	// about this more deeply, we're only returning a status when we succeed.
	return result
}
