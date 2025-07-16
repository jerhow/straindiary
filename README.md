# Strain Diary
Lightweight tool for tracking and organizing one's experiences with various strains, formulations and dosing of medicinal cannabis. Intended use is on a phone, but it's usable in a desktop browser as well.

Trying to keep this project as simple as possible. The backend is headless, so it might be cool to eventually talk to it from a native app, etc.

#### Currently:

- REST API in Go 1.9 + MySQL 8<br/>
- Decoupled web front end in boring HTML + [Vanilla JS](http://vanilla-js.com/)<br/>
- Responsive UI prioritizes mobile experience first, desktop later

#### External dependencies:
- [gorilla/mux](https://github.com/gorilla/mux) (Golang HTTP routing library)
- [madmurphy/cookies.js](https://github.com/madmurphy/cookies.js) (Golang cookie read/write library)
- [robinparisi/tingle](https://github.com/robinparisi/tingle) (JavaScript modal library)


#### License
Copyright © 2018-2019 Jerry Howard<br/>
Distributed under the MIT License
