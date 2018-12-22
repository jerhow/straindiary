// More precisely, 'view controllers'.
// There isn't any real distinction, it's just that I've come to think
// of the 'controllers' package as being the engine of the API surface.
// Controllers which deliver some piece of UI (templates in this case),
// should exist in here.

package views

import (
	"github.com/jerhow/straindiary/internal/config"
	"github.com/jerhow/straindiary/internal/util"
	"html/template"
	"net/http"
	"time"
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

	tmpl := template.Must(template.ParseFiles(
		"templates/index.html",
		"templates/index-header-inject.html",
		"templates/header-end.html",
		"templates/header.html",
		"templates/footer.html"))
	tmpl.Execute(w, data)
}

func Strains(w http.ResponseWriter, r *http.Request) {

	type PageData struct {
		BodyTitle  string
		LoginMsg   string
		UserMsg    template.HTML
		Common     util.TemplateCommon
		Nonce      int64
		UserId     int
		StaticPath string
	}
	data := PageData{
		BodyTitle:  "Welcome!",
		LoginMsg:   "",
		UserMsg:    template.HTML(""),
		Common:     util.TmplCommon,
		Nonce:      time.Now().UnixNano(),
		UserId:     3, // TODO: This is obviously temporary
		StaticPath: config.STATIC_ASSET_URL_BASE_LOCAL,
	}

	tmpl := template.Must(template.ParseFiles(
		"templates/strains.html",
		"templates/index-header-inject.html",
		"templates/header-end.html",
		"templates/header.html",
		"templates/footer.html"))
	tmpl.Execute(w, data)
}

func GetEpochNano() int64 {
	// REF: https://gobyexample.com/epoch
	return time.Now().UnixNano()
}
