var sd = {
    data: null,
    newModal: null, // new strain
    editModal: null,
    deleteModal: null,
    loginModal: null,
    staticPath: '',
    sessionFactor: 0,
    oneDayInSeconds: 86400,
    readyState: {
        "UNSENT": 0,
        "OPENED": 1,
        "HEADERS_RECEIVED": 2,
        "LOADING": 3,
        "DONE": 4
    },
    currency: {
        "USD": "USD,$",
        "CAD": "CAD,C$",
        "EUR": "EUR,€",
        "GBP": "GBP,£",
        "AUD": "AUD,AU$",
        "MXN": "MXN,MX$",
        "CHF": "CHF,Fr",
        "JPY": "JPY,¥",
        "NZD": "NZD,NZ$",
        "SEK": "SEK,kr",
        "DKK": "DKK,kr",
        "NOK": "NOK,kr",
        "SGD": "SGD,S$",
        "CZK": "CZK,Kč",
        "HKD": "HKD,HK$",
        "CNH": "CNH,¥",
        "PLN": "PLN,zł",
        "RUB": "RUB,₽",
        "TRY": "TRY,₺",
        "ZAR": "ZAR,R"
    },
    currencyDdl: function() {
        var arr = [];
        var defaultValue = "USD";
        var selected = "";
        arr.push("<select id='ddl_currency' name='ddl_currency' onchange='sd.currencyChange(this);'>");
        // arr.push("<option value=''>Currency</option>");
        for(var key in sd.currency) {
            if(key === defaultValue) {
                selected = " selected ";
            } else {
                selected = " ";
            }
            arr.push("<option value='" + sd.currency[key] + "' " + selected + ">" + key + "</option>");
        }
        arr.push("</select>");
        return arr.join("");
    },
    currencyChange: function(obj) {
        document.getElementById("currency_symbol").innerHTML = obj.options[obj.selectedIndex].value.split(',')[1];
    },
    userSettings: function() {
        // TODO
        console.log("This doesn't do anything yet");
    },
    userId: function() {
        return docCookies.getItem('user_id');
    },
    nickname: function() {
        return docCookies.getItem('nickname');
    },
    authToken: function() {
        return docCookies.getItem('auth_token');
    },
    logout: function() {
        var userId = sd.userId();
        var authToken = sd.authToken();
        docCookies.removeItem('user_id');
        docCookies.removeItem('nickname');
        docCookies.removeItem('auth_token');
        sd.sendLogout(userId, authToken, function() {
            window.location.replace('/ui/strains');
        });
    },
    sendLogout: function(userId, authToken, _callback) {
        var XHR = new XMLHttpRequest();

        XHR.addEventListener('load', function(event) {
            console.log('Logout request sent and response loaded');
        });

        XHR.addEventListener('error', function(event) {
            console.log('ERROR: Crap something went wrong in sd.sendLogout()');
        });

        XHR.open('DELETE', '/logout');

        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        XHR.setRequestHeader('X-user-id', userId);
        XHR.setRequestHeader('X-auth-token', authToken);

        XHR.onreadystatechange = function () {
            if(XHR.readyState === 4 && XHR.status === 200) {
                console.log(XHR.responseText);
                _callback();
            } else {
                console.log(XHR.responseText);
                console.log("ERROR in sd.sendLogout():");
                console.log("Error number: " + XHR.status);
                console.log("Error msg: " + XHR.statusText);
            }
        };

        XHR.send();
    },
    manageUiBasedOnUserState: function() {
        if(sd.validSession()) {
            document.getElementById("functional_row_top").style.display = 'block';
            document.getElementById("strains_page_login_msg").style.display = 'none';
            document.getElementById('face_icon').style.display = 'inline';
            document.getElementById('logout_icon').style.display = 'inline';
        } else {
            document.getElementById('functional_row_top').style.display = 'none';
            document.getElementById('strains_page_login_msg').style.display = 'block';
            document.getElementById('face_icon').style.display = 'none';
            document.getElementById('logout_icon').style.display = 'none';
            sd.popLoginForm();
        }
    },
    validSession: function() {
        return (docCookies.hasItem('user_id') && docCookies.hasItem('auth_token'));
    },
    popLoginForm: function() {
        sd.instantiateLoginModal();
        sd.loginModal.open();
    },
    instantiateLoginModal: function() {
        sd.loginModal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['escape'],
            closeLabel: "Close",
        });

        sd.loginModal.setContent(sd.loginForm());

        sd.loginModal.addFooterBtn('Login', 'tingle-btn tingle-btn--primary tingle-btn--pull-left', function() {
            sd.login(function(responseText) {
                var payload = JSON.parse(responseText);
                var msg = payload['Msg'];
                var loginStatus = payload['LoginStatus'];
                if(loginStatus === true) {
                    docCookies.setItem('user_id', payload['UserId'], (sd.oneDayInSeconds * sd.sessionFactor));
                    docCookies.setItem('nickname', payload['Nickname'], (sd.oneDayInSeconds * sd.sessionFactor));
                    docCookies.setItem('auth_token', payload['AuthToken'], (sd.oneDayInSeconds * sd.sessionFactor));
                    document.getElementById('nickname').innerHTML = docCookies.getItem('nickname') || '';
                    sd.loginModal.close();
                    sd.viewStrains();
                } else {
                    document.getElementById('login_form_msg').innerHTML = msg;
                    document.getElementById('btn_forgot_password').style.visibility = 'visible';
                }
            });
        });

        sd.loginModal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function() {
            sd.loginModal.close();
        });
    },
    loginForm: function() {
        return "" +
        "<div id='login_form_container'>" +
        "   <div id='login_form_heading_1'>Strain Diary</div>" +
        "   <div id='login_form_heading_2'>Track Your Trees</div>" +
        "   <form action='/login' method='POST'>" +
        "   <div class='login_form_row'>" +
        "       <div class='login_form_row_left'>" +
        "           <label class='login_form_label' for='un'>Email:</label>" +
        "       </div>" +
        "       <div class='login_form_row_right'>" +
        "           <input type='text' id='un' name='un' />" +
        "       </div>" +
        "    </div>" +
        "    <div class='login_form_row'>" +
        "       <div class='login_form_row_left'>" +
        "           <label class='login_form_label' for='pw'>Password:</label>" +
        "       </div>" +
        "       <div class='login_form_row_right'>" +
        "           <input type='password' id='pw' name='pw' />" +
        "       </div>" +
        "    </div>" +
        "   </form>" +
        "    <div id='login_form_msg_row'>" +
        "       <div id='login_form_msg'></div>" +
        "       <div id='login_form_forgot_password'>" +
        "           <button id='btn_forgot_password' onclick='sd.forgotPassword(); return false;'>Forgot Password?</button>" +
        "       </div>" +
        "    </div>" +
        "</div>";
    },
    forgotPassword: function() {
        // TODO
        console.log("This doesn't do anything yet");
    },
    viewStrains: function(sortBy, orderBy) {
        var userId = sd.userId();
        var authToken = sd.authToken();

        if(!sortBy) {
            sortBy = "1";
        }
        if(!orderBy) {
            orderBy = "0";
        }

        var url = '/strain?user_id=' + userId + '&sb=' + sortBy + '&ob=' + orderBy;
        var XHR = new XMLHttpRequest();
        XHR.open('GET', url, true);
        XHR.setRequestHeader('X-user-id', userId);
        XHR.setRequestHeader('X-auth-token', authToken);

        XHR.onload = function() {
            if (XHR.status === 200) {
                sd.data = JSON.parse(XHR.responseText);
                sd.manageUiBasedOnUserState();
                sd.buildStrainOutput();
            } else if (XHR.status === 401) {
                // 401 Unauthorized, meaning the backend rejected us based on session
                console.log("ERROR in viewStrains(): HTTP 401 Unauthorized");
                console.log("Error number: " + XHR.status);
                console.log("Error msg: " + XHR.statusText);
            }
            else {
                console.log("ERROR in viewStrains(): We reached the server, but it returned an error");
                console.log("Error number: " + XHR.status);
                console.log("Error msg: " + XHR.statusText);
            }
        };

        XHR.onerror = function() {
            console.log("ERROR in viewStrains(): There was a connection error of some sort");
        };

        XHR.send();
    },
    buildStrainOutput: function() {
        var strainDivs = [];
        var idx, strainId, userId, strainName, currency, price, unitOfMeasure, sativaPct, indicaPct, thcPct, cbdPct;
        var stars, comments, company, dispensary, createdAt, modifiedAt;
        var strainCount = Object.keys(this.data.StrainData).length;
        var dispensaryRow, companyRow, priceRow;
        var commentsRow, commentsRowUpper, commentsRowLower;
        
        for(idx = 0; idx < strainCount; idx++) {
            strainId = this.data.StrainData[idx]["Id"];
            userId = this.data.StrainData[idx]["UserId"];
            strainName = this.data.StrainData[idx]["StrainName"];
            price = this.data.StrainData[idx]["Price"];
            currency = sd.currency[this.data.StrainData[idx]["CurrencyAbbreviation"]].split(',')[1];
            unitOfMeasure = this.data.StrainData[idx]["UnitOfMeasure"];
            sativaPct = this.data.StrainData[idx]["SativaPct"];
            indicaPct = this.data.StrainData[idx]["IndicaPct"];
            thcPct = this.data.StrainData[idx]["ThcPct"];
            cbdPct = this.data.StrainData[idx]["CbdPct"];
            stars = this.data.StrainData[idx]["Stars"];
            comments = this.data.StrainData[idx]["Comments"];
            company = this.data.StrainData[idx]["Company"];
            dispensary = this.data.StrainData[idx]["Dispensary"];
            createdAt = this.data.StrainData[idx]["CreatedAt"];
            modifiedAt = this.data.StrainData[idx]["ModifiedAt"];

            if(price > 0) {
                priceRow = "<div id='stats_price_" + strainId + "' class='strain_stats_display'>" + currency + price + " / " + unitOfMeasure + "</div> ";
            } else {
                // priceRow = "<div id='stats_price_" + strainId + "' class='strain_stats_display'>&nbsp;</div> "; // this clears the row
                priceRow = ""; // this collapses the row, allowing everything else in the right column to move up a spot
            }

            if(company === "") {
                companyRow = "";
            } else {
                companyRow = "<div id='strain_company_" + strainId + "' class='strain_company_display'>Company: <span class='output_italic'>" + company + "</span></div> ";
            }

            if(dispensary === "") {
                dispensaryRow = "";
            } else {
                dispensaryRow = "<div id='strain_dispensary_" + strainId + "' class='strain_dispensary_display'>Dispensary: <span class='output_italic'>" + dispensary + "</span></div> ";
            }

            commentsRow = "<div id='comments_row_" + strainId + "' class='comments_row'>" +
                "       <div id='comment_text_" + strainId + "' class='comment_text'><span class='comments_display_label'>Comments:</span> " + comments + "</div>" +
                "   </div>";

            commentsRowUpper = ""; // Must clear these...
            commentsRowLower = ""; // ...on each iteration
            if(company === "" || dispensary === "") {
                commentsRowUpper = commentsRow;
            } else {
                commentsRowLower = commentsRow;
            }

            strainDivs.push("" +
                "<div id='strain_" + strainId + "' class='strain_row'>" +
                "   <div id='column_left_" + strainId + "' class='strain_column_left'>" +
                "       <div id='strain_name_" + strainId + "' class='strain_name_display'>" + strainName + "</div> " +
                "       <div id='star_rating_" + strainId + "' class='strain_rating_display'>" + sd.displayStars(stars) + "</div> " +
                        companyRow +
                        dispensaryRow +
                        commentsRowUpper +
                "   </div>" +
                "   <div id='column_right_" + strainId + "' class='strain_column_right'>" +
                        priceRow +
                "       <div id='stats_sativa_" + strainId + "' class='strain_stats_display'>" + sativaPct + "% Sativa</div> " +
                "       <div id='stats_indica_" + strainId + "' class='strain_stats_display'>" + indicaPct + "% Indica</div> " +
                "       <div id='stats_thc_" + strainId + "' class='strain_stats_display'>" + thcPct + "% THC</div> " +
                "       <div id='stats_cbd_" + strainId + "' class='strain_stats_display'>" + cbdPct + "% CBD</div> " +
                "   </div>" +
                "   <div class='clear'></div>" +
                    commentsRowLower +
                "   <div id='action_row_" + strainId + "' class='action_row'>" + 
                "       <button id='btn_edit_strain_" + strainId + "' class='btn_edit_strain' onclick='sd.popEditStrainForm(" + strainId + ")'>&nbsp;Edit&nbsp;</button>" +
                "       <button id='btn_delete_strain_" + strainId + "' class='btn_delete_strain' onclick=\"sd.popDeleteModal(" + strainId + ", '" + strainName + "')\">Delete</button>" +
                "   </div>" +
                "</div>"
            );
        }
        
        document.getElementById("strain_container").innerHTML = strainDivs.join("");
        return true;
    },
    displayStars(rating) {
        if(rating === 0) {
            return "&nbsp;"; // sending an encoded space instead of "" lets us retain the vertical spacing of the div
        } else {
            var star = "<img src='" + sd.staticPath + "star-rating-widget/star-on.svg' class='star_for_list'>";
            return star.repeat(rating);
        }
    },
    // Expects 'POST' or 'PUT'
    // _callback gets executed when the asynchronous call finishes
    sendStrain: function(method, _callback) {
        var XHR = new XMLHttpRequest();
        var urlEncodedData = "";
        var urlEncodedDataPairs = [];

        var userId = document.getElementById("user_id").value;
        var strain_name = document.getElementById("strain_name").value;
        var stars = document.getElementById("stars").value;
        var price = document.getElementById("price").value;
        var currency = document.getElementById("ddl_currency").value.split(',')[0];
        var unit_of_measure = document.getElementById("ddl_unit_of_measure").value;
        var sativa_pct = document.getElementById("sativa_pct").value;
        var indica_pct = document.getElementById("indica_pct").value;
        var thc_pct = document.getElementById("thc_pct").value;
        var cbd_pct = document.getElementById("cbd_pct").value;
        var company = document.getElementById("company").value;
        var dispensary = document.getElementById("dispensary").value;
        var comments = document.getElementById("comments").value;

        if(method === 'PUT') {
            var strainId = document.getElementById("strain_id").value;
        }

        urlEncodedDataPairs.push(encodeURIComponent("user_id") + '=' + encodeURIComponent(userId));
        urlEncodedDataPairs.push(encodeURIComponent("strain_name") + '=' + encodeURIComponent(strain_name));
        urlEncodedDataPairs.push(encodeURIComponent("stars") + '=' + encodeURIComponent(stars));
        urlEncodedDataPairs.push(encodeURIComponent("price") + '=' + encodeURIComponent(price));
        urlEncodedDataPairs.push(encodeURIComponent("currency") + '=' + encodeURIComponent(currency));
        urlEncodedDataPairs.push(encodeURIComponent("unit_of_measure") + '=' + encodeURIComponent(unit_of_measure));
        urlEncodedDataPairs.push(encodeURIComponent("sativa_pct") + '=' + encodeURIComponent(sativa_pct));
        urlEncodedDataPairs.push(encodeURIComponent("indica_pct") + '=' + encodeURIComponent(indica_pct));
        urlEncodedDataPairs.push(encodeURIComponent("thc_pct") + '=' + encodeURIComponent(thc_pct));
        urlEncodedDataPairs.push(encodeURIComponent("cbd_pct") + '=' + encodeURIComponent(cbd_pct));
        urlEncodedDataPairs.push(encodeURIComponent("company") + '=' + encodeURIComponent(company));
        urlEncodedDataPairs.push(encodeURIComponent("dispensary") + '=' + encodeURIComponent(dispensary));
        urlEncodedDataPairs.push(encodeURIComponent("comments") + '=' + encodeURIComponent(comments));

        if(method === 'PUT') {
            urlEncodedDataPairs.push(encodeURIComponent("strain_id") + '=' + encodeURIComponent(strainId));
        }
  
        // Combine the pairs into a single string and replace all %-encoded spaces to 
        // the '+' character; matches the behaviour of browser form submissions.
        urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');

        // Define what happens on successful data submission
        XHR.addEventListener('load', function(event) {
            // console.log('Data sent and response loaded: sd.sendStrain()');
        });

        // Define what happens in case of error
        XHR.addEventListener('error', function(event) {
            // console.log('Something went wrong: sd.sendStrain()');
        });

        // Set up our request
        XHR.open(method, '/strain');

        // Add the required HTTP header for form data POST requests
        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        XHR.setRequestHeader('X-user-id', sd.userId());
        XHR.setRequestHeader('X-auth-token', sd.authToken());

        XHR.onreadystatechange = function() {
            if(XHR.readyState === sd.readyState["DONE"]) {
                if(XHR.status === 200) { // success
                    _callback();
                    sd.viewStrains();
                } else if(XHR.status === 400) { // a handled error state
                    document.getElementById('strain_name_msg').style.display = 'inline-block';
                    document.getElementById('strain_name_msg').innerHTML = JSON.parse(XHR.responseText)['Msg'];
                } else { // TODO: Unhandled error states
                    console.log('ERROR: Something went wrong in sd.sendStrain(). ' +
                        'We got an undesirable response code back: ' + XHR.status);
                    console.log(XHR.responseText);
                }
            }
        };

        // Finally, send our data.
        XHR.send(urlEncodedData);
    },
    login: function(_callback) {
        var XHR = new XMLHttpRequest();
        var urlEncodedData = "";
        var urlEncodedDataPairs = [];

        var un = document.getElementById("un").value;
        var pw = document.getElementById("pw").value;

        urlEncodedDataPairs.push(encodeURIComponent("un") + '=' + encodeURIComponent(un));
        urlEncodedDataPairs.push(encodeURIComponent("pw") + '=' + encodeURIComponent(pw));
  
        // Combine the pairs into a single string and replace all %-encoded spaces to 
        // the '+' character; matches the behaviour of browser form submissions.
        urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');

        // Define what happens on successful data submission
        XHR.addEventListener('load', function(event) {
            console.log('Success: Data sent and response loaded');
        });

        // Define what happens in case of error
        XHR.addEventListener('error', function(event) {
            console.log('Hmm something went wrong with the call');
        });

        // Set up our request
        XHR.open('POST', '/login');

        // Add the required HTTP header for form data POST requests
        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        XHR.onreadystatechange = function () {
            if(XHR.readyState === 4 && (XHR.status === 200 || XHR.status === 401)) {
                _callback(XHR.responseText);
            }
        };

        // Finally, send our data.
        XHR.send(urlEncodedData);
    },
    clickSort: function() {
        document.getElementById("btn_sort").style.display = "none";
        document.getElementById("sort_ddl").style.display = "inline";
    },
    sortChange: function(obj) {
        var vals = obj.value.split(',');
        sd.viewStrains(vals[0], vals[1]); // (sortBy, orderBy)
        document.getElementById("sort_ddl").style.display = "none";
        document.getElementById("btn_sort").style.display = "inline";
    },
    onStarClick: function(starValue) {
        document.getElementById('stars').value = starValue;
    },
    popNewStrainForm: function() {
        sd.instantiateNewFormModal();
        sd.newModal.open();
    },
    newStrainForm: function(userId) {
        return "" +
        "<div id='new_strain_form_container'>" +
        "   <div id='new_strain_modal_title'>New Strain</div>" +
        "   <form id='new_strain_form'>" +
        "       <input type='hidden' id='user_id' name='user_id' value='" + userId + "' />" +
        "       <input type='hidden' id='stars' name='stars' value='' />" +
        "       <div id='con_strain_name'>" +
        "           <label>Name:</label> " +
        "           <input type='text' id='strain_name' name='strain_name' tabindex='100' />" +
        "           <div id='strain_name_msg'></div>" +
        "       </div>" +
        "       <div id='con_star_rating'>" +
        "           <label>Rating:</label> <span class='starRating'>" +
        "               <input id='rating5' type='radio' name='rating' value='5' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating5'>5</label>" +
        "               <input id='rating4' type='radio' name='rating' value='4' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating4'>4</label>" +
        "               <input id='rating3' type='radio' name='rating' value='3' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating3'>3</label>" +
        "               <input id='rating2' type='radio' name='rating' value='2' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating2'>2</label>" +
        "               <input id='rating1' type='radio' name='rating' value='1' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating1'>1</label>" +
        "           </span>" +
        "       </div>" +
        "       <div id='con_price'>" +
        "           <label id='price_label'>Price:</label> <span id='currency_symbol'>$</span>" +
        "           <input type='number' step='.01' id='price' name='price' tabindex='90' maxlength='7' />" +
        "       </div>" +
        "       <div id='con_currency'>" +
                    sd.currencyDdl() +
        "       </div>" +
        "       <div id='con_unit_of_measure'>" +
        "           <label id='unit_of_measure_label' for='unit_of_measure'>per</label> " +
        "           <select id='ddl_unit_of_measure' name='ddl_unit_of_measure'>" +
        "               <option value='gram'>Gram</option>" +
        "               <option value='eighth' selected>Eighth</option>" +
        "               <option value='quarter'>Quarter</option>" +
        "               <option value='half'>Half</option>" +
        "               <option value='ounce'>Ounce</option>" +
        "           </select>" +
        "       </div>" +
        "       <div id='con_sativa_pct'>" +
        "           <label id='sativa_pct_label'>Sativa:</label> <input type='number' step='.01' id='sativa_pct' name='sativa_pct' tabindex='101' /> %" +
        "       </div>" +
        "       <div id='con_thc_pct'>" +
        "           <label id='thc_pct_label'>THC:</label> <input type='number' step='.01' id='thc_pct' name='thc_pct' tabindex='103' /> %" +
        "       </div>" +
        "       <div id='con_indica_pct'>" +
        "           <label id='indica_pct_label'>Indica:</label> <input type='number' step='.01' id='indica_pct' name='indica_pct' tabindex='102' /> %" +
        "       </div>" +
        "       <div id='con_cbd_pct'>" +
        "           <label id='cbd_pct_label'>CBD:</label> <input type='number' step='.01' id='cbd_pct' name='cbd_pct' tabindex='104' /> %" +
        "       </div>" +
        "       <div id='con_company'>" +
        "           <label id='company_label'>Company:</label> <input type='text' id='company' name='company' tabindex='105' />" +
        "       </div>" +
        "       <div id='con_dispensary'>" +
        "           <label>Dispensary:</label> <input type='text' id='dispensary' name='dispensary' tabindex='106' />" +
        "       </div>" +
        "       <div id='con_comments'>" +
        "           <label>Comments:</label> " +
        "           <textarea id='comments' name='comments' rows=4 cols=30 tabindex='107'></textarea>" +
        "       </div>" +
        "   </form>" +
        "</div>";
    },
    strainPicker: function(strainId) {
        var strainCount = Object.keys(this.data.StrainData).length;
        // Find the correct strainId and return a reference to it from the data object
        for(var idx = 0; idx < strainCount; idx++) {
            if(this.data.StrainData[idx]["Id"] === strainId) {
                return this.data.StrainData[idx];
            }
        }
        return false;
    },
    editStrainForm: function(userId, strainId) {
        var vals = sd.strainPicker(strainId);
        return "" +
        "<div id='edit_strain_form_container'>" +
        "   <div id='edit_strain_modal_title'>Edit Strain</div>" +
        "   <form id='edit_strain_form'>" +
        "       <input type='hidden' id='user_id' name='user_id' value='" + userId + "' />" +
        "       <input type='hidden' id='strain_id' name='strain_id' value='" + strainId + "' />" +
        "       <input type='hidden' id='stars' name='stars' value='" + vals['Stars'] + "' />" +
        "       <div id='con_strain_name'>" +
        "           <label>Name:</label> " +
        "           <input type='text' id='strain_name' name='strain_name' tabindex='100' value=\"" + vals['StrainName'] + "\" />" +
        "       </div>" +
        "       <div id='con_star_rating'>" +
        "           <label>Rating:</label> <span class='starRating'>" +
        "               <input id='rating5' type='radio' name='rating' value='5' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating5' id='rating_label_5'>5</label>" +
        "               <input id='rating4' type='radio' name='rating' value='4' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating4' id='rating_label_4'>4</label>" +
        "               <input id='rating3' type='radio' name='rating' value='3' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating3' id='rating_label_3'>3</label>" +
        "               <input id='rating2' type='radio' name='rating' value='2' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating2' id='rating_label_2'>2</label>" +
        "               <input id='rating1' type='radio' name='rating' value='1' onclick='sd.onStarClick(this.value);'>" +
        "               <label for='rating1' id='rating_label_1'>1</label>" +
        "           </span>" +
        "       </div>" +
        "       <div id='con_price'>" +
        "           <label id='price_label'>Price:</label> <span id='currency_symbol'>$</span>" +
        "           <input type='number' step='.01' id='price' name='price' tabindex='90' maxlength='7' value='" + vals['Price'] + "' />" +
        "       </div>" +
        "       <div id='con_currency'>" +
                    sd.currencyDdl() +
        "       </div>" +
        "       <div id='con_unit_of_measure'>" +
        "           <label id='unit_of_measure_label' for='unit_of_measure'>per</label> " +
        "           <select id='ddl_unit_of_measure' name='ddl_unit_of_measure'>" +
        "               <option value='gram'>Gram</option>" +
        "               <option value='eighth' selected>Eighth</option>" +
        "               <option value='quarter'>Quarter</option>" +
        "               <option value='half'>Half</option>" +
        "               <option value='ounce'>Ounce</option>" +
        "           </select>" +
        "       </div>" +
        "       <div id='con_sativa_pct'>" +
        "           <label id='sativa_pct_label'>Sativa:</label> <input type='number' step='.01' id='sativa_pct' name='sativa_pct' tabindex='101' value='" + vals['SativaPct'] + "' /> %" +
        "       </div>" +
        "       <div id='con_thc_pct'>" +
        "           <label id='thc_pct_label'>THC:</label> <input type='number' step='.01' id='thc_pct' name='thc_pct' tabindex='103' value='" + vals['ThcPct'] + "' /> %" +
        "       </div>" +
        "       <div id='con_indica_pct'>" +
        "           <label id='indica_pct_label'>Indica:</label> <input type='number' step='.01' id='indica_pct' name='indica_pct' tabindex='102' value='" + vals['IndicaPct'] + "' /> %" +
        "       </div>" +
        "       <div id='con_cbd_pct'>" +
        "           <label id='cbd_pct_label'>CBD:</label> <input type='number' step='.01' id='cbd_pct' name='cbd_pct' tabindex='104' value='" + vals['CbdPct'] + "' /> %" +
        "       </div>" +
        "       <div id='con_company'>" +
        "           <label id='company_label'>Company:</label> <input type='text' id='company' name='company' tabindex='105' value=\"" + vals['Company'] + "\" />" +
        "       </div>" +
        "       <div id='con_dispensary'>" +
        "           <label>Dispensary:</label> <input type='text' id='dispensary' name='dispensary' tabindex='106' value=\"" + vals['Dispensary'] + "\" />" +
        "       </div>" +
        "       <div id='con_comments'>" +
        "           <label>Comments:</label> " +
        "           <textarea id='comments' name='comments' rows=4 cols=30 tabindex='107'>" + vals['Comments'] + "</textarea>" +
        "       </div>" +
        "   </form>" +
        "</div>";
    },
    popEditStrainForm: function(strainId) {
        var userId = sd.userId();
        sd.instantiateEditFormModal(userId, strainId);
        sd.editModal.open();
        sd.setStarWidgetValue(document.getElementById("stars").value);

        var strain = sd.strainPicker(strainId);
        document.getElementById("ddl_currency").value = sd.currency[strain['CurrencyAbbreviation']];
        document.getElementById("ddl_unit_of_measure").value = strain['UnitOfMeasure'];
    },
    setStarWidgetValue: function(rating) {
        if(rating > 0) { // In the absence of a rating we get 0
            document.getElementById("rating" + rating).checked = true;
        }
    },
    instantiateNewFormModal: function() {
        var userId = sd.userId();
        
        sd.newModal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['escape'],
            closeLabel: "Close",
        });

        sd.newModal.setContent(sd.newStrainForm(userId));

        sd.newModal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary tingle-btn--pull-left', function() {
            sd.sendStrain('POST', function() {
                sd.newModal.close();
            });
        });

        sd.newModal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function() {
            sd.newModal.close();
        });
    },
    instantiateEditFormModal: function(userId, strainId) {
        sd.editModal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['escape'],
            closeLabel: "Close"
        });

        sd.editModal.setContent(sd.editStrainForm(userId, strainId));

        sd.editModal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary tingle-btn--pull-left', function() {
            sd.sendStrain('PUT', function() {
                sd.editModal.close();
            });
        });

        sd.editModal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function() {
            sd.editModal.close();
        });
    },
    popDeleteModal: function(strainId, strainName) {
        var userId = sd.userId();
        sd.instantiateDeleteModal(userId, strainId, strainName);
        sd.deleteModal.open();
    },
    instantiateDeleteModal: function(userId, strainId, strainName) {
        sd.deleteModal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['escape'],
            closeLabel: "Close",
        });

        sd.deleteModal.setContent(sd.deleteModalContent(strainName));

        sd.deleteModal.addFooterBtn('Delete', 'tingle-btn tingle-btn--primary_delete tingle-btn--pull-left', function() {
            sd.sendDeletion(userId, strainId, function() {
                sd.deleteModal.close();
            });
        });

        sd.deleteModal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default_delete tingle-btn--pull-right', function() {
            sd.deleteModal.close();
        });
    },
    deleteModalContent: function(strainName) {
        return "" +
        "<div class='delete_confirm'>Are you sure you want to delete<br />" + 
        "<span style='font-weight: bold;'>" + strainName + "</span>" +
        "<span>?</span>" +
        "</div>";
    },
    closeDeleteModal: function(submitForm, userId, strainId) {
        if(submitForm) {
            sd.sendDeletion(userId, strainId);
        }
        sd.deleteModal.close();
        sd.deleteModal = null;
    },
    // _callback gets executed when the asynchronous call finishes
    sendDeletion: function(userId, strainId, _callback) {
        var XHR = new XMLHttpRequest();

        XHR.addEventListener('load', function(event) {
            console.log('Yeah! Deletion sent and response loaded');
        });

        XHR.addEventListener('error', function(event) {
            console.log('Oops! Something went wrong with the deletion');
        });

        XHR.open('DELETE', '/strain');

        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        XHR.setRequestHeader('X-user-id', userId);
        XHR.setRequestHeader('X-auth-token', sd.authToken());
        XHR.setRequestHeader('X-ids-for-deletion', strainId);

        XHR.onreadystatechange = function () {
            if(XHR.readyState === 4 && XHR.status === 200) {
                console.log(XHR.responseText);
                _callback();
                sd.viewStrains();
            }
        };

        XHR.send();
    }
};
