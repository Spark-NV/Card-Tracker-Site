async function fetchAllPokemon() {
    const apiUrl = "https://pokeapi.co/api/v2/pokemon?limit=10000";
    try {
        const response = await fetch(apiUrl);
        const { results } = await response.json();
        const validPokemonNames = results.map(pokemon => pokemon.name.replace(/-/g, ' '));

        showPokemonDropdown(validPokemonNames);
    } catch (error) {
        console.error("Failed to load Pokémon list", error);
    }
}

function showPokemonDropdown(pokemonList) {
    const cardContainer = document.getElementById("card-container");
    cardContainer.innerHTML = "";

    const dropdown = document.createElement("select");

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select a Pokémon";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    dropdown.appendChild(placeholderOption);

    if (typeof pokemonList[0] === "string") {

        pokemonList.forEach(pokemonName => {
            const option = document.createElement("option");
            option.value = pokemonName;
            option.textContent = capitalizeFirstLetter(pokemonName);
            dropdown.appendChild(option);
        });
    } else {

        pokemonList.forEach(pokemon => {
            if (pokemon.name) {
                const option = document.createElement("option");
                option.value = pokemon.name;
                option.textContent = capitalizeFirstLetter(pokemon.name);
                dropdown.appendChild(option);
            }
        });
    }

    dropdown.onchange = () => {
        const selectedValue = dropdown.value;
        if (selectedValue) {
            fetchCards(selectedValue);
        }
    };

    cardContainer.appendChild(dropdown);

    const searchForm = document.createElement("form");
    const searchBox = document.createElement("input");
    searchBox.type = "text";
    searchBox.placeholder = "Search for a Pokémon...";

    searchForm.onsubmit = (e) => {
        e.preventDefault();
        const searchValue = searchBox.value.trim().toLowerCase();
        if (searchValue) {
            fetchCards(searchValue);
        }
    };

    searchForm.appendChild(searchBox);
    cardContainer.appendChild(searchForm);
}