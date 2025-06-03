document.addEventListener('DOMContentLoaded', async function() {
    // Get cocktail ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const cocktailId = urlParams.get('id');

    if (!cocktailId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Fetch cocktail details from the API
        const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailId}`);
        const data = await response.json();

        if (data.drinks && data.drinks[0]) {
            const cocktail = data.drinks[0];
            
            // Update page content
            document.getElementById('cocktailName').textContent = cocktail.strDrink;
            document.getElementById('cocktailCategory').textContent = cocktail.strCategory;
            document.getElementById('cocktailGlass').textContent = cocktail.strGlass;
            document.getElementById('cocktailAlcohol').textContent = cocktail.strAlcoholic;
            document.getElementById('cocktailImage').src = cocktail.strDrinkThumb;
            document.getElementById('cocktailImage').alt = cocktail.strDrink;
            document.getElementById('cocktailInstructions').textContent = cocktail.strInstructions;

            // Get ingredients
            const ingredientsList = document.getElementById('ingredientsList');
            for (let i = 1; i <= 15; i++) {
                const ingredient = cocktail[`strIngredient${i}`];
                const measure = cocktail[`strMeasure${i}`];
                
                if (ingredient) {
                    const li = document.createElement('li');
                    li.textContent = `${measure ? measure.trim() : ''} ${ingredient}`;
                    ingredientsList.appendChild(li);
                }
            }
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error fetching cocktail details:', error);
        window.location.href = 'index.html';
    }
});