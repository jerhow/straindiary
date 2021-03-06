// String.trim() polyfill
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}

var sd = {
    data: null,
    newModal: null, // new strain
    editModal: null,
    deleteModal: null,
    loginModal: null,
    supportModal: null,
    userSettingsModal: null,
    userSettings: null,
    updateUserSettingsConfDisplayed: false,
    userSettingBeingEdited: null,
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
    unitsOfMeasure: { // for display in the list (a display concern only)
        "gram": "g",
        "eighth": "eighth",
        "quarter": "quarter",
        "half": "half",
        "ounce": "oz",
        "item": "Item"
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
    strainTypeDdl: function() {
        return "" +
            "<select id='ddl_strain_type' name='ddl_strain_type' onchange='sd.strainTypeChange(this);'>" +
            "<option value='Flower' selected>Flower</option>" +
            "<option value='Oil'>Oil</option>" +
            "<option value='Wax'>Wax</option>" +
            "<option value='Edible'>Edible</option>" +
            "<option value='Tincture'>Tincture</option>" +
            "<option value='Other'>Other</option>" +
            "</select>";
    },
    strainTypeChange: function(obj) {
        if(obj.options[obj.selectedIndex].value === "Flower") {
            document.getElementById('ddl_unit_of_measure').value = 'eighth';
        } else {
            document.getElementById('ddl_unit_of_measure').value = 'item';
        }
    },
    unitOfMeasureDdl: function() {
        return(
        "<select id='ddl_unit_of_measure' name='ddl_unit_of_measure'>" +
        "   <option value='gram'>Gram</option>" +
        "   <option value='eighth' selected>Eighth</option>" +
        "   <option value='quarter'>Quarter</option>" +
        "   <option value='half'>Half</option>" +
        "   <option value='ounce'>Ounce</option>" +
        "   <option value='item'>Item</option>" +
        "</select>");
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
            document.getElementById("strains_page_login_msg").style.display = 'none';
            document.getElementById('con_user').style.display = 'inline';
            document.getElementById('con_logout').style.display = 'inline';
            document.getElementById('con_masthead').style.width = '60%';
            document.getElementById('fixed_footer').style.display = 'inline';
        } else {
            document.getElementById('strains_page_login_msg').style.display = 'block';
            document.getElementById('con_user').style.display = 'none';
            document.getElementById('con_logout').style.display = 'none';
            document.getElementById('con_masthead').style.width = '100%';
            document.getElementById('fixed_footer').style.display = 'none';
            // sd.popLoginForm();
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
                    // document.getElementById('nickname').innerHTML = docCookies.getItem('nickname') || '';
                    document.getElementById('user_icon').title = docCookies.getItem('nickname') || '';
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
            sortBy = docCookies.getItem('sort') || "1";
        }
        if(!orderBy) {
            orderBy = docCookies.getItem('order') || "0";
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
        var idx, strainId, userId, strainName, strainType, stars, currency, price, unitOfMeasure;
        var sativaPct, indicaPct, thcPct, cbdPct, comments, company, dispensary, createdAt, modifiedAt;
        var strainCount = Object.keys(this.data.StrainData).length;
        var dispensaryRow, companyRow, priceRow;
        var commentsRow, commentsRowUpper, commentsRowLower;
        
        for(idx = 0; idx < strainCount; idx++) {
            strainId = this.data.StrainData[idx]["Id"];
            userId = this.data.StrainData[idx]["UserId"];
            strainName = this.data.StrainData[idx]["StrainName"];
            strainType = this.data.StrainData[idx]["StrainType"];
            price = this.data.StrainData[idx]["Price"];
            currency = sd.currency[this.data.StrainData[idx]["CurrencyAbbreviation"]].split(',')[1];
            unitOfMeasure = sd.unitsOfMeasure[this.data.StrainData[idx]["UnitOfMeasure"]];
            sativaPct = this.data.StrainData[idx]["SativaPct"];
            indicaPct = this.data.StrainData[idx]["IndicaPct"];
            thcPct = this.data.StrainData[idx]["ThcPct"];
            cbdPct = this.data.StrainData[idx]["CbdPct"];
            stars = this.data.StrainData[idx]["Stars"];
            comments = this.data.StrainData[idx]["Comments"].replace(/\r\n|\r|\n/g, '<br />');
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
                "       <div id='strain_type_" + strainId + "' class='strain_type_display'>" + strainType + "</div> " +
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
            var starOn = "<img src='" + sd.staticPath + "star-rating-widget/star-on.svg' class='star_for_list'>";
            var starOff = "<img src='" + sd.staticPath + "star-rating-widget/star-off.svg' class='star_for_list'>";
            return starOn.repeat(rating) + starOff.repeat(5 - rating);
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
        var strain_type = document.getElementById("ddl_strain_type").value;
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
        urlEncodedDataPairs.push(encodeURIComponent("strain_type") + '=' + encodeURIComponent(strain_type));
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
        document.getElementById("sort_icon").style.display = "none";
        document.getElementById("sort_label").style.display = "none";
        document.getElementById("ddl_sort").style.display = "inline-block";
    },
    sortChange: function(obj) {
        var vals = obj.value.split(',');
        sd.viewStrains(vals[0], vals[1]); // (sortBy, orderBy)
        docCookies.setItem('sort', vals[0], (sd.oneDayInSeconds * sd.sessionFactor));
        docCookies.setItem('order', vals[1], (sd.oneDayInSeconds * sd.sessionFactor));
        document.getElementById("ddl_sort").style.display = "none";
        document.getElementById("sort_icon").style.display = "inline";
        document.getElementById("sort_label").style.display = "inline-block";
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
        "       <div id='con_strain_type'>" +
        "           <div id='strain_type_label'>Type: </div>" +
                    sd.strainTypeDdl() +
        "       </div>" +
        "       <div id='con_price'>" +
        "           <label id='price_label'>Price:</label> <span id='currency_symbol'>$</span>" +
        "           <input type='number' step='.01' id='price' name='price' tabindex='90' maxlength='6' />" +
        "       </div>" +
        "       <div id='con_currency'>" +
                    sd.currencyDdl() +
        "       </div>" +
        "       <div id='con_unit_of_measure'>" +
        "           <label id='unit_of_measure_label' for='unit_of_measure'>/</label> " +
                    sd.unitOfMeasureDdl() +
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
        "           <div id='strain_name_msg'></div>" +
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
        "       <div id='con_strain_type'>" +
        "           <div id='strain_type_label'>Type: </div>" +
                    sd.strainTypeDdl() +
        "       </div>" +
        "       <div id='con_price'>" +
        "           <label id='price_label'>Price:</label> <span id='currency_symbol'>$</span>" +
        "           <input type='number' step='.01' id='price' name='price' tabindex='90' maxlength='6' value='" + vals['Price'] + "' />" +
        "       </div>" +
        "       <div id='con_currency'>" +
                    sd.currencyDdl() +
        "       </div>" +
        "       <div id='con_unit_of_measure'>" +
        "           <label id='unit_of_measure_label' for='unit_of_measure'>/</label> " +
                    sd.unitOfMeasureDdl() +
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
        document.getElementById("ddl_strain_type").value = strain['StrainType'];
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
    },
    popSupportModal: function() {
        sd.instantiateSupportModal(sd.userId());
        sd.supportModal.open();
        // document.getElementById('img_paypal01').src = 'http://192.168.1.153:8080/paypal01.png';
    },
    instantiateSupportModal: function(userId) {
        sd.supportModal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['escape'],
            closeLabel: "Close",
            cssClass: ['support_msg'],
        });

        sd.supportModal.setContent(sd.supportModalContent());

        sd.supportModal.addFooterBtn('Close', 'tingle-btn tingle-btn--default_delete tingle-btn--pull-right', function() {
            sd.supportModal.close();
        });
    },
    supportModalContent: function(strainName) {
        return "" +
        "<div class='support_msg'>" + 
        "Thank you for using Strain Diary! <br /><br />" +
        "This web app is free for all to use. If you get value from it, I would appreciate your support " +
        "to help cover the cost of running and maintaining it. Any amount is appreciated. <br /><br />" +
        "Thanks again, and keep it lit. <br /><br />" +
        "Peace, <br />" +
        "Jerry" +
        "</div>" +
        "<div class='tingle-content-wrapper'>" +
        "<img src='" + sd.staticPath + "paypal01.png' />" +
        "</div>";
    },

// === USER SETTINGS =========================================================================
    popUserSettingsModal: function() {
        var userId = sd.userId();
        var authToken = sd.authToken();
        sd.fetchUserSettings(userId, authToken, function() {
            sd.instantiateUserSettingsModal();
            sd.userSettingsModal.open();
        });
    },
    instantiateUserSettingsModal: function() {
        sd.userSettingsModal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['escape'],
            closeLabel: "Close",
        });

        sd.userSettingsModal.setContent(sd.userSettingsModalContent());

        sd.userSettingsModal.addFooterBtn('Commit changes', 'tingle-btn tingle-btn--primary tingle-btn--pull-left', function() {
            sd.closeUserSettingsModal(true, function(status, msg) {
                if(status !== 200) {
                    sd.userSettingsMsg(msg);
                    sd.updateUserSettingsConfDisplayed = false; // reset
                    
                    document.getElementById('txt_password_current').readOnly = false;
                    document.getElementById('txt_password_new').readOnly = false;
                    document.getElementById('txt_password_new_conf').readOnly = false;
                } else {
                    sd.userSettingsMsg(msg + ' One moment please...', 'green');
                    document.querySelectorAll('.tingle-btn--primary')[0].disabled = true;
                    window.setTimeout(function() {
                            sd.userSettingsModal.close();
                            sd.userSettingsModal = null; // reset
                            sd.updateUserSettingsConfDisplayed = false; // reset
                            if(sd.userSettingBeingEdited === 'password') {
                                sd.logout();
                            }
                            sd.userSettingBeingEdited = null; // reset
                        }, 3000
                    );
                }
                // console.log("Commit _callback() called");
            });
        });

        sd.userSettingsModal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default_delete tingle-btn--pull-right', function() {
            sd.closeUserSettingsModal(false, function() {
                sd.userSettingsModal.close();
                sd.userSettingsModal = null; // reset
                sd.updateUserSettingsConfDisplayed = false; // reset
                sd.userSettingBeingEdited = null; // reset
            });
        });
    },
    userSettingsModalContent: function(userSettings) {
        var un = sd.userSettings['UserSettings']['Un'];
        var createdAt = sd.userSettings['UserSettings']['CreatedAt'];
        var nickname = sd.userSettings['UserSettings']['Nickname'];

        return "" +
        "<div id='con_user_settings'>" +
        "   <div id='user_settings_heading_row'>" +
        "       Settings" +
        "   </div>" +
        "   <div class='user_settings_row'>" +
        "       <div id='con_since'>" +
        "           Account created on " + createdAt.split(" ")[0] +
        "       </div>" +
        "   </div>" +
        "   <div class='user_settings_row' id='email_row'>" +
        "       <div id='con_lbl_email'>" +
        "           <label id='lbl_email' for='txt_email'>Email:</label>" +
        "       </div>" +
        "       <div id='con_txt_email'>" +
        "           <button id='btn_update_email' onclick='sd.openEdit(\"email\");'>Update</button>" +
        "           <span id='display_email'>" + un + "</span>" +
        "           <input type='text' id='txt_email' name='txt_email' value='" + un + "' />" +
        "           <input type='image' id='close_edit_email' src='" + sd.staticPath + "x-50x50-trans.png' onclick='sd.closeEdit(\"email\");' />" +
        "       </div>" +
        "   </div>" +
        "   <div class='user_settings_row' id='nickname_row'>" +
        "       <div id='con_lbl_nickname'>" +
        "           <label id='lbl_nickname' for='txt_nickname'>Nickname:</label>" +
        "       </div>" +
        "       <div id='con_txt_nickname'>" +
        "           <button id='btn_update_nickname' onclick='sd.openEdit(\"nickname\");'>Update</button>" +
        "           <span id='display_nickname'>" + nickname + "</span>" +
        "           <input type='text' id='txt_nickname' name='txt_nickname' value='" + nickname + "' />" +
        "           <input type='image' id='close_edit_nickname' src='" + sd.staticPath + "x-50x50-trans.png' onclick='sd.closeEdit(\"nickname\");' />" +
        "       </div>" +
        "   </div>" +
        "   <div id='update_password_button_row'>" +
        "       <div id='con_password_heading'>" +
        "           <button id='btn_update_password' onclick='sd.openEdit(\"password\")'>Change password</button>" +
        "           <input type='image' id='close_edit_password' src='" + sd.staticPath + "x-50x50-trans.png' onclick='sd.closeEdit(\"password\");' />" +
        "       </div>" +
        "   </div>" +
        "   <div class='user_settings_row' id='password_row_1'>" +
        "       <div id='con_lbl_password_current'>" +
        "           <label id='lbl_password_current' for='txt_password_current'>Current password:</label>" +
        "       </div>" +
        "       <div id='con_txt_password_current'>" +
        "           <input type='password' id='txt_password_current' name='txt_password_current' value='' />" +
        "       </div>" +
        "   </div>" +
        "   <div class='user_settings_row' style='margin-top: 20px;' id='password_row_2'>" +
        "       <div id='con_lbl_password_new'>" +
        "           <label id='lbl_password_new' for='txt_password_new'>New password:</label>" +
        "       </div>" +
        "       <div id='con_txt_password_new'>" +
        "           <input type='password' id='txt_password_new' name='txt_password_new' value='' />" +
        "       </div>" +
        "   </div>" +
        "   <div class='user_settings_row' id='password_row_3'>" +
        "       <div id='con_lbl_password_new_conf'>" +
        "           <label id='lbl_password_new_conf' for='txt_password_new_conf'>Confirm new password:</label>" +
        "       </div>" +
        "       <div id='con_txt_password_new_conf'>" +
        "           <input type='password' id='txt_password_new_conf' name='txt_password_new_conf' value='' />" +
        "       </div>" +
        "   </div>" +
        "   <div class='user_settings_row'>" +
        "       <div id='user_settings_msg'>&nbsp;</div>" +
        "   </div>" +
        "</div>";
    },
    // TODO: Build out these rules
    passwordValidate: function(field, pwd) {
        var valid, msg;

        if(pwd.length === 0) {
            valid = false;
            msg = field + " password left blank";
        } else if(pwd.length < 4) {
            valid = false;
            msg = field + " password needs to be at least 4 characters";
        } else {
            valid = true;
            msg = "";
        }

        return {valid: valid, msg: msg};
    },
    closeUserSettingsModal: function(submitForm, _callback) {
        var d = document;
        var existingVal, newVal;

        if(submitForm) {
            if(!sd.updateUserSettingsConfDisplayed) {

                if(!sd.userSettingBeingEdited) {
                    sd.userSettingsMsg("You haven't changed anything", 'red', 3);
                    return false;
                }

                // email
                if(sd.userSettingBeingEdited === 'email') {
                    existingVal = sd.userSettings['UserSettings']['Un'];
                    newVal = d.getElementById("txt_email").value.trim();
                    if(existingVal === newVal) {
                        sd.userSettingsMsg("You haven't changed anything", 'red', 3);
                        return false;
                    } else {
                        // Validate for availability
                        sd.checkAvailability('email', newVal, function(available, msg) {
                            sd.checkAvailabilityReturned = true;
                            document.querySelectorAll('.tingle-btn--primary')[0].disabled = false; // re-enable the submit button
                            if(!available) {
                                sd.userSettingsMsg(msg);
                            } else {
                                sd.userSettingsMsg("Are you sure you want to change your email address? " +
                                    "You will need to sign in again. " +
                                    "We will send a confirmation to the original address.");
                                d.getElementById('txt_email').readOnly = true;
                                d.querySelectorAll('.tingle-btn--primary')[0].innerHTML = 'Confirm update';
                                sd.updateUserSettingsConfDisplayed = true;
                            }
                        });   
                    }

                // nickname
                } else if(sd.userSettingBeingEdited === 'nickname') {
                    existingVal = sd.userSettings['UserSettings']['Nickname'];
                    newVal = d.getElementById("txt_nickname").value.trim();
                    if(existingVal === newVal) {
                        sd.userSettingsMsg("You haven't changed anything", 'red', 3);
                        return false;
                    } else {
                        
                        // Validate for availability
                        sd.checkAvailability('nickname', newVal, function(available, msg) {
                            sd.checkAvailabilityReturned = true;
                            document.querySelectorAll('.tingle-btn--primary')[0].disabled = false;
                            if(!available) {
                                sd.userSettingsMsg(msg);
                            } else {
                                sd.userSettingsMsg("Are you sure you want to change your nickname?");
                                d.getElementById('txt_nickname').readOnly = true;
                                d.querySelectorAll('.tingle-btn--primary')[0].innerHTML = 'Confirm update';
                                sd.updateUserSettingsConfDisplayed = true;
                            }
                        });
                    }
                    
                // password
                } else if(sd.userSettingBeingEdited === 'password') {
                    
                    var existingPwd = d.getElementById("txt_password_current").value.trim();
                    var newPwd = d.getElementById("txt_password_new").value.trim();
                    var newPwdConf = d.getElementById("txt_password_new_conf").value.trim();

                    var validation = sd.passwordValidate('Current', existingPwd);
                    if(!validation.valid) {
                        sd.userSettingsMsg(validation.msg);
                        return false;
                    }

                    if(newPwd !== newPwdConf) {
                        sd.userSettingsMsg("New passwords don't match");
                        return false;
                    }

                    sd.userSettingsMsg("Are you sure you want to change your email address? " +
                        "(You will need to sign in again)");
                    d.getElementById('txt_password_current').readOnly = true;
                    d.getElementById('txt_password_new').readOnly = true;
                    d.getElementById('txt_password_new_conf').readOnly = true;
                    d.querySelectorAll('.tingle-btn--primary')[0].innerHTML = 'Confirm update';
                    sd.updateUserSettingsConfDisplayed = true;


                }  
            } else {
                sd.sendUserSettings(sd.userSettingBeingEdited, _callback);
            }
        } else {
            _callback(); // 'Cancel' clicked
        }
    },
    sendUserSettings: function(field, _callback) {
        var XHR = new XMLHttpRequest();
        var urlEncodedData = "";
        var urlEncodedDataPairs = [];
        var url;

        if(field === 'email') {
            var existingEmail = sd.userSettings['UserSettings']['Un'];
            var newEmail = document.getElementById("txt_email").value.trim();
            urlEncodedDataPairs.push(encodeURIComponent("prev_email") + '=' + encodeURIComponent(existingEmail));
            urlEncodedDataPairs.push(encodeURIComponent("new_email") + '=' + encodeURIComponent(newEmail));
            url = '/user/email';
        } else if(field === 'nickname') {
            var newNickname = document.getElementById("txt_nickname").value;
            urlEncodedDataPairs.push(encodeURIComponent("new_nickname") + '=' + encodeURIComponent(newNickname));
            url = '/user/nickname';
        } else if(field === 'password') {
            // var existingPwd = d.getElementById("txt_password_current").value.trim();
            // var newPwd = d.getElementById("txt_password_new").value.trim();
            // var newPwdConf = d.getElementById("txt_password_new_conf").value.trim();
            var existingPwd = document.getElementById("txt_password_current").value.trim();
            var newPwd = document.getElementById("txt_password_new").value.trim();
            var newPwdConf = document.getElementById("txt_password_new_conf").value.trim();
            urlEncodedDataPairs.push(encodeURIComponent("password_current") + '=' + encodeURIComponent(existingPwd));
            urlEncodedDataPairs.push(encodeURIComponent("password_new") + '=' + encodeURIComponent(newPwd));
            urlEncodedDataPairs.push(encodeURIComponent("password_new_conf") + '=' + encodeURIComponent(newPwdConf));
            url = '/user/pwd';
        } else {
            // TBD
        }

        urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
        XHR.open('PUT', url);
        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        XHR.setRequestHeader('X-user-id', sd.userId());
        XHR.setRequestHeader('X-auth-token', sd.authToken());

        XHR.onreadystatechange = function() {
            if(XHR.readyState === sd.readyState["DONE"]) {
                _callback(XHR.status, JSON.parse(XHR.responseText)['Msg']);
                if(XHR.status === 200) { // success
                    // _callback(XHR.status, JSON.parse(XHR.responseText)['Msg']);
                } else if(XHR.status === 400) { // a handled error state
                    // document.getElementById('strain_name_msg').style.display = 'inline-block';
                    // document.getElementById('strain_name_msg').innerHTML = JSON.parse(XHR.responseText)['Msg'];
                } else { // TODO: Unhandled error states
                    // console.log('ERROR: Something went wrong in sd.sendStrain(). ' +
                    //     'We got an undesirable response code back: ' + XHR.status);
                    // console.log(XHR.responseText);
                }
            }
        };

        XHR.send(urlEncodedData);
    },
    openEdit: function(field) {
        var d = document;

        sd.userSettingBeingEdited = field;
        d.getElementById('user_settings_msg').innerHTML = '&nbsp;'; // just in case
        d.querySelectorAll('.tingle-btn--primary')[0].innerHTML = 'Commit changes';

        // This one always exists
        d.getElementById('btn_update_' + field).style.display = 'none';
        
        if(d.getElementById('display_' + field)) {
            d.getElementById('display_' + field).style.display = 'none';
        }
        if(d.getElementById('txt_' + field)) {
            d.getElementById('txt_' + field).style.display = 'inline';
        }
        if(d.getElementById('close_edit_' + field)) {
            d.getElementById('close_edit_' + field).style.display = 'inline';
        }
        
        if(field === 'email') {
            sd.disableButton('btn_update_nickname');
            sd.disableButton('btn_update_password');
            d.getElementById('txt_email').readOnly = false; // just in case
        } else if(field === 'nickname') {
            sd.disableButton('btn_update_email');
            sd.disableButton('btn_update_password');
            d.getElementById('txt_email').readOnly = false;
        } else if(field === 'password') {
            sd.disableButton('btn_update_email');
            sd.disableButton('btn_update_nickname');
            d.getElementById('close_edit_password').style.display = 'inline';
            d.getElementById('password_row_1').style.display = 'inline-grid';
            d.getElementById('password_row_2').style.display = 'inline-grid';
            d.getElementById('password_row_3').style.display = 'inline-grid';
        }
    },
    closeEdit: function(field) {
        var d = document;

        sd.userSettingBeingEdited = null;
        d.getElementById('user_settings_msg').innerHTML = '&nbsp;';
        d.querySelectorAll('.tingle-btn--primary')[0].innerHTML = 'Commit changes';

        // This one always exists
        d.getElementById('btn_update_' + field).style.display = 'inline';
        
        if(d.getElementById('display_' + field)) {
            d.getElementById('display_' + field).style.display = 'inline';
        }
        if(d.getElementById('txt_' + field)) {
            d.getElementById('txt_' + field).style.display = 'none';
        }
        if(d.getElementById('close_edit_' + field)) {
            d.getElementById('close_edit_' + field).style.display = 'none';
        }
        if(field === 'email') {
            d.getElementById('txt_email').readOnly = false;
            d.getElementById('txt_email').value = sd.userSettings['UserSettings']['Un'];
            sd.enableButton('btn_update_nickname');
            sd.enableButton('btn_update_password');
        } else if(field === 'nickname') {
            d.getElementById('txt_nickname').readOnly = false;
            d.getElementById('txt_nickname').value = sd.userSettings['UserSettings']['Nickname'];
            sd.enableButton('btn_update_email');
            sd.enableButton('btn_update_password');
        } else if(field === 'password') {
            sd.enableButton('btn_update_email');
            sd.enableButton('btn_update_nickname');
            d.getElementById('close_edit_password').style.display = 'none';
            d.getElementById('password_row_1').style.display = 'none';
            d.getElementById('password_row_2').style.display = 'none';
            d.getElementById('password_row_3').style.display = 'none';
        }

        if(sd.updateUserSettingsConfDisplayed) {
            d.getElementById('user_settings_msg').innerHTML = '&nbsp;';
            sd.updateUserSettingsConfDisplayed = false;
        }
    },
    disableButton: function(id) {
        var btn = document.getElementById(id);
        btn.disabled = true;
        btn.style.backgroundColor = '#bfbfbf';
    },
    enableButton: function(id) {
        var btn = document.getElementById(id);
        btn.disabled = false;
        btn.style.backgroundColor = '#57ab57';
    },
    userSettingsMsg: function(msg, color, timeoutInSeconds) {
        color = color || 'red';
        document.getElementById('user_settings_msg').style.color = color;
        document.getElementById('user_settings_msg').innerHTML = msg;
        if(timeoutInSeconds > 0) {
            window.setTimeout(function() {
                    document.getElementById('user_settings_msg').innerHTML = '&nbsp;';
                }, (timeoutInSeconds * 1000) // to get milliseconds
            );
        }
    },
    fetchUserSettings: function(userId, authToken, _callback) {
        var url = '/user';
        var XHR = new XMLHttpRequest();

        XHR.addEventListener('load', function(event) {
            // console.log('GET /user request sent and response loaded');
        });

        XHR.addEventListener('error', function(event) {
            console.log('ERROR: Something went wrong in sd.fetchUserSettings()');
        });

        XHR.open('GET', url, true);
        XHR.setRequestHeader('X-user-id', userId);
        XHR.setRequestHeader('X-auth-token', authToken);

        XHR.onreadystatechange = function() {
            if(XHR.readyState === sd.readyState["DONE"]) {
                if(XHR.status === 200) { // success
                    // sd.userSettings = JSON.parse(XHR.responseText);
                } else if(XHR.status === 400) { // a handled error state
                    console.log("ERROR in fetchUserSettings(): HTTP 400 Bad Request");
                    console.log("Error number: " + XHR.status);
                    console.log("Error msg: " + XHR.statusText);
                } else if(XHR.status === 400) { // a handled error state
                    // 401 Unauthorized, meaning the backend rejected us based on session
                    console.log("ERROR in fetchUserSettings(): HTTP 401 Unauthorized");
                    console.log("Error number: " + XHR.status);
                    console.log("Error msg: " + XHR.statusText);
                } else { // TODO: Unhandled error states
                    console.log('ERROR: Something went wrong in sd.sendStrain(). ' +
                        'We got an undesirable response code back: ' + XHR.status);
                    console.log(XHR.responseText);
                }
                
                sd.userSettings = JSON.parse(XHR.responseText);
                _callback();
            }
        };

        XHR.send();
    },
    checkAvailability: function(field, val, _callback) {
        var headerName, response, msg;
        var available = false;

        // disable the submit button - it must be re-enabled in the callback
        document.querySelectorAll('.tingle-btn--primary')[0].disabled = true;

        if(field === 'email') {
            headerName = 'X-email';
        } else if(field === 'nickname') {
            headerName = 'X-nickname';
        } else {
            return false;
        }

        var XHR = new XMLHttpRequest();

        XHR.addEventListener('error', function(event) {
            console.log('ERROR: Something went wrong in sd.checkAvailability()');
        });

        XHR.open('GET', '/service/available/' + field, true);
        XHR.setRequestHeader('X-user-id', sd.userId());
        XHR.setRequestHeader('X-auth-token', sd.authToken());
        XHR.setRequestHeader(headerName, val);

        XHR.onreadystatechange = function() {
            if(XHR.readyState === sd.readyState["DONE"]) {
                response = JSON.parse(XHR.responseText);
                if(XHR.status === 200) { // the value is available
                    available = true;
                    msg = response['Msg'];
                    // console.log(response['Msg']);
                    // console.log(XHR.responseText);
                } else if(XHR.status === 412) { // the value is not available
                    available = false;
                    msg = response['Msg'];
                    // console.log(response['Msg']);
                    // console.log(XHR.responseText);
                } else if(XHR.status === 400) { // a handled error state
                    // 401 Unauthorized, meaning the backend rejected us based on session
                    console.log("ERROR in sd.checkAvailability(): HTTP 401 Unauthorized");
                    console.log("Error number: " + XHR.status);
                    console.log("Error msg: " + XHR.statusText);
                } else { // TODO: Unhandled error states
                    console.log('ERROR: Something went wrong in sd.checkAvailability(). ' +
                        'We got an undesirable response code back: ' + XHR.status);
                    console.log(XHR.responseText);
                }
                
                _callback(available, msg);
            }
        };

        XHR.send();
    }
};
