window.addEventListener("load", function() {
    
    let controller = new Controller();
});

class Controller {
    constructor() {
        console.log("Controller created.");
        this.model = new Model();
        this.view = new View();
    }
}


class Model {
    constructor() {
        console.log("Model created");
    }
}

class View {
    constructor() {
        console.log("View created.");
        this.addListeners();
        
    }
    
    addListeners() {
        // this is to change active class for sidebar links
        let links = document.querySelectorAll(".link");
        // go through each link, add a click event listener
        for (let i=0; i < links.length; i++) {
            links[i].addEventListener("click", function() {
                // remove active class from current link and add it to the one that was clicked
                document.querySelector(".active").classList.remove("active");
                this.classList.add("active");
            });
        }
    }
}