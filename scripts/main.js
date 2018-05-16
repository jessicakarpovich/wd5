window.addEventListener("load", function() {
    // create controller
    let controller = new Controller();
});

class Controller {
    constructor() {
        console.log("Controller created.");
        this.model = new Model();
        this.view = new View();
        
        // array and index to keep track of what kanji user is viewing
        this.kanjiArray = [];
        this.index = 0;
        
        /*** add event listeners for custom events here ***/
        /*** don't add them on page load or their # will increase on each reload ***/
        // you can only add element listeners after the view has added them
        document.addEventListener("page-loaded", this.addListeners.bind(this));
        /*** listeners for overview page View btn results ***/
        document.addEventListener("show-overview", this.saveArrayGetDetails.bind(this));
        
    }
    addListeners() {
        // if there are view buttons (user is on overview page) add listeners to view buttons
        if (document.querySelector(".grade-view")) {
            let viewBtns = document.querySelectorAll(".grade-view");
            for (let i=0; i < viewBtns.length; i++) {
                viewBtns[i].addEventListener("click", this.model.getKanjiByLevel);
            }
        }
        // if on overview page the close button is clicked
        if (document.querySelector(".view-kanji")) {
            // add listener to close btn; hide kanji results show grade levels
            let closeBtn = document.querySelector(".close-btn");
            closeBtn.addEventListener("click", function() {
                let gradeCont = document.querySelector(".kanji-grades");
                gradeCont.style.display = "flex";
                let infoCont = document.querySelector(".kanji-info");
                infoCont.style.display = "none";
            });
            
            // add listener to back button
            let backBtn = document.querySelector(".back-btn");
            backBtn.addEventListener("click", this.showPreviousKanji.bind(this));
            // add listener to next button
            let nextBtn = document.querySelector(".next-btn");
            nextBtn.addEventListener("click", this.showNextKanji.bind(this));
        }
        // if page has review form
        if (document.querySelector(".review-form")) {
            let form = document.querySelector(".review-form");
            let level = document.querySelector("#level");
            let num = document.querySelector("#num");
            form.addEventListener("submit", function(e) {
                e.preventDefault();
                // Create new event and pass it the user input
                let evt = new Event("get-level");
                evt.id = level.value;
                document.dispatchEvent(evt);
            })
        }
        
        // if page has search form, add listener
        if (document.querySelector(".kanji-search")) {
            let form = document.querySelector(".kanji-search");
            let input = document.querySelector("#kanji");
            form.addEventListener("submit", function(e) {
                e.preventDefault();     // stop page from reloading, form submitting
                // Create new event and pass it the user input
                let evt = new Event("get-search-results");
                evt.userValue = input.value;
                document.dispatchEvent(evt);
            }, false);
        }
    }
    getKanji() {
        // create custom event and pass the kanji to get details for (to Model)
        let query = this.kanjiArray[this.index].kanji.character;
        let evt = new Event("get-search-results");
        evt.userValue = query;
        document.dispatchEvent(evt);
    }
    // function to save kanji array when it is first aquired loaded, then show first kanji
    saveArrayGetDetails(e) {
        // save array and reset index
        this.kanjiArray = e.kanjiArray;
        this.index = 0;
        
        if (document.querySelector(".active").classList.contains("js-game-link")) {
            console.log(this.kanjiArray);
        } else {
            // get the first kanji in array
            this.getKanji();
        }
    }
    // display the previous kanji in the overview page
    showPreviousKanji(e) {
        // if moving back from last kanji in array, change styling of next button
        if (this.index === this.kanjiArray.length - 1) {
            document.querySelector(".next-btn").classList.remove("disabled");
        }
        // if you are going back to first kanji in array, change styling of back btn
        if (this.index === 1) {     
            e.target.classList.add("disabled");
        }
        // if currently not viewing the first kanji in array, subtract index and go back one
        if (this.index > 0) {
            this.index--;
            
            this.getKanji();
        }
    }
    // display the next kanji in the overview page
    showNextKanji(e) {
        // if going forward from first kanji, change styling of back btn
        if (this.index === 0) {
            document.querySelector(".back-btn").classList.remove("disabled");
        }
        // if about to show the last kanji, change styling of next btn
        if (this.index === (this.kanjiArray.length-2)) {
            e.target.classList.add("disabled");
        }
        // if currently not viewing the last kanji, add to index and show the next one
        if (this.index < (this.kanjiArray.length - 1)) {
            this.index++;
            this.getKanji();
        }
    }
}


class Model {
    constructor() {
        console.log("Model created");
        
        // add event listeners
        this.addListeners();
        
        /*** Variables to be used across fetch requests ***/
        // Key from mashape 
        this.key = "JDlJP9InDzmshwRyiMytBPVcr73Dp1xoF0ijsnG0tdmZvVhwNB";
        // Custom headers, needed if not using node and their custom library
        this.myHeaders = new Headers();
        // pass the key, do it as on mashape
        this.myHeaders.append("X-Mashape-Key", "JDlJP9InDzmshwRyiMytBPVcr73Dp1xoF0ijsnG0tdmZvVhwNB");
        this.myHeaders.append("Accept", "application/json");
        // use myInit as in fetch documentation on MDN
        this.myInit = { headers: this.myHeaders };
        this.url = "";
    }
    addListeners() {
        // listener to use fetch to get search results if input is valid (shows kanji details)
        document.addEventListener("get-search-results", this.getKanjiSearchResult.bind(this));
        document.addEventListener("get-level", this.getKanjiByLevel.bind(this));
    }
    // function to get array of kanji based on grade level
    getKanjiByLevel(e) {
        const api_endpoint = "https://kanjialive-api.p.mashape.com/api/public/search/advanced/?grade=";
        if (e.target.id) {
            // get grade level based on view button id value
            this.url = api_endpoint +  e.target.id;
        } else {
            this.url = api_endpoint +  e.id;
        }
        
        // use different headers object for this one, its super picky
        let header = new Headers();
        // pass the key, do it as on mashape
        header.append("X-Mashape-Key", 
                              "JDlJP9InDzmshwRyiMytBPVcr73Dp1xoF0ijsnG0tdmZvVhwNB");
        let init = { headers: header };
        
        //Build request object and pass it to fetch
        const request = new Request(this.url, init);
        
        fetch(request) 
                .then(response => response.json())
                .then(results => {
                    let event  = new Event("show-overview");   // create new event, add results
                    event.kanjiArray = results;
                    document.dispatchEvent(event);
            })
                .catch(function(error) {
                    console.log(error);
            });
    }
    
    getKanjiSearchResult(e) {
        // if the user didn't leave the search field blank, continue
        if (e.userValue.trim() !== "") {
            // build the url
            const api_endpoint = "https://kanjialive-api.p.mashape.com/api/public/kanji/";
            this.url = api_endpoint + e.userValue.trim();
            
            //Build request object and pass it to fetch
            const request = new Request(this.url, this.myInit);
            
            fetch(request) 
                .then(response => response.json())
                .then(results => {
                    let event  = new Event("search-results");   // create new event, add results
                
                    if (results.error) {    // if there is an error give it
                        event.message = "No kanji of " + e.userValue + " in database.";
                    }
                    else if (results.kanji) {   // if there is kanji give it
                        event.kanji = results.kanji.character;
                        event.kunyomi = results.kanji.kunyomi.hiragana;
                        event.onyomi = results.kanji.onyomi.katakana;
                        event.meaning = results.kanji.meaning.english;
                        event.grade = results.references.grade;
                    }
                    document.dispatchEvent(event);
            })
                .catch(function(error) {
                    console.log(error);
            });
        }
    }
}

class View {
    constructor() {
        console.log("View created.");
        
        // add event listeners
        this.addListeners();
        
        // display home page by default
        let evt = new Event("display");
        evt.classes = document.querySelector(".active").className;
        document.dispatchEvent(evt);
    }
    addListeners() {
        let menu = document.querySelector(".js-menu");
        menu.addEventListener("click", function() {
            document.querySelector(".sidebar").classList.toggle("hidden");
        });
        
        /*** listener to display correct page ***/
        document.addEventListener("display", this.displayPage.bind(this));
        
        /*** this is to change active class for sidebar links ***/
        let links = document.querySelectorAll(".link");
        // go through each link, add a click event listener
        for (let i=0; i < links.length; i++) {
            links[i].addEventListener("click", function(e) {
                // remove active class from current link and add it to the one that was clicked
                document.querySelector(".active").classList.remove("active");
                this.classList.add("active");
                let evt = new Event("display");     // call display function to show new page
                evt.classes = e.target.className;
                document.dispatchEvent(evt);
            });
        }
        
        /*** listeners for kanji search results ***/
        document.addEventListener("search-results", this.displaySearchResults);
    }
    /*** function to display the correct page based on the link ***/
    displayPage(link) {
        // clear contents
        let mainCont = document.querySelector(".js-view");
        mainCont.innerHTML = "";
        let content = "";
        
        // if user is on the home page, show it
        if (link.classes.includes("home")) {
            content = "<h2>High Scores</h2>";
            content += "<p>Will be completed later.</p>";
            content += "<p>Ignore the icon placeholders; they'll be replaced with FontAwesome icons.</p>";
            content += "<p>Note: Currently the menu icon does not work.</p>";
            content += "<p>Check out the other links like Kanji Overview and Kanji Search.</p>";
            
            mainCont.innerHTML = content;
            // create new event so controller will know to add any necessary listeners
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
        // if user is on the overview page, show it
        else if (link.classes.includes("review")) {
            content = "<h2>Kanji Overview</h2>";
            content += "<aricle class='kanji-grades'>";
            // for each kanji level (1-6) add a button and title
            for (let i=0; i < 6; i++) {
                content += "<div><h3>Kanji Grade Level " + (i+1) + "</h3>";
                content += "<button class='grade-view' id='" + (i+1) + "'>View</button></div>";
            }
            content += "</aricle>";
            content += "<artice class='kanji-info'></article>";
            
            mainCont.innerHTML = content;
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
        else if (link.classes.includes("game")) {
            content = "<h2>Review Game</h2>";
            content += "<form class='review-form'>";
            content += "<p>Enter the kanji grade level to review and how many questions you want. Once the game starts, you'll be given questions with a random kanji from that grade level and asked to enter the English meaning.</p>";
            content += "<div>";
            content += "<label for='level'>Kanji Grade Level</label>";
            content += "<input type='number' step='1' name='level' id='level' min='1' max='6' value='1'>";
            content += "</div>";
            content += "<div>";
            content += "<label for='num'>Number of Exercises</label>";
            content += "<input type='number' step='1' name='num' id='num' min='1' max='50' value='10'>";
            content += "</div>";
            content += "<button>Start review game!</button>";
            content += "</form>";
            
            mainCont.innerHTML = content;
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
        // if user is on the search page, show it
        else if (link.classes.includes("search")) {
            content = "<h2>Kanji Search</h2>";
            content += "<form class='kanji-search'>";
            content += "<label for='kanji'>Enter a kanji character to look up.</label>";
            content += "<div>";
            content += "<input type='text' name='kanji' id='kanji' placeholder='Ex. 私'>";
            content += "<button>Search</button>";
            content += "</div>";
            content += "</form>";
            content += "<div class='search-result'></div>";
            
            mainCont.innerHTML = content;
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
    }
    
    /*** for adding search results to pages, based on element class names ***/
    displaySearchResults(e) {
        // if user is searching for kanji and no kanji is found, display the message
        if (e.message && document.querySelector(".search-result")) {
            let cont = document.querySelector(".search-result");
            let content = "<p>" + e.message + "</p>";
            cont.innerHTML = content;
        }
        // if the kanji is found, show the meaning and grade level
        else if (e.meaning && document.querySelector(".search-result")) {
            let cont = document.querySelector(".search-result");
            let content = "<p>Meaning: " + e.meaning + "</p>";
            content += "<p>Grade Level: " + e.grade + "</p>";
            cont.innerHTML = content;
        }
        // triggered when pressing back or next btn on overview page
        else if (e.meaning && document.querySelector(".view-kanji")) {
            let parent = document.querySelector(".row");
            let oldNode = document.querySelector(".view-kanji");
            
            if (parent.style.display === "none") {
                let gradeCont = document.querySelector(".kanji-grades");
                gradeCont.style.display = "none";
                parent.style.display = "flex"; 
            }
            
            let newDiv = document.createElement("div");
            newDiv.classList.add("view-kanji");
            
            let content = "<h3>" + e.kanji + "</h3>";
            content += "<p><strong>Kunyomi</strong>: " + e.kunyomi + "</p>";
            content += "<p><strong>Onyomi</strong>: " + e.onyomi + "</p>";
            content += "<p><strong>Meaning</strong>: " + e.meaning + "</p>";
            
            newDiv.innerHTML = content;
            // replace node instead of using innerHTML to avoid relrendering of HTML elements
            // this way only kanji info can be replaced instead of having to reload all btns too
            parent.replaceChild(newDiv, oldNode);
        }
        // triggered when pressing view on overview page
        else if (e.meaning && document.querySelector(".kanji-grades")) {
            // hide grade levels with view btns
            let gradeCont = document.querySelector(".kanji-grades");
            gradeCont.style.display = "none";
            
            let content = "<div class='close-btn'><span class='fa fa-times'></span></div>";
            content += "<div class='row'><div><span class='back-btn disabled fa fa-arrow-left'></span></div>";
            content += "<div class='view-kanji'>";
            content += "<h3>" + e.kanji + "</h3>";
            content += "<p><strong>Kunyomi</strong>: " + e.kunyomi + "</p>";
            content += "<p><strong>Onyomi</strong>: " + e.onyomi + "</p>";
            content += "<p><strong>Meaning</strong>: " + e.meaning + "</p>";
            content += "</div>"
            content += "<div><span class='next-btn fa fa-arrow-right'></span></div></div>";
            
            let cont = document.querySelector(".kanji-info");
            cont.innerHTML = content;
            cont.style.display = "flex";    // set to none in controller, so change that here
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
    }
}