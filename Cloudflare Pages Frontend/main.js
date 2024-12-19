const workerUrl = "yourworkerurl.dev";
let totalCards = 0, collectedCount = 0;

function createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.onclick = onClick;
    return button;
}

function updateTextContent(selector, text) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchCards(name) {
    const apiUrl = "https://api.pokemontcg.io/v2/cards";
    const headers = { "X-Api-Key": "YOUR_API_KEY" };
    const cardContainer = document.getElementById("card-container");

    cardContainer.innerHTML = "Loading...";
    
    try {
        const encodedName = encodeURIComponent(name);
        const response = await fetch(`${apiUrl}?q=name:${encodedName}`, { headers });
        const { data } = await response.json();

        if (!data || data.length === 0) {
            const fallbackName = name.split(" ")[0];
            const encodedFallbackName = encodeURIComponent(fallbackName);
            const fallbackResponse = await fetch(`${apiUrl}?q=name:${encodedFallbackName}`, { headers });
            const fallbackData = await fallbackResponse.json();

            if (!fallbackData.data || fallbackData.data.length === 0) {
                cardContainer.innerHTML = "No cards found.";
                return;
            }

            totalCards = fallbackData.data.length;
            collectedCount = 0;
            cardContainer.innerHTML = "";
            history.pushState({ view: "cards", name: fallbackName }, "", `#cards/${fallbackName}`);

            fallbackData.data.forEach(card => renderCard(card, cardContainer));
            loadCollection();
            updateTitle();
            return;
        }

        totalCards = data.length;
        collectedCount = 0;
        cardContainer.innerHTML = "";
        history.pushState({ view: "cards", name: name }, "", `#cards/${name}`);

        data.forEach(card => renderCard(card, cardContainer));
        loadCollection();
        updateTitle();
    } catch (error) {
        cardContainer.innerHTML = "Failed to load cards.";
        console.error(error);
    }
}

function renderCard(card, container) {
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.dataset.cardId = card.id;
    cardElement.innerHTML = `
        <img src="${card.images.small}" alt="${card.name}">
        <p>Status: <span class="status">Not Collected</span></p>
        <p>Set: ${card.set.name}</p>
        <p>Number: ${card.number} / ${card.set.printedTotal || "Unknown"}</p>
        <p>Price Paid: <span class="price">-</span></p>
        <p>Grade: <span class="grade">-</span></p>
        <p class="not-authorized-message unauthorized">${userAuthorized ? "You are authorized to edit this card." : "You are not authorized to edit this card."}</p>
    `;

    const notAuthorizedMessage = cardElement.querySelector(".not-authorized-message");
    
    const loginButton = document.createElement("button");
    loginButton.classList.add("loginButton");
    loginButton.textContent = "Login with Google";
    loginButton.onclick = () => {
        signIn();
    };

    if (!userAuthorized) {
        cardElement.appendChild(loginButton);
    } else {
        loginButton.style.display = "none";
		updateCardClickability();
    }

    container.appendChild(cardElement);
    return notAuthorizedMessage;
}

async function loadCollection() {
    const response = await fetch(`${workerUrl}/getCollection`);
    const collection = await response.json();
    let totalPaidForSelectedCollection = 0;

    collectedCount = 0;

    document.querySelectorAll(".card").forEach(cardElement => {
        const cardId = cardElement.dataset.cardId;
        const cardData = collection.find(item => item.card_id === cardId);

        if (cardData) {
            updateCardStatus(cardElement, cardData);
            updateCardPriceAndGrade(cardElement, cardData);
            if (cardData.collected) {
                cardElement.classList.add("collected");
                collectedCount++;
            }
			const price = parseFloat(cardData.price);
            if (!isNaN(price)) {
                totalPaidForSelectedCollection += price;
            }
        }
    });
	updateTextContent("#total-paid", `$${totalPaidForSelectedCollection.toFixed(2)}`);
	updateTotalPrice(totalPaidForSelectedCollection);
    updateTitle();
}

function updateCardStatus(cardElement, cardData) {
    const statusText = cardData.collected && cardData.date ? `Collected on ${cardData.date}` : "Not Collected";
    cardElement.querySelector(".status").textContent = statusText;
}

function updateCardPriceAndGrade(cardElement, cardData) {
    cardElement.querySelector(".price").textContent = cardData.price || "-";
    cardElement.querySelector(".grade").textContent = cardData.grade || "-";
}

function updateTitle() {
    const h1 = document.querySelector("h1");
    if (totalCards > 0) {
        const titleText = `Collected ${collectedCount} out of ${totalCards}`;
        document.title = titleText;
        h1.textContent = titleText;
    }
}

function resetTitle() {
	const h1 = document.querySelector("h1");
    const titleText = "Card Collection Tracker";
	document.title = titleText;
    h1.textContent = titleText;
}

document.addEventListener("DOMContentLoaded", async function() {
    const hash = window.location.hash;
    if (hash.startsWith("#cards/")) {
        const name = decodeURIComponent(hash.split("/")[1]);
        history.replaceState({ view: "cards", name }, "", hash);
        await fetchCards(name);
    } else {
        history.replaceState({ view: "main" }, "", "#");
        await fetchAllPokemon();
    }

    await loadCollection();
    await getTotalPrice();
});

window.addEventListener("popstate", async (event) => {
    const hash = window.location.hash;

    if (!hash || hash === "#") {
        resetTitle();
        fetchAllPokemon();
        await loadCollection();
        await getTotalPrice();
    } else if (hash.startsWith("#cards/")) {
        const name = decodeURIComponent(hash.split("/")[1]);
        fetchCards(name);
    }
});