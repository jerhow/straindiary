package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/jerhow/straindiary/internal/auth"
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/controllers"
	"github.com/jerhow/straindiary/internal/db"
	"github.com/jerhow/straindiary/internal/util"
	"github.com/jerhow/straindiary/internal/views"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// Middleware for checking whether a route requires auth or an existing session,
// and if it does, whether the request provides credentials which would allow the request
// to pass through to completion.
//
// If no, then we stop the request here and send an HTTP 401 Unauthorized response,
// along with some additional info for the client ("Invalid or expired session, please log in"
// or something). From there the client would redirect to the login form
// or whatever UX we're presenting for logins.
//
// NOTE: The routes, and whether they require auth are stored in config.RoutesAuthRequired.
func authCheck(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		userId, _ := strconv.Atoi(r.Header.Get("X-user-id"))
		authToken := r.Header.Get("X-auth-token")

		log.Println(r.RequestURI)

		type Payload struct {
			Msg string
		}
		payload := Payload{
			Msg: "",
		}

		route := strings.Split(r.RequestURI, "?")[0]
		_, routePresent := config.RoutesAuthRequired[route]
		if routePresent {
			if config.RoutesAuthRequired[route] {
				fmt.Println("Auth required for route " + route)
				// Check for auth header containing userId and token
				// Pass userId and token to auth.something() to check for a valid session
				// If valid, pass through
				// If !valid, return a 401 Unauthorized with some useful payload for the client to communicate with the user
				if auth.CheckSession(userId, authToken) == true {
					next.ServeHTTP(w, r)
				} else {
					payload.Msg = "Invalid or expired session, please log in."
					util.SetCommonHttpHeaders(w)
					w.WriteHeader(http.StatusUnauthorized)
					dataJson, err := json.Marshal(payload)
					if err != nil {
						fmt.Fprintf(w, "Error: %s", err)
					}
					w.Write(dataJson)
				}
			} else {
				fmt.Println("Auth not required for route " + route + ", request passes through")
				// This is an open route, allow request to pass through
				next.ServeHTTP(w, r)
			}
		} else {
			fmt.Println("This is an error state: The route must be added to config.RoutesAuthRequired")
			// This is an error state: The route must be added to config.RoutesAuthRequired
			// TODO: Handle this case
		}

		// // test/demo code
		// someCondition := true
		// if someCondition {
		// 	util.SetCommonHttpHeaders(w)
		// 	w.WriteHeader(http.StatusOK)
		// 	w.Write([]byte("Hello!\n"))
		// } else {
		// 	next.ServeHTTP(w, r)
		// }

		// Call the next handler, which can be another middleware in the chain, or the final handler.
		// next.ServeHTTP(w, r)
	})
}

func main() {

	util.Setup()
	db.SetUpEnv()

	r := mux.NewRouter()
	r.HandleFunc("/", controllers.Index_GET).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_GET).Methods("GET")
	r.HandleFunc("/strain", controllers.Strain_POST).Methods("POST")
	r.HandleFunc("/strain", controllers.Strain_PUT).Methods("PUT")
	r.HandleFunc("/strain", controllers.Strain_DELETE).Methods("DELETE")

	r.HandleFunc("/ui", views.Index).Methods("GET")
	r.HandleFunc("/ui/", views.Index).Methods("GET")
	r.HandleFunc("/ui/index", views.Index).Methods("GET")
	r.HandleFunc("/ui/strains", views.Strains).Methods("GET")

	r.HandleFunc("/login", controllers.Login_POST).Methods("POST")

	r.Use(authCheck) // middleware which will run before any route controller

	if err := http.ListenAndServe(":"+config.LOCAL_PORT, r); err != nil {
		log.Fatal(err)
	}
}
