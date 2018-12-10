// More precisely, 'view controllers'.
// There isn't any real distinction, it's just that I've come to think
// of the 'controllers' package as being the engine of the API surface.
// Controllers which deliver some piece of UI (templates in this case),
// should exist in here.

package views

import (
	// "fmt"
	// "net/url"
	// "encoding/json"
	"html/template"
	"net/http"
	// "regexp"
	// "strconv"
	// "strings"
	"github.com/jerhow/straindiary/internal/util"
)

func Index(w http.ResponseWriter, r *http.Request) {

	type PageData struct {
		BodyTitle string
		LoginMsg  string
		UserMsg   template.HTML
		Common    util.TemplateCommon
	}
	data := PageData{
		BodyTitle: "Welcome!",
		LoginMsg:  "",
		UserMsg:   template.HTML(""),
		Common:    util.TmplCommon,
	}

	// data.Common.ShowNav = false // Overriding the default value

	// userMsg := r.URL.Query().Get("um")
	// if userMsg == "nosession" {
	// 	data.UserMsg = template.HTML(`<span id="user_msg_content"
	// 		style="color: red;">Session expired. Please log in again.</span>`)
	// } else if userMsg == "noauth" {
	// 	data.UserMsg = template.HTML(`<span id="user_msg_content"
	// 		style="color: red;">Invalid login. Please try again.</span>`)
	// }

	tmpl := template.Must(template.ParseFiles(
		"templates/index.html",
		"templates/index-header-inject.html",
		"templates/header-end.html",
		"templates/header.html",
		"templates/footer.html"))
	tmpl.Execute(w, data)
}
