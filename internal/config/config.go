// Package config is the place for application-level configuration.
// Things like feature flags, etc.
// NOTE: Only put things in here that you would feel comfortable pushing
// to the repo. Nothing sensitive (keys, auth stuff, db crap) should
// be here (those should live in the ENV config variables).
package config

const LOCAL_PORT string = "8000"

const PAGE_TITLE string = "Strain Diary: Track Your Trees"
const MASTHEAD_TAGLINE string = "Track Your Trees"

const STATIC_ASSET_URL_BASE_PROD string = "https://d3nmkh7m4z5hgu.cloudfront.net/"
const STATIC_ASSET_URL_BASE_STAGE string = "https://d3nmkh7m4z5hgu.cloudfront.net/"
const STATIC_ASSET_URL_BASE_DEV string = "http://localhost:8080/"

const STATIC_ASSET_URL_BASE_LOCAL string = "http://localhost:8080/"
const STATIC_ASSET_URL_BASE_DEFAULT string = "http://localhost:8080/"

const HTTP_RESP_CONTENT_TYPE string = "application/json"
const HTTP_RESP_CONTENT_LANGUAGE string = "en"
const HTTP_RESP_CACHE_CONTROL string = "no-store, no-cache"
const HTTP_RESP_LOCATION string = "https://www.straindiary.com"

const SQL_SESSION_OFFSET string = "INTERVAL 30 DAY" // meaning that sessions time out after this amount of inactivity
const JS_SESSION_FACTOR int = 30                    // 30 days

const BCRYPT_COST int = 10 // TODO: Research the optimal number of rounds (was 14 originally, but that was very slow)

var RoutesAuthRequired = map[string]bool{
	"/":                           false,
	"/strain":                     true,
	"/ui":                         false,
	"/ui/index":                   false,
	"/ui/strains":                 false,
	"/login":                      false,
	"/logout":                     false,
	"/user":                       true,
	"/user/email":                 true,
	"/user/nickname":              true,
	"/user/pwd":                   true,
	"/service/available/email":    true,
	"/service/available/nickname": true,
}
