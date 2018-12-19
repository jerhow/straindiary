var sd = {
    request: new XMLHttpRequest(),
    resp: "",
    data: null,
    modal: null,
    viewStrains: function() {
        sd.request.open('GET', '/strain?user_id=2&sb=1&ob=0', true);

        sd.request.onload = function() {
            if (sd.request.status >= 200 && sd.request.status < 400) {
                sd.resp = sd.request.responseText;
                sd.data = JSON.parse(sd.resp);
                sd.buildStrainOutput();
            } else {
                console.log("We reached our target server, but it returned an error")
            }
        };

        sd.request.onerror = function() {
        // There was a connection error of some sort
        };

        sd.request.send();
    },
    buildStrainOutput: function() {
        var strainDivs = [];
        var idx, strainId, userId, strainName, createdAt = null;
        var strainCount = 0;
        for (idx in this.data.StrainData) {
            strainCount++;
        }
        
        for(var idx = 0; idx < strainCount; idx++) {
            strainId = this.data.StrainData[idx]["Id"];
            userId = this.data.StrainData[idx]["UserId"];
            strainName = this.data.StrainData[idx]["StrainName"];
            createdAt = this.data.StrainData[idx]["CreatedAt"];
            strainDivs.push("" +
                "<div id=\"strain_" + strainId + "\" class=\"strain_div\">" +
                "<div id=\"strain_name_\"" + strainId + " class=\"strain_name_display\">" + strainName + "</div>" +
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
        var name;

        var userId = "2";
        var strain_name = document.getElementById("strain_name").value;
        urlEncodedDataPairs.push(encodeURIComponent("user_id") + '=' + encodeURIComponent(userId));
        urlEncodedDataPairs.push(encodeURIComponent("strain_name") + '=' + encodeURIComponent(strain_name));
  
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
    popNewStrainForm: function() {
        sd.modal.open();
    },
    newStrainForm: "" +
        "<div id='new_strain_form_container'>" +
        "   <div id='new_strain_modal_title'>Add a Strain</div>" +
        "   <form id='new_strain_form'>" +
        "       <div id='con_strain_name'>" +
        "           <label>Name:</label> " +
        "           <input type='text' id='strain_name' name='strain_name' />" +
        "       </div>" +
        "       <div id='con_star_rating'>" +
        "           <label>Rating:</label> <span class='starRating'>" +
        "               <input id='rating5' type='radio' name='rating' value='5'>" +
        "               <label for='rating5'>5</label>" +
        "               <input id='rating4' type='radio' name='rating' value='4'>" +
        "               <label for='rating4'>4</label>" +
        "               <input id='rating3' type='radio' name='rating' value='3'>" +
        "               <label for='rating3'>3</label>" +
        "               <input id='rating2' type='radio' name='rating' value='2'>" +
        "               <label for='rating2'>2</label>" +
        "               <input id='rating1' type='radio' name='rating' value='1'>" +
        "               <label for='rating1'>1</label>" +
        "           </span>" +
        "       </div>" +
        "       <div id='con_sativa_pct'>" +
        "           <label>Sativa:</label> <input type='number' id='sativa_pct' name='sativa_pct' /> %" +
        "       </div>" +
        "       <div id='con_indica_pct'>" +
        "           <label>Indica:</label> <input type='number' id='indica_pct' name='indica_pct' /> %" +
        "       </div>" +
        "       <div id='con_thc_pct'>" +
        "           <label>THC:</label> <input type='number' id='thc_pct' name='thc_pct' /> %" +
        "       </div>" +
        "       <div id='con_cbd_pct'>" +
        "           <label>CBD:</label> <input type='number' id='cbd_pct' name='cbd_pct' /> %" +
        "       </div>" +
        "       <div id='con_company'>" +
        "           <label>Company:</label> <input type='text' id='company' name='company' />" +
        "       </div>" +
        "       <div id='con_dispensary'>" +
        "           <label>Dispensary:</label> <input type='text' id='dispensary' name='dispensary' />" +
        "       </div>" +
        "       <div id='con_comments'>" +
        "           <label>Comments:</label> " +
        "           <textarea id='comments' name='comments' rows=4 cols=30></textarea>" +
        "       </div>" +
        "   </form>" +
        "</div>" +
    "",
    instantiateModal: function() {
        this.modal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['overlay', 'button', 'escape'],
            closeLabel: "Close",
        });

        sd.modal.setContent(sd.newStrainForm);

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
