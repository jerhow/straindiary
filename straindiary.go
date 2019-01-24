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
		log.Println(r.RequestURI)
		userId, _ := strconv.Atoi(r.Header.Get("X-user-id"))
		authToken := r.Header.Get("X-auth-token")

		type Payload struct {
			Msg string
		}
		payload := Payload{
			Msg: "",
		}

		route := strings.Split(r.RequestURI, "?")[0]        // just the route before the '?'
		_, routePresent := config.RoutesAuthRequired[route] // does this route exist in our configs?
		if routePresent {
			if config.RoutesAuthRequired[route] {
				// This route requires a valid session, which you'd only have if you autheticated
				if auth.CheckSession(userId, authToken) == true {
					// session is legit and not expired, so allow request to pass through
					go auth.RefreshSession(userId, authToken)
					next.ServeHTTP(w, r)
				} else {
					// session not found or expired - respond appropriately
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
				// this is an open route, allow request to pass through
				go auth.RefreshSession(userId, authToken)
				next.ServeHTTP(w, r) // call the next handler, which can be another middleware in the chain, or the final handler
			}
		} else {
			// this is an error state: The route must be added to config.RoutesAuthRequired
			// TODO: Handle this case
			w.WriteHeader(http.StatusBadRequest)
			fmt.Println("This is an error state: The route must be added to config.RoutesAuthRequired")
		}
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

	r.HandleFunc("/user", controllers.User_GET).Methods("GET")
	r.HandleFunc("/user/email", controllers.UserEmail_PUT).Methods("PUT")
	r.HandleFunc("/user/nickname", controllers.UserNickname_PUT).Methods("PUT")
	r.HandleFunc("/service/available/email", controllers.CheckAvailableEmail_GET).Methods("GET")
	r.HandleFunc("/service/available/nickname", controllers.CheckAvailableNickname_GET).Methods("GET")

	r.HandleFunc("/ui", views.Index).Methods("GET")
	r.HandleFunc("/ui/", views.Index).Methods("GET")
	r.HandleFunc("/ui/index", views.Index).Methods("GET")
	r.HandleFunc("/ui/strains", views.Strains).Methods("GET")

	r.HandleFunc("/login", controllers.Login_POST).Methods("POST")
	r.HandleFunc("/logout", controllers.Logout_DELETE).Methods("DELETE")

	r.Use(authCheck) // middleware which will run before any route controller

	if err := http.ListenAndServe(":"+config.LOCAL_PORT, r); err != nil {
		log.Fatal(err)
	}
}
