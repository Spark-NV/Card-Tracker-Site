function openEditMenu(cardId) {
	
    if (!isAuthorized()) {
        alert("You must be logged in to edit this card.");
		initGoogleSignIn();
        return;
    }

    const cardElement = document.querySelector(`[data-card-id='${cardId}']`);
    const status = cardElement.querySelector(".status").textContent.replace(/ on .*/, "");
    const price = cardElement.querySelector(".price").textContent;
    const grade = cardElement.querySelector(".grade").textContent;
    const date = status.includes("Collected") ? new Date().toISOString().split("T")[0] : "";

    const menu = document.createElement("div");
    menu.className = "edit-menu";
    menu.innerHTML = `
        <h3>Edit Details</h3>
        ${createEditField("status-select", "Status", ["Collected", "Not Collected"], status, "select")}
        ${createEditField("price-input", "Price Paid", null, price, "text")}
        ${createEditField("grade-input", "Grade", null, grade, "text")}
        ${createEditField("date-input", "Date Collected", null, date, "date")}
        <button onclick="saveDetails('${cardId}')" class="button">Save</button>
        <button onclick="closeEditMenu()" class="button cancel">Cancel</button>
    `;
    document.body.appendChild(menu);
}

function createEditField(id, label, options, value, type = "select") {
    if (type === "select") {
        const optionsHtml = options ? options.map(option => 
            `<option value="${option}" ${value === option ? "selected" : ""}>${option}</option>`).join('') : '';
        return `
            <label>${label}: 
                <select id="${id}">
                    ${optionsHtml}
                </select>
            </label>
        `;
    } else {
        return `
            <label>${label}: 
                <input type="${type}" id="${id}" value="${value}">
            </label>
        `;
    }
}

function closeEditMenu() {
    document.querySelector(".edit-menu").remove();
}

async function saveDetails(cardId) {
    if (!isAuthorized()) {
        alert("You must be logged in to edit this card.");
        initGoogleSignIn();
        return;
    }

    const status = document.getElementById("status-select").value;
    const price = document.getElementById("price-input").value;
    const grade = document.getElementById("grade-input").value;
    const date = document.getElementById("date-input").value;

    const cardElement = document.querySelector(`[data-card-id='${cardId}']`);
    const statusText = status === "Collected" && date ? `Collected on ${date}` : status;
    cardElement.querySelector(".status").textContent = statusText;
    cardElement.querySelector(".price").textContent = price;
    cardElement.querySelector(".grade").textContent = grade;

    const isCollected = status === "Collected";
    cardElement.classList.toggle("collected", isCollected);
    collectedCount += isCollected ? 1 : -1;
    updateTitle();
    closeEditMenu();

    try {
        const response = await fetch(`${workerUrl}/updateCollection`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${googleUserToken}` 
            },
            body: JSON.stringify({
                card_id: cardId,
                collected: isCollected,
                price,
                grade,
                date
            })
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Error saving details:", errorDetails);
            alert("Failed to save card details. Please try again.");
        }
    } catch (error) {
        console.error("Error saving details:", error);
        alert("An error occurred while saving card details.");
    }
}
