window.addEventListener("load", function() {
    // create controller
    let controller = new Controller();
});

class Controller {
    constructor() {
        console.log("Controller created.");
        this.model = new Model();
        this.view = new View();
        
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
        
        // if page has search button, add listener
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
        // create custom event and pass the kanji to get details for
        let query = this.kanjiArray[this.index].kanji.character;
        let evt = new Event("get-search-results");
        evt.userValue = query;
        document.dispatchEvent(evt);
    }
    saveArrayGetDetails(e) {
        // save array and reset index
        this.kanjiArray = e.kanjiArray;
        this.index = 0;
        
        this.getKanji();
    }
    // display the previous kanji in the overview page
    showPreviousKanji(e) {
        if (this.index === this.kanjiArray.length - 1) {
            document.querySelector(".next-btn").classList.remove("disabled");
        }
        if (this.index === 1) {     
            e.target.classList.add("disabled");
        }
        if (this.index > 0) {
            this.index--;
            
            this.getKanji();
        }
    }
    // display the next kanji in the overview page
    showNextKanji(e) {
        if (this.index === 0) {
            document.querySelector(".back-btn").classList.remove("disabled");
        }
        if (this.index === (this.kanjiArray.length-2)) {
            e.target.classList.add("disabled");
        }
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
        // listener to use fetch to get search results if input is valid
        document.addEventListener("get-search-results", this.getKanjiSearchResult.bind(this));
    }
    getKanjiByLevel(e) {
        const api_endpoint = "https://kanjialive-api.p.mashape.com/api/public/search/advanced/?grade=";
        // get grade level based on view button id value
        this.url = api_endpoint +  e.target.id;
        
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
                        event.kunyomi = [results.kanji.kunyomi.hiragana, 
                                         results.kanji.kunyomi.romaji];
                        event.onyomi = [results.kanji.onyomi.katakana, 
                                        results.kanji.onyomi.romaji];
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
        
        // get where to add HTML
        //this.mainCont = document.querySelector(".js-view");
        
        // add event listeners
        this.addListeners();
        
        // display home page by default
        let evt = new Event("display");
        evt.classes = document.querySelector(".active").className;
        document.dispatchEvent(evt);
    }
    addListeners() {
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
                let evt = new Event("display");
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
            content += "<p>Will be completed later. </p>";
            content += "<p>Check out the other links like Kanji Overview and Kanji Search.</p>";
            
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
        // triggered when pressing back or next btn
        else if (e.meaning && document.querySelector(".view-kanji")) {
            let parent = document.querySelector(".kanji-info");
            let oldNode = document.querySelector(".view-kanji");
            
            let newDiv = document.createElement("div");
            newDiv.classList.add("view-kanji");
            
            let content = "<h3>" + e.kanji + "</h3>";
            content += "<p>" + e.kunyomi[0] + ", " + e.onyomi[0] + "</p>";
            content += "<p>" + e.kunyomi[1] + ", " + e.onyomi[1] + "</p>";
            content += "<p>" + e.meaning + "</p>";
            
            newDiv.innerHTML = content;
            parent.replaceChild(newDiv, oldNode);
        }
        // might need to edit this later
        else if (e.meaning && document.querySelector(".kanji-grades")) {
            let gradeCont = document.querySelector(".kanji-grades");
            gradeCont.style.display = "none";
            
            content = "<div><span class='close-btn'>Close Icon</span></div>";
            content += "<div><span class='back-btn disabled'>Back Icon</span></div>";
            content += "<div class='view-kanji'>";
            content += "<h3>" + e.kanji + "</h3>";
            content += "<p>" + e.kunyomi[0] + ", " + e.onyomi[0] + "</p>";
            content += "<p>" + e.kunyomi[1] + ", " + e.onyomi[1] + "</p>";
            content += "<p>" + e.meaning + "</p>";
            content += "</div>"
            content += "<div><span class='next-btn'>Next Icon</span></div>";
            
            let cont = document.querySelector(".kanji-info");
            cont.innerHTML = content;
            cont.style.display = "flex";    // set to none in controller
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
    }
}