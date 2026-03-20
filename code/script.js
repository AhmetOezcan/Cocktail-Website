const searchCache = {}; // Cache für die Cocktail-Suche
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

let allCocktailsCache = []; // Cache für alle Cocktails
let currentCocktails = [];  // Liste der Cocktails, die aktuell angezeigt werden

const loadingScreen = document.getElementById('loadingScreen');
const resultsSection = document.getElementById('resultsSection');

// Initially hide the results section
resultsSection.style.opacity = '0';

// Am Anfang der Datei nach den Variablen-Deklarationen
const customAlert = document.getElementById('customAlert');
const alertMessage = customAlert.querySelector('.alert-message');
const alertClose = customAlert.querySelector('.alert-close');

class Cocktail {
    
    constructor(id, name, image, category, alcohol_content, glass) {
        this.idDrink = id; 
        this.strDrink = name;
        this.strDrinkThumb = image;
        this.ingredients = [];
        this.strCategory = category;
        this.strAlcoholic = alcohol_content;
        this.strGlass = glass;
        this.containsAllIngredients = false; // Flag, ob alle Zutaten enthalten sind
    }

    getIngredients() {
        return this.ingredients;
    }
}

async function loadCocktailsByAlphabet() {
    // Show loading screen
    loadingScreen.classList.remove('hidden');
    
    for (const letter of alphabet) {
        const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.drinks) {
                data.drinks.forEach(cocktail => {
                    const newCocktail = new Cocktail(
                        cocktail.idDrink,
                        cocktail.strDrink,
                        cocktail.strDrinkThumb, 
                        cocktail.strCategory,
                        cocktail.strAlcoholic,
                        cocktail.strGlass
                    );
                    for(let i = 1; i <= 15; i++) {  
                        const ingredient = cocktail[`strIngredient${i}`];
                        if (ingredient) {
                            newCocktail.ingredients.push(ingredient.toLowerCase());
                        }
                    }   
                    allCocktailsCache.push(newCocktail);
                });
            }
        } catch (error) {
            console.error(`Fehler beim Abrufen der Cocktails für Buchstabe ${letter}:`, error);
        }    
    }
    
    // Add a small delay to ensure smooth transition
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Hide loading screen and show content
    loadingScreen.classList.add('hidden');
    resultsSection.style.opacity = '1';
    resultsSection.style.transition = 'opacity 0.5s ease-in';
    
    console.log("Alle Cocktails erfolgreich geladen:", allCocktailsCache);
}

// Funktion zum Anzeigen des Alerts
function showAlert(message, duration = 3000) {
    alertMessage.textContent = message;
    customAlert.classList.add('show');
    
    // Automatisches Ausblenden nach der angegebenen Zeit
    setTimeout(() => {
        customAlert.classList.remove('show');
    }, duration);
}

// Event Listener für den Close-Button
alertClose.addEventListener('click', () => {
    customAlert.classList.remove('show');
});

async function searchCocktailsByIngredient(ingredients) {
    loadingScreen.classList.remove('hidden');
    currentCocktails = []; // Liste der Cocktails zurücksetzen

    if (!ingredients) {
        showAlert("Please enter one or more ingredients.");
        loadingScreen.classList.add('hidden');
        return;
    }

    const ingredientList = ingredients
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i.length > 0);

    if (ingredientList.length === 0) {
        showAlert("Please enter at least one valid ingredient.");
        loadingScreen.classList.add('hidden');
        return;
    }

    ingredientList.forEach(ingredient => {
        let cacheKey = `ingredient:${ingredient}`;
        let filteredCocktails = [];

        if (searchCache[cacheKey]) {
            console.log("Cocktails aus dem Cache geholt:");
            filteredCocktails = searchCache[cacheKey];
        } else {
            filteredCocktails = allCocktailsCache.filter(cocktail =>
                cocktail.ingredients.includes(ingredient)
            );
            console.log(filteredCocktails);
            searchCache[cacheKey] = filteredCocktails;
        }
        // cocktails anhängen
        currentCocktails = currentCocktails.concat(filteredCocktails);
    });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    matchIngredients(currentCocktails, ingredientList);
    loadingScreen.classList.add('hidden');
}

async function searchCocktailsByName(name) {
    loadingScreen.classList.remove('hidden');
    currentCocktails = [];

    if (!name) {
        showAlert("Please enter a cocktail name.");
        loadingScreen.classList.add('hidden');
        return;
    }

    let cacheKey = `name:${standartizeCocktailName(name)}`;
    
    if (searchCache[cacheKey]) {
        displayCocktails(searchCache[cacheKey]);
        console.log("Cocktails aus dem Cache geholt:");
    } else {
        console.log("Cocktails nicht im Cache gefunden, Suche wird gestartet...");
        currentCocktails = allCocktailsCache.filter(cocktail => 
             cocktail.strDrink.toLowerCase().includes(standartizeCocktailName(name))
        );

        if (currentCocktails.length > 0) {
            searchCache[cacheKey] = currentCocktails;
            displayCocktails(currentCocktails);
        } else {
            displayNoCocktailsFound();
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    loadingScreen.classList.add('hidden');
}

// Funktion, die den Cocktailnamen standardisiert
// (z.B. Leerzeichen und Kommas entfernt, Kleinbuchstaben)
function standartizeCocktailName(name) {
    return name.trim().toLowerCase().replace(/,/g, ""); 
}

function checkForDuplicatesAndDisplay(allCocktails) {
    // Duplikate anhand der ID entfernen
    allCocktails = Array.from(new Set(allCocktails.map(a => a.idDrink)))
        .map(id => allCocktails.find(a => a.idDrink === id));

    // Cocktails anzeigen oder "Keine Cocktails gefunden"
    if (allCocktails.length > 0) {
        displayCocktails(allCocktails);
    } else {
        displayNoCocktailsFound();
    }
}

// Funktion, die die Cocktails auf der Webseite anzeigt
function displayCocktails(cocktails) {
    const cocktailList = document.getElementById("cocktailList");
    cocktailList.innerHTML = ""; // Liste leeren

    // Sort cocktails - perfect matches first
    cocktails.sort((a, b) => {
        if (a.containsAllIngredients && !b.containsAllIngredients) return -1;
        if (!a.containsAllIngredients && b.containsAllIngredients) return 1;
        return 0;
    });

    cocktails.forEach(cocktail => {
        // Neues Listenelement für jeden Cocktail erstellen
        const listItem = document.createElement("li");

        // HERVORHEBUNG, wenn alle Zutaten enthalten sind
         if (cocktail.containsAllIngredients) {
              listItem.classList.add("highlight-cocktail");
        }
        
        // Bild-Container erstellen
        const imgContainer = document.createElement("div");
        const cocktailImg = document.createElement("img");
        cocktailImg.className = "cocktail-image";
        cocktailImg.src = cocktail.strDrinkThumb || "placeholder-image.jpg"; // Fallback-Bild falls keins vorhanden
        cocktailImg.alt = cocktail.strDrink;
        imgContainer.appendChild(cocktailImg);
        
        // Info-Container erstellen
        const infoContainer = document.createElement("div");
        infoContainer.className = "cocktail-info";
        
        // Name
        const nameElement = document.createElement("div");
        nameElement.className = "cocktail-name";
        nameElement.textContent = cocktail.strDrink;
        
        // Kategorie
        const categoryElement = document.createElement("div");
        categoryElement.className = "cocktail-category";
        categoryElement.textContent = cocktail.strCategory || "No category";
        
        // Link zum Cocktail
        const cocktailLink = document.createElement("a");
        cocktailLink.href = `./code/recipe.html?id=${cocktail.idDrink}`;
        cocktailLink.target = "_blank"; // Öffnen im neuen Tab
        
        // Elemente zusammenfügen
        infoContainer.appendChild(nameElement);
        infoContainer.appendChild(categoryElement);
        cocktailLink.appendChild(imgContainer);
        cocktailLink.appendChild(infoContainer);
        listItem.appendChild(cocktailLink);
        cocktailList.appendChild(listItem);
    });
}

function matchIngredients(cocktails, ingredients) {
    cocktails.forEach(cocktail => {
        // Nur hervorheben (=Flag setzen), wenn mehr als eine Zutat gesucht wird UND alle enthalten sind
        cocktail.containsAllIngredients =
            ingredients.length > 1 &&
            ingredients.every(ingredient =>
                cocktail.ingredients.includes(ingredient.toLowerCase())
            );
    });
    checkForDuplicatesAndDisplay(cocktails);
}

function displayNoCocktailsFound() {
    const cocktailList = document.getElementById("cocktailList");
    cocktailList.innerHTML = "No Cocktails available!";
}


const searchInput = document.getElementById("input");
const searchType = document.getElementById("searchType");

// kombinierter Evenhandler für die Eingabe und den Typ der Suche
function handleSearchEvents(event){
    const searchTypeValue = searchType.value;

    // wenn der event vom Typ "change" ist, dann den Platzhalter ändern
    if(event.type === "change"){
        if (searchTypeValue === "ingredient") {
            searchInput.placeholder = "Search for ingredients...";
        } else if (searchTypeValue === "name") {
            searchInput.placeholder = "Search for cocktail names...";
        }
    }
    // wenn der Event vom Typ "keydown" ist und die Taste "Enter" gedrückt wurde, 
    // dann die Suche starten
    else if(event.type === "keydown" && event.key === "Enter"){
        // Sidebar automatisch öffnen
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        }
        if (searchTypeValue === "ingredient") {
            const ingredient = searchInput.value;
            searchCocktailsByIngredient(ingredient);
        } else if (searchTypeValue === "name") {
            const name = searchInput.value;
            searchCocktailsByName(name);
        }
    }	
}

// Event-Listener für die Eingabe und den Typ der Suche
searchInput.addEventListener("keydown", handleSearchEvents);
searchType.addEventListener("change", handleSearchEvents);


// Altersabfrage
document.addEventListener("DOMContentLoaded", function() {
    const ageCheck = document.getElementById("ageCheck");
    const yesButton = document.getElementById("yesButton");
    const noButton = document.getElementById("noButton");

    yesButton.addEventListener("click", function() {
        ageCheck.style.display = "none";
    });

    noButton.addEventListener("click", function() {
        document.body.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f8f8f8;">
                <img src="https://cdn.pixabay.com/photo/2016/03/31/19/56/drink-1298381_1280.png" alt="" style="max-width:180px;margin-bottom:30px;opacity:0.8;">
                <h1 style="color:#c0392b;margin-bottom:10px;">No Access!</h1>
                <p style="font-size:1.2em;color:#555;margin-bottom:30px;text-align:center;max-width:350px;">
                    Unfortunately, you are not yet 18 years old.<br>
                    Access to this site is therefore not permitted.<br>
                    Enjoy delicious cocktails once you are of legal age!
                </p>
                <button onclick="window.location.href='https://www.kindersache.de/bereiche/spiel-und-spass/rezepte'" style="padding:12px 28px;font-size:1em;background:#27ae60;color:#fff;border:none;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    To Non-Alcoholic Cocktails
                </button>
            </div>
        `;
    });
});


const randomCocktailButton = document.getElementById("randomButton");

randomCocktailButton.addEventListener("click", async () => {
    loadingScreen.classList.remove('hidden');
    const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/random.php`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        displayCocktails(data.drinks);
    } catch (error) {
        console.error('Error fetching random cocktail:', error);
        showAlert("Fehler beim Laden des zufälligen Cocktails.");
    } finally {
        await new Promise(resolve => setTimeout(resolve, 300));
        loadingScreen.classList.add('hidden');
    }
});

// Sidebar Toggle
document.addEventListener("DOMContentLoaded", function() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    if (sidebarToggle && sidebar) {  // Überprüfung ob Elemente existieren
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});

// Beim Laden der Website aufrufen
document.addEventListener("DOMContentLoaded", function () {
    loadCocktailsByAlphabet();
});


const applyFilters = document.getElementById("applyFilters");

applyFilters.addEventListener("click", () => {
    // Prüfen, ob bereits eine Suche durchgeführt wurde
    if (!currentCocktails || currentCocktails.length === 0) {
        showAlert("First search for a cocktail");
        return;
    }

    const selectedAlcoholContent = document.getElementById("alcoholFilter").value;
    const selectedCategory = document.getElementById("categoryFilter").value;
    const selectedGlass = document.getElementById("glassFilter").value;

    let filteredCocktails = currentCocktails;

    if (selectedAlcoholContent && selectedAlcoholContent !== "All") {
        filteredCocktails = filteredCocktails.filter(
            cocktail => cocktail.strAlcoholic === selectedAlcoholContent
        );
    }
    if (selectedCategory && selectedCategory !== "All") {
        filteredCocktails = filteredCocktails.filter(
            cocktail => cocktail.strCategory === selectedCategory
        );
    }
    if (selectedGlass && selectedGlass !== "All") {
        filteredCocktails = filteredCocktails.filter(
            cocktail => cocktail.strGlass === selectedGlass
        );
    }

    // Sidebar schließen
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    if (filteredCocktails.length > 0) {
        checkForDuplicatesAndDisplay(filteredCocktails);
    } else {
        displayNoCocktailsFound();
    }
});
