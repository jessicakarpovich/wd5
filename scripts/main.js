window.addEventListener("load", function() {
    // create controller
    let controller = new Controller();
});

class Controller {
    constructor() {
        console.log("Controller created.");
        this.model = new Model();
        this.view = new View();
        
        // add event listeners on page loaded event, 
        // you can only add them after the view has added the contents for that page
        document.addEventListener("page-loaded", this.addListeners.bind(this));
    }
    addListeners() {
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
}


class Model {
    constructor() {
        console.log("Model created");
        
        // add event listeners
        this.addListeners();
    }
    addListeners() {
        // listener to use fetch to get search results if input is valid
        document.addEventListener("get-search-results", this.getKanjiSearchResult.bind(this));
    }
    
    getKanjiSearchResult(e) {
        // if the user didn't leave the search field blank, continue
        if (e.userValue.trim() !== "") {
            console.log("okay");
        }
    }
}

class View {
    constructor() {
        console.log("View created.");
        
        // get where to add HTML
        this.mainCont = document.querySelector(".js-view");
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
    }
    displayPage(link) {
        // clear contents
        this.mainCont.innerHTML = "";
        
        // if user is on the search page, show it
        if (link.classes.includes("search")) {
            console.log("yay");
            
            let content = "<h2>Kanji Search</h2>";
            content += "<form class='kanji-search'>";
            content += "<label for='kanji'>Enter a kanji character to look up.</label>";
            content += "<div>";
            content += "<input type='text' name='kanji' id='kanji' placeholder='Ex. 私'>";
            content += "<button>Search</button>";
            content += "</div>";
            content += "</form>";
            content += "<div class='search-result'></div>";
            
            this.mainCont.innerHTML = content;
            let event  = new Event("page-loaded");
            document.dispatchEvent(event);
        }
    }
}