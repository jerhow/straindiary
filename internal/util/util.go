// Package util is the place for utility functions,
// common variables, constants, data structures, etc
// which are used across multiple parts of the application.
// Note the relationship with the 'config' package, which is
// strictly for hard-coded, common values.
package util

import (
	"fmt"
	"github.com/jerhow/straindiary/internal/config"
	"log"
	"net/http"
	"os"
	"regexp"
	"time"
)

var STATIC_ASSET_URL_BASE string

type TemplateCommon struct {
	PageTitle          string
	CopyrightYear      int
	StaticAssetUrlBase string
	DisplayBranding    bool
	MastheadTagline    string
	ShowNav            bool
}

var TmplCommon TemplateCommon

// Anything we need to initialize in 'util' should go in here,
// or at least be kicked off from in here
func Setup() {

	// Work out the appropriate URL base for static assets
	//
	// NOTE: The 'localhost' values here refer to the Apache container
	// I am currently using to serve the static assets. It is meant to
	// mimic the production stack, which uses an S3 bucket.
	//
	// The reason we can't just expose a 'static' route and serve
	// a similarly-named directory from the app's file system is
	// that, on Heroku, the dyno and filesystem are ephemeral.
	// If this were sitting on a server or VPS, that would be possible.
	currentEnv := os.Getenv("SD_GO_ENV")
	switch currentEnv {
	case "production":
		STATIC_ASSET_URL_BASE = config.STATIC_ASSET_URL_BASE_PROD
	case "stage":
		STATIC_ASSET_URL_BASE = config.STATIC_ASSET_URL_BASE_STAGE
	case "dev":
		STATIC_ASSET_URL_BASE = config.STATIC_ASSET_URL_BASE_DEV
	case "devlocal":
		STATIC_ASSET_URL_BASE = config.STATIC_ASSET_URL_BASE_LOCAL
	default:
		STATIC_ASSET_URL_BASE = config.STATIC_ASSET_URL_BASE_DEFAULT
	}

	// Initialize the common template struct
	// Expects STATIC_ASSET_URL_BASE to be set already
	TmplCommon.PageTitle = config.PAGE_TITLE
	TmplCommon.CopyrightYear = time.Now().Year()
	TmplCommon.StaticAssetUrlBase = STATIC_ASSET_URL_BASE
	TmplCommon.MastheadTagline = config.MASTHEAD_TAGLINE
}

func SetCommonHttpHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", config.HTTP_RESP_CONTENT_TYPE)
	w.Header().Set("Content-Language", config.HTTP_RESP_CONTENT_LANGUAGE)
	w.Header().Set("Cache-Control", config.HTTP_RESP_CACHE_CONTROL)
	w.Header().Set("Location", config.HTTP_RESP_LOCATION)
}

func ErrChk(err error) {
	if err != nil {
		log.Fatal(err) // panic(err.Error)
	}
}

// Pass it the ENV variable you want, get back the value.
// This is environment-sensitive (prod, stage, dev, devlocal).
// Note the order of precedence in environments:
// (look up PROD first, then STAGE (future), then DEV (future) or DEVLOCAL)
// Fails out hard if an appropriate ENV var is not found.
// TODO: Fail more gracefully, and with proper logging.
// ***
// NOTE: This function is specifically meant for the SD_{ENV}_* variables.
// For non-prefixed vars, just fetch them normally with os.Getenv("WHATEVER")
func FetchEnvVar(envVarName string) string {
	var val string
	var varExists bool

	val, varExists = os.LookupEnv("SD_PROD_" + envVarName)
	if !varExists {
		val, varExists = os.LookupEnv("SD_LOCALDEV_" + envVarName)
		if !varExists {
			fmt.Println("util.FetchEnvVar: No suitable ENV variable found for '" + envVarName + "'")
			os.Exit(1)
		}
	}

	return val
}

// Throw a string containing a userId (usually as raw input from a request) at this, get back a boolean
func UserIdValidFormat(userId string) bool {
	re := regexp.MustCompile("^\\d+$")
	return re.MatchString(userId)
}
