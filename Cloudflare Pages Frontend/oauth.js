userAuthorized = false;
const loginStateChangeEvent = new Event("loginStateChange");
let googleUserToken = "";
let isPrompting = false;

function loadGoogleApi() {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = initGoogleSignIn;
    document.head.appendChild(script);
}

function initGoogleSignIn() {
    if (!isPrompting) {
        isPrompting = true;
        google.accounts.id.initialize({
            client_id: "yourclientid.apps.googleusercontent.com",
            callback: handleCredentialResponse,
        });
        google.accounts.id.prompt({
            prompt_parent_id: "signinContainer",
            callback: (response) => {
                isPrompting = false;
                handleCredentialResponse(response);
            },
        });
    }
}

function handleCredentialResponse(response) {
    googleUserToken = response.credential;
    fetch("yourworkerurl.dev/authorize", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ credential: googleUserToken })
    })
        .then(res => res.json())
        .then(data => {
            if (data.authorized) {
                userAuthorized = true;
                document.dispatchEvent(loginStateChangeEvent);
				updateCardClickability();
            } else {
                userAuthorized = false;
                alert("Login failed!");
            }
        })
        .catch(error => {
            console.error("Error during authentication:", error);
            alert("An error occurred while authenticating.");
        });
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function signIn() {
    google.accounts.id.prompt();
}

document.addEventListener("DOMContentLoaded", function() {
    loadGoogleApi();
    updateSigninStatus();
});

document.addEventListener("loginStateChange", function() {
    console.log("Login state changed, re-rendering cards");
    loadCollection();
    updateSigninStatus();
    getTotalPrice();
});

function updateSigninStatus() {
    if (userAuthorized) {
        document.querySelectorAll(".loginButton").forEach(button => {
            button.style.display = "none";
        });
    } else {
        console.log("continue");
    }
}

function isAuthorized() {
    return userAuthorized;
}

function updateCardClickability() {
    const cardElements = document.querySelectorAll('.card');
    cardElements.forEach(cardElement => {
        const notAuthorizedMessage = cardElement.querySelector('.not-authorized-message');
        const loginButton = cardElement.querySelector('.loginButton');

        if (notAuthorizedMessage) {
            if (userAuthorized) {
                notAuthorizedMessage.textContent = "You are authorized to edit this card.";
                notAuthorizedMessage.classList.remove("unauthorized");
                notAuthorizedMessage.classList.add("authorized");
                if (loginButton) loginButton.style.display = "none";
            } else {
                notAuthorizedMessage.textContent = "You are not authorized to edit this card.";
                notAuthorizedMessage.classList.remove("authorized");
                notAuthorizedMessage.classList.add("unauthorized");
                if (loginButton) loginButton.style.display = "block";
            }
        }
        cardElement.onclick = () => openEditMenu(cardElement.dataset.cardId);
    });
}
