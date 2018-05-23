window.addEventListener("load", function() {
    // create controller
    let controller = new Controller();
});

class Controller {
    constructor() {
        console.log("Controller created.");
        /*** add event listeners for custom events here ***/
        // add event listeners after page load from View
        document.addEventListener("page-loaded", this.addListeners.bind(this));
        // get saved high scores
        document.addEventListener("get-scores", this.loadScores.bind(this));
        
        // Create view later to already have event listeners set up
        this.model = new Model();
        this.view = new View();
    }
    addListeners() {
        // if there are view buttons (user is on overview page) add listeners to view buttons
        if (document.querySelector(".grade-view")) {
            let viewBtns = document.querySelectorAll(".grade-view");
            for (let i=0; i < viewBtns.length; i++) {
                viewBtns[i].addEventListener("click", this.model.getKanjiByLevel.bind(this));
            }
        }
        // if on overview page the close button is clicked
        if (document.querySelector(".view-kanji")) {
            // add listener to close btn; hide kanji results show grade levels
            let closeBtn = document.querySelector(".close-btn");
            closeBtn.addEventListener("click", function() {
                // trigger view display active page event
                let evt = new Event("display");
                evt.classList = document.querySelector(".active").classList;
                document.dispatchEvent(evt);
            });
            
            // add listener to back button
            let backBtn = document.querySelector(".back-btn");
            backBtn.addEventListener("click", function() {
                let evt = new Event("show-prev");
                document.dispatchEvent(evt);
            });
            // add listener to next button
            let nextBtn = document.querySelector(".next-btn");
            nextBtn.addEventListener("click", function() {
                let evt = new Event("show-next");
                document.dispatchEvent(evt);
            });
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
                evt.count = num.value;
                evt.purpose = "game";
                document.dispatchEvent(evt);
            })
        }
        // if page has game form (the user started a game already)
        if (document.querySelector(".game-form")) {
            let form = document.querySelector(".game-form");
            let meaning = document.querySelector("#meaning");
            form.addEventListener("submit", function(e) {
                e.preventDefault();
                let evt = new Event("check");   // check user answer
                
                if (document.getElementById("answer")) {
                    // if the user clicked next after getting it wrong, continue
                    if (document.getElementById("answer").style.display !== "none") {
                        evt.cont = true;

                        // hide the answer first
                        let event = new Event("hide-answer");
                        document.dispatchEvent(event);
                    }
                }
                evt.userAns = meaning.value;
                form.reset();
                document.dispatchEvent(evt);
                
            });
        }
        // if page has game results (congrats after review game)
        if (document.querySelector("#game-results")) {
            // add listener to close btn; hide results show review form
            let closeBtn = document.querySelector(".close-btn");
            closeBtn.addEventListener("click", function() {
                // trigger View display active page event
                let evt = new Event("display");
                evt.classList = document.querySelector(".active").classList;
                document.dispatchEvent(evt);
            });
        }
        // if page has search form, add listener (kanji search page)
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
    loadScores() {
        let result = [];
        // if local storage is empty, set up the array
        if (localStorage.getItem("highscores") === null) {
            for (let i=0; i<6; i++) {
                result[i] = 0.00;
            }
        } else {    // otherwise get the scores
            result = JSON.parse(localStorage.getItem("highscores"));
        }
        let evt = new Event("show-scores"); // pass them to View
        evt.array = result;
        document.dispatchEvent(evt);
    }
}


class Model {
    constructor() {
        console.log("Model created");
        
        this.kanjiArray = [];   // kanji array
        this.index = 0;         // current index
        this.questCount = 1;    // number of exercises user requested
        this.level = 0;         // kanji grade level
        this.meaning = "";      // kanji english meaning
        this.correctCount = 0;  // number user got correct
        
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
        // listener to get kanji array be grade level
        document.addEventListener("get-level", this.getKanjiByLevel.bind(this));
        // to determine what kanji needs to be fetched
        document.addEventListener("get-kanji", this.getKanji.bind(this));
        // to show prev kanji on overview page
        document.addEventListener("show-prev", this.showPreviousKanji.bind(this));
        // to show next kanji on overview page
        document.addEventListener("show-next", this.showNextKanji.bind(this));
        // to check user answer in game
        document.addEventListener("check", this.checkAnswer.bind(this));
    }
    // function to get array of kanji based on grade level
    getKanjiByLevel(e) {
        // start loading spinner
        let spinEvent = new Event("spin");
        document.dispatchEvent(spinEvent);
        
        const api_endpoint = "https://kanjialive-api.p.mashape.com/api/public/search/advanced/?grade=";
        if (e.target.id) {
            // get grade level based on view button id value
            this.url = api_endpoint +  e.target.id;
            this.level = e.target.id;   // set the kanji level
        } else {    // or be custom event id
            this.url = api_endpoint +  e.id;
            this.level = e.id;          // set the kanji level
        }
        
        // use different headers object for this one, its super picky
        let header = new Headers();
        // pass the key, do it as on mashape
        header.append("X-Mashape-Key", "JDlJP9InDzmshwRyiMytBPVcr73Dp1xoF0ijsnG0tdmZvVhwNB");
        let init = { headers: header };
        
        //Build request object and pass it to fetch
        const request = new Request(this.url, init);
        
        fetch(request) 
            .then(response => response.json())
            .then(results => {
                let event  = new Event("get-kanji")
                event.kanjiArray = results;
                if (e.count) {  // if there is a count, save it into Model
                    this.questCount = e.count;
                    event.purpose = e.purpose;  // this is to know if it is for the game
                }
                document.dispatchEvent(event);
        })
            .catch(function(error) {
                console.log(error);
        });
    }
    // get specific kanji details using fetch request
    getKanjiSearchResult(e) {
        // if the user didn't leave the search field blank, continue
        if (e.userValue.trim() !== "") {
            // start spin animation
            let spinEvent = new Event("spin");
            document.dispatchEvent(spinEvent);
            
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
                        event.index = e.index;
                        event.max = e.max;
                        // save the right answer locally into the Model
                        this.meaning = results.kanji.meaning.english;
                    }
                    document.dispatchEvent(event);
            })
                .catch(function(error) {
                    console.log(error);
            });
        }
    }
    // function to determine what kanji to get
    getKanji(e) {
        // if passed an array, set it and reset the index and correct count
        // this means a new array has been loaded
        if (e.kanjiArray) {
            this.kanjiArray = e.kanjiArray;
            this.index = 0;
            this.correctCount = 0;
        }
        
        // create custom event and pass the kanji to get details for (to Model)
        let query = "";
        let evt = new Event("get-search-results");
        // if this is for the review game
        if (e.purpose === "game" || e === "game") {
            // get rand value based on array length
            let randInt = Math.floor(Math.random() * (this.kanjiArray.length - 0)) + 0;
            query = this.kanjiArray[randInt].kanji.character;
            evt.max = this.questCount;
        }
        else { // otherwise get kanji at current index
            query = this.kanjiArray[this.index].kanji.character;
            evt.max = this.kanjiArray.length;
        } 
        evt.userValue = query;
        evt.index = this.index + 1;
        document.dispatchEvent(evt);
    }
    // display the previous kanji in the overview page
    showPreviousKanji(e) {
        let evt = new Event("back-next");
        // if moving back from last kanji in array, change styling of next button
        if (this.index === this.kanjiArray.length - 1) {
            evt.next = true;
            document.dispatchEvent(evt);
        }
        // if you are going back to first kanji in array, change styling of back btn
        if (this.index === 1) {
            evt.back = true;
            document.dispatchEvent(evt);
        }
        // if currently not viewing the first kanji in array, subtract index and go back one
        if (this.index > 0) {
            this.index--;
            
            this.getKanji("");
        }
    }
    // display the next kanji in the overview page
    showNextKanji(e) {
        let evt = new Event("back-next");
        // if going forward from first kanji, change styling of back btn
        if (this.index === 0) {
            evt.back = true;
            document.dispatchEvent(evt);
        }
        // if about to show the last kanji, change styling of next btn
        if (this.index === (this.kanjiArray.length-2)) {
            evt.next = true;
            document.dispatchEvent(evt);
        }
        // if currently not viewing the last kanji, add to index and show the next one
        if (this.index < (this.kanjiArray.length - 1)) {
            this.index++;
            this.getKanji("");
        }
    }
    checkAnswer(e) {
        if (e.cont) {   // if user originally got the question wrong,
            // continue the game, don't mark it right
            this.index++;
            if (this.index < this.questCount) {
                this.getKanji("game");
            } else {    // get game results
                this.getGameResults();
            }
        }
        // if the answer is not blank,
        else if (/\S/.test(e.userAns)) {
            // there could be more than one right answer, split string into array
            let rightAnswers = this.meaning.split(',');
            let isValid = false;
            // check user answer against each array value
            for (let i=0; i < rightAnswers.length; i++) {
                if (e.userAns.trim() === rightAnswers[i].trim()) {
                    // if correct, set is valid to true
                    isValid = true;
                }
            }
            if (isValid) {  // if answer is right
                this.index++;
                this.correctCount++;    // add to score, continue game
                if (this.index < this.questCount) {
                    this.getKanji("game");
                } else {    // get game results
                    this.getGameResults();
                }
            } else {    // otherwise, show the right answer
                let event = new Event("wrong-answer");
                event.answer = this.meaning;
                document.dispatchEvent(event);
            }
        }
    }
    // this is to see the score after the review game
    getGameResults() {
        let evt = new Event("game-done");
        // get number correct out of total
        evt.correct = this.correctCount;
        evt.total = this.questCount;
        // calc percentage, round it too
        let decimal = this.correctCount / this.questCount;
        decimal = decimal * 100;
        evt.percent = decimal.toFixed(2);
        
        // pass it to function to save it if it is a high score
        this.saveHighScore(decimal.toFixed(2));
        
        // based on result, change message
        if (evt.percent > 90) {
            evt.message = "Great job, you got this!";
        } else if (evt.percent > 70) {
            evt.message = "Good work!";
        } else if (evt.percent > 50) {
            evt.message = "Not bad, but you might want to review.";
        } else {
            evt.message = "If you need to review, check out the Kanji Overview section.";
        }
        
        document.dispatchEvent(evt);
    }
    // save high scores by comparing with local storage values
    saveHighScore(num) {
        let scores = [];
        
        // if there is no local storage, add 0s for blank scores
        if (localStorage.getItem("highscores") === null) {
            for (let i=0; i < 6; i++) {
                scores[i] = "0.00";
            }
            // set current high score
            scores[this.level-1] = num;
        } else {
            // otherwise, load the existing scores
            scores = JSON.parse(localStorage.getItem("highscores"));
            // if the current score is greater than the previous one, replace it
            if (parseFloat(scores[this.level-1]) < num) {
                scores[this.level-1] = num;
            }
        }
        // set the updated data in local storage
        localStorage.setItem("highscores", JSON.stringify(scores));
    }
}

class View {
    constructor() {
        console.log("View created.");
        
        // add event listeners
        this.addListeners();
        
        // display home page by default
        let evt = new Event("display");
        evt.classList = document.querySelector(".active").classList;
        document.dispatchEvent(evt);
    }
    addListeners() {
        // hamburger menu listener
        let menu = document.querySelector(".js-menu");
        menu.addEventListener("click", function() {
            document.querySelector(".sidebar").classList.toggle("hidden");
            document.querySelector(".js-view").classList.toggle("sm-hidden");
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
                /** don't use e.target.classList, span doesn't have js-...-link class **/
                evt.classList = this.classList; 
                document.dispatchEvent(evt);
            });
        }
        
        /*** listeners for kanji search results ***/
        document.addEventListener("search-results", this.displaySearchResults);
        // add listener for back next buttons on overview page
        document.addEventListener("back-next", this.toggleBackNext);
        // add listener for wrong answer in review game
        document.addEventListener("wrong-answer", this.showRightAnswer);
        // add listener to hide right answer when needed
        document.addEventListener("hide-answer", this.hideAnswer);
        // add listener to when game is finished
        document.addEventListener("game-done", this.showGameResults);
        // add listener to show scores on home page
        document.addEventListener("show-scores", this.showScores);
        // handle spin animation
        document.addEventListener("spin", this.spin);
    }
    // function to show high scores
    showScores(e) {
        let mainCont = document.querySelector(".js-view");
        let content = "<h2>High Scores</h2>";
        content += "<article class='highscores'>";
        for (let i=0; i < e.array.length; i++) {
            content += "<div><h3>Kanji Grade Level " + (i+1) + "</h3>";
            // if default value, ignore
            if (e.array[i] == 0.00) {
                content += "<p>No high score yet</p></div>";
            // otherwise show the high score
            } else {
                content += "<p>" + e.array[i] + "%</p></div>";
            }
        } 
        content += "</article>";
        
        mainCont.innerHTML = content;
        // create new event so controller will know to add any necessary listeners
        let event  = new Event("page-loaded");
        document.dispatchEvent(event);
    }
    /*** function to display the correct page based on the link ***/
    displayPage(link) {
        let mainCont = document.querySelector(".js-view");
        let content = "";
        
        // if user is on the home page, trigger event to load high scores from local storage
        if (link.classList.contains("js-home-link")) {
            let evt = new Event("get-scores");
            document.dispatchEvent(evt);
        }
        // if user is on the overview page, show it
        else if (link.classList.contains("js-review-link")) {
            content = "<h2 class='sec-title'>Kanji Overview</h2>";
            content += "<aricle class='kanji-grades'>";
            // for each kanji level (1-6) add a button and title
            for (let i=0; i < 6; i++) {
                content += "<div><h3>Kanji Grade Level " + (i+1) + "</h3>";
                content += "<i class='fa fa-spinner' style='display:none;'></i>";
                content += "<button class='grade-view' id='" + (i+1) + "'>View</button></div>";
            }
            content += "</aricle>";
            content += "<artice class='kanji-info'></article>";
            
            mainCont.innerHTML = content;
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
        // if user is on the review game page, show the initial form
        else if (link.classList.contains("js-game-link")) {
            content = "<h2 class='sec-title'>Review Game</h2>";
            content += "<form class='review-form'>";
            content += "<p>Enter the kanji grade level to review and how many questions you want. Once the game starts, you'll be given questions with a random kanji from that grade level and asked to enter the English meaning.</p>";
            content += "<div class='row'><div>";
            content += "<label for='level'>Kanji Grade Level</label>";
            content += "<input type='number' step='1' name='level' id='level' min='1' max='6' value='1'>";
            content += "</div>";
            content += "<div>";
            content += "<label for='num'>Number of Exercises</label>";
            content += "<input type='number' step='1' name='num' id='num' min='1' max='50' value='10'>";
            content += "</div></div>";
            content += "<button>Start review game!</button>";
            content += "<i class='fa fa-spinner' style='display:none;'></i>";
            content += "</form>";
            
            mainCont.innerHTML = content;
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
        // if user is on the search page, show it
        else if (link.classList.contains("js-search-link")) {
            content = "<h2>Kanji Search</h2>";
            content += "<form class='kanji-search'>";
            content += "<label for='kanji'>Enter a kanji character to look up.</label>";
            content += "<div>";
            content += "<input type='text' name='kanji' id='kanji' placeholder='Ex. 私'>";
            content += "<button>Search</button>";
            content += "</div>";
            content += "</form>";
            content += "<i class='fa fa-spinner' style='display:none;'></i>";
            content += "<div class='search-result'></div>";
            
            mainCont.innerHTML = content;
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
    }
    spin(e) {
        let spinner = "";
        let id = 0;
        let viewBtns = document.getElementsByClassName("grade-view");
        if (document.querySelector(".view-kanji") || document.querySelector(".game-form")) {
            // pass
        } else if (viewBtns.length > 0) {
            for (let i=0; i < viewBtns.length; i++) {
                if (e.explicitOriginalTarget == viewBtns[i]) {
                    id = i;
                    let spinners = document.querySelectorAll(".fa-spinner");
                    spinner = spinners[i];
                    
                    spinner.classList.toggle("active-spinner");
                    if (spinner.style.display === "none") {
                        spinner.style.display = "flex";
                    } else {
                        spinner.style.display = "none";
                    }
                }
            }
        } else {
            spinner = document.querySelector(".fa-spinner");
            spinner.classList.toggle("active-spinner");
            if (spinner.style.display === "none") {
                spinner.style.display = "flex";
            } else {
                spinner.style.display = "none";
            }
        }
    }
    
    /*** for adding search results to pages, based on element class names ***/
    displaySearchResults(e) {
        let spinEvent = new Event("spin");
        document.dispatchEvent(spinEvent);
        
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
        // triggered on overview page
        else if (e.meaning && document.querySelector(".kanji-grades")) {
            // modify title to show how which index the user is on
            let title = document.querySelector(".sec-title");
            title.innerHTML = "Kanji Overview - Level " + e.grade + " " + e.index + "/" + e.max;
            
            // hide grade levels with view btns
            let gradeCont = document.querySelector(".kanji-grades");
            gradeCont.style.display = "none";
            
            // build content
            let cont = document.querySelector(".kanji-info");
            cont.style.display = "flex";    // set to none in controller, so change that here
            
            // if the view button was pressed build everything
            if (!document.querySelector(".view-kanji")) {
                let content = "<div class='close-btn'><span class='fa fa-times'></span></div>";
                content += "<div class='row'><div><span class='back-btn disabled fa fa-arrow-left'></span></div>";
                content += "<div class='view-kanji'>";
                content += "<h3>" + e.kanji + "</h3>";
                content += "<p><strong>Kunyomi</strong>: " + e.kunyomi + "</p>";
                content += "<p><strong>Onyomi</strong>: " + e.onyomi + "</p>";
                content += "<p><strong>Meaning</strong>: " + e.meaning + "</p>";
                content += "</div>"
                content += "<div><span class='next-btn fa fa-arrow-right'></span></div></div>";

                cont.innerHTML = content;
                let event  = new Event("page-loaded");
                document.dispatchEvent(event);
            } else {    // else, just replace the kanji info
                let parent = document.querySelector(".row");
                let oldNode = document.querySelector(".view-kanji");
                let newDiv = document.createElement("div");
                newDiv.classList.add("view-kanji");

                let content = "<h3>" + e.kanji + "</h3>";
                content += "<p><strong>Kunyomi</strong>: " + e.kunyomi + "</p>";
                content += "<p><strong>Onyomi</strong>: " + e.onyomi + "</p>";
                content += "<p><strong>Meaning</strong>: " + e.meaning + "</p>";
                
                newDiv.innerHTML = content;
                // replace node instead of using innerHTML to avoid rerendering of HTML elements
                // this way kanji info can be replaced instead of having to reload all btns too
                parent.replaceChild(newDiv, oldNode);
            }
        }
        // if the user started a review game
        else if (document.querySelector(".review-form") || document.querySelector(".game-form")) {  // update the title
            let title = document.querySelector(".sec-title");
            title.innerHTML = "Review Game - Level " + e.grade + " " + e.index + "/" + e.max;
            
            // if the game has already satrted, simply show the next question
            if (document.querySelector(".game-form")) {
                let parent = document.querySelector(".game-form");
                let oldNode = document.querySelector("#quest");
                let newEl = document.createElement("h3");
                newEl.setAttribute("id", "quest");
                newEl.innerHTML = e.kanji;
                parent.replaceChild(newEl, oldNode);
            } else {    // if it hasn't, build out all the content
                let parent = document.querySelector(".js-view");
                let oldNode = document.querySelector(".review-form");
                let newEl = document.createElement("form");
                newEl.classList.add("game-form");

                let content = "<h3 id='quest'>" + e.kanji + "</h3>";
                content += "<div class='row'>";
                content += "<label for='meaning'>English meaning:</label>";
                content += "<input type='text' name='meaning' id='meaning'>";
                content += "<button id='submit'>Submit Answer</button>";
                content += "</div>";

                newEl.innerHTML = content;
                parent.replaceChild(newEl, oldNode);
                let event  = new Event("page-loaded");
                document.dispatchEvent(event);
            }
        }
    }   
    // on overview page, toggle disabled class to style back and next buttons
    toggleBackNext(e) {
        if (e.back) {
            document.querySelector(".back-btn").classList.toggle("disabled");
        } else if (e.next) {
            document.querySelector(".next-btn").classList.toggle("disabled");
        }
    }
    // show the right anser to the user
    showRightAnswer(e) {
        let parent = document.querySelector(".game-form");
        let newEl = document.createElement("div");
        // if element with #answer exists, replace with new content
        if (document.querySelector("#answer")) {
            let oldNode = document.querySelector("#answer");
            oldNode.style.display = "flex";
            
            newEl.setAttribute("id", "answer");
        
            let content = "<h4>Incorrect Answer: </h4>";
            content += "<div class='row'<p>Accepted answers are: " + e.answer + "</p>";
            content += "<button>Next</button></div>";
            newEl.innerHTML = content;
            
            parent.replaceChild(newEl, oldNode);
        } else {    // else, add new content
            newEl.setAttribute("id", "answer");
        
            let content = "<h4>Incorrect Answer: </h4>";
            content += "<div class='row'><p>Accepted answers are: " + e.answer + "</p>";
            content += "<button type='submit'>Continue</button></div>";
            newEl.innerHTML = content;
            parent.appendChild(newEl);
        }
        // disable Submit Answer button
        document.querySelector("#submit").disabled = true;
    }
    // once the user hits next, hide the answer
    hideAnswer() {
        document.querySelector("#answer").style.display = "none";
        document.querySelector("#submit").disabled = false;
    }
    // function to show game results (review page)
    showGameResults(e) {
        let cont = document.querySelector(".js-view");
        // build content, show user how much they got right
        let content = "<h2>Review Game - Complete!</h2>";
        content += "<div class='close-btn'><span class='fa fa-times'></span></div>";
        content += "<article id='game-results'>";
        content += "<h3>Congrats!</h3>";
        content += "<p>You got: " + e.correct + "/" + e.total + "</p>";
        content += "<p>" + e.percent + "%</p>";
        content += "<p>" + e.message + "</p>";
        content += "</article>";
        
        cont.innerHTML = content;
        let event  = new Event("page-loaded");
        document.dispatchEvent(event);
    }
}