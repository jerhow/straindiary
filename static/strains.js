var sd = {
    request: new XMLHttpRequest(),
    resp: null,
    data: null,
    modal: null,
    userId: null,
    viewStrains: function() {
        var url = '/strain?user_id=' + sd.userId + '&sb=1&ob=0';
        sd.request.open('GET', url, true);

        sd.request.onload = function() {
            if (sd.request.status >= 200 && sd.request.status < 400) {
                sd.resp = sd.request.responseText;
                sd.data = JSON.parse(sd.resp);
                sd.buildStrainOutput();
            } else {
                console.log("We reached our target server, but it returned an error: ");
                console.log("Error number: " + sd.request.status);
                console.log("Error msg: " + sd.request.statusText);
            }
        };

        sd.request.onerror = function() {
            // There was a connection error of some sort
        };

        sd.request.send();
    },
    buildStrainOutput: function() {
        var strainDivs = [];
        var idx, strainId, userId, strainName, sativaPct, indicaPct, thcPct, cbdPct;
        var stars, comments, company, dispensary, createdAt, modifiedAt;
        var strainCount = 0;
        for (idx in this.data.StrainData) {
            strainCount++;
        }
        
        for(var idx = 0; idx < strainCount; idx++) {
            strainId = this.data.StrainData[idx]["Id"];
            userId = this.data.StrainData[idx]["UserId"];
            strainName = this.data.StrainData[idx]["StrainName"];
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
            strainDivs.push("" +
                "<div id='strain_" + strainId + " class='strain_div'>" +
                "<div id=\"strain_name_\"" + strainId + " class=\"strain_name_display\">" + strainName + "</div>" +
                sativaPct + " " + indicaPct + " " + thcPct + " " + cbdPct + " " + stars + " " + comments + " " + 
                company + " " + dispensary + " " + createdAt + " " + modifiedAt + "<br />" +
                "</div>"
            );
        }
        
        document.getElementById("strain_container").innerHTML = strainDivs.join("");
        return true;
    },
    sendNewStrain: function(data) {
        var XHR = new XMLHttpRequest();
        var urlEncodedData = "";
        var urlEncodedDataPairs = [];

        var userId = document.getElementById("user_id").value;
        var strain_name = document.getElementById("strain_name").value;
        var stars = document.getElementById("stars").value;
        var sativa_pct = document.getElementById("sativa_pct").value;
        var indica_pct = document.getElementById("indica_pct").value;
        var thc_pct = document.getElementById("thc_pct").value;
        var cbd_pct = document.getElementById("cbd_pct").value;
        var company = document.getElementById("company").value;
        var dispensary = document.getElementById("dispensary").value;
        var comments = document.getElementById("comments").value;

        urlEncodedDataPairs.push(encodeURIComponent("user_id") + '=' + encodeURIComponent(userId));
        urlEncodedDataPairs.push(encodeURIComponent("strain_name") + '=' + encodeURIComponent(strain_name));
        urlEncodedDataPairs.push(encodeURIComponent("stars") + '=' + encodeURIComponent(stars));
        urlEncodedDataPairs.push(encodeURIComponent("sativa_pct") + '=' + encodeURIComponent(sativa_pct));
        urlEncodedDataPairs.push(encodeURIComponent("indica_pct") + '=' + encodeURIComponent(indica_pct));
        urlEncodedDataPairs.push(encodeURIComponent("thc_pct") + '=' + encodeURIComponent(thc_pct));
        urlEncodedDataPairs.push(encodeURIComponent("cbd_pct") + '=' + encodeURIComponent(cbd_pct));
        urlEncodedDataPairs.push(encodeURIComponent("company") + '=' + encodeURIComponent(company));
        urlEncodedDataPairs.push(encodeURIComponent("dispensary") + '=' + encodeURIComponent(dispensary));
        urlEncodedDataPairs.push(encodeURIComponent("comments") + '=' + encodeURIComponent(comments));
  
        // Combine the pairs into a single string and replace all %-encoded spaces to 
        // the '+' character; matches the behaviour of browser form submissions.
        urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');

         // Define what happens on successful data submission
        XHR.addEventListener('load', function(event) {
            console.log('Yeah! Data sent and response loaded.');
        });

        // Define what happens in case of error
        XHR.addEventListener('error', function(event) {
            console.log('Oops! Something goes wrong.');
        });

        // Set up our request
        XHR.open('POST', '/strain');

        // Add the required HTTP header for form data POST requests
        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        XHR.onreadystatechange = function () {
            if(XHR.readyState === 4 && XHR.status === 200) {
                console.log(XHR.responseText);
                sd.viewStrains();
            }
        };

        // Finally, send our data.
        XHR.send(urlEncodedData);
    },
    onStarClick: function(starValue) {
        document.getElementById('stars').value = starValue;
    },
    popNewStrainForm: function() {
        sd.instantiateModal(sd.userId);
        sd.modal.open();
    },
    newStrainForm: function(userId) {
        return "" +
        "<div id='new_strain_form_container'>" +
        "   <div id='new_strain_modal_title'>New Strain</div>" +
        "   <form id='new_strain_form'>" +
        "       <input type='hidden' id='user_id' name='user_id' value='" + userId + "' />" +
        "       <input type='hidden' id='stars' name='user_id' value='" + userId + "' />" +
        "       <div id='con_strain_name'>" +
        "           <label>Name:</label> " +
        "           <input type='text' id='strain_name' name='strain_name' tabindex='100' />" +
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
    instantiateModal: function(userId) {
        this.modal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['escape'],
            closeLabel: "Close",
        });

        sd.modal.setContent(sd.newStrainForm(userId));

        sd.modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary tingle-btn--pull-left', function() {
            sd.closeModal(true);
        });

        sd.modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function() {
            sd.closeModal(false);
        });
    },
    closeModal: function(submitForm) {
        if(submitForm === true) {
            sd.sendNewStrain(); // TODO: fix sendNewStrain() to return status so we can close only on success
        }
        sd.modal.close();
    }
};
