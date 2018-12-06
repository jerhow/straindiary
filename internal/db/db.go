package db

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql" // Imports the package solely for its side-effects
	// "github.com/jerhow/nerdherdr/internal/util"
	"log"
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
	// DRIVER = util.FetchEnvVar("DB_DRIVER")
	// DB_USER = util.FetchEnvVar("DB_USER")
	// DB_PASS = util.FetchEnvVar("DB_PASS")
	// DB_HOST = util.FetchEnvVar("DB_HOST")
	// DB_PORT = util.FetchEnvVar("DB_PORT")
	// DB_NAME = util.FetchEnvVar("DB_NAME")

	DRIVER = "mysql"
	DB_USER = "jerry"
	DB_PASS = "pass"
	DB_HOST = "go_mysql80_1"
	DB_PORT = "3306"
	DB_NAME = "straindiary"
}

func ErrChk(err error) {
	if err != nil {
		log.Fatal(err) // panic(err.Error)
	}
}

func dsn() string {
	return DB_USER + ":" + DB_PASS + "@tcp(" + DB_HOST + ":" + DB_PORT + ")/" + DB_NAME
}

func Db1() {
	fmt.Println("sup from db()")
	dbh, err := sql.Open(DRIVER, dsn())
	ErrChk(err)
	defer dbh.Close()

	err = dbh.Ping()
	ErrChk(err)

	stmtIns, err := dbh.Prepare("INSERT INTO t_user_strains (user_id, strain_name) VALUES (?, ?)")
	ErrChk(err)
	defer stmtIns.Close()

	_, err2 := stmtIns.Exec(1, "Strawberry Cough")
	ErrChk(err2)

	// insert, err := db.Query("INSERT INTO t_users (l_name, f_initial) VALUES ('Franklin', 'A')")
	// if err != nil {
	// 	log.Fatal(err) // panic(err.Error)
	// }
	// defer insert.Close()
}
