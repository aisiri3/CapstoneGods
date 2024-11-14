const placeholder_path = "/static/placeholder.mp4";
const intro_path = "/static/intro_english.mp4";

async function initializeApp() {
    const conversationBox = document.getElementById("messagesContainer");
    const avatarVideo = document.getElementById("avatarVideo");

    // display english introduction
    const data = await fetch('/initialize').then(response => response.json());
    displayMessage(data.intro_message, "outputMessage", conversationBox);
    playVideo(intro_path, false);

    avatarVideo.onended = () => playVideo(placeholder_path, true);
}

async function sendMessage() {
    const inputField = document.getElementById("userInput");
    const conversationBox = document.getElementById("messagesContainer");
    const userMessage = inputField.value;

    if (userMessage) {
        // display input msg
        displayMessage(userMessage, "userMessage", conversationBox);

        // // display loading
        displayMessage("Loading response...", "loadingMessage", conversationBox);

        // send to server and get response
        const data = await fetch('/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userMessage })
        }).then(response => response.json());

        // display response and play lipsync video
        replaceLoadingMessageWithResponse(data.response, conversationBox);
        playVideo("static/result_voice.mp4", false);

        avatarVideo.onended = () => playVideo(placeholder_path, true);
        inputField.value = "";
    }
}

async function replayLastResponse() {
    try {
        const response = await fetch("static/result_voice.mp4", { method: "HEAD" });
        if (response.ok) {
            playVideo("static/result_voice.mp4", false);
            console.log("Replaying the last response video.");
        }
        else {
            playVideo(intro_path, false);
            console.log("Replaying the introduction video.");
        }
    } catch (error) {
        console.error("No videos available.");
    }
}

function sendMessageOnEnter(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// helper functions
function displayMessage(text, className, container) {
    const messageDiv = document.createElement("div");
    messageDiv.className = className;
    messageDiv.innerText = text;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// replace loading icon with text output
function replaceLoadingMessageWithResponse(responseText, conversationBox) {
    const loadingMessage = conversationBox.querySelector('.loadingMessage');
    if (loadingMessage) {
        loadingMessage.innerText = responseText;
        loadingMessage.classList.remove('loadingMessage');
        loadingMessage.classList.add('outputMessage');
    }
}

function playVideo(src, loop = false) {
    const avatarVideo = document.getElementById("avatarVideo");
    avatarVideo.src = src;
    avatarVideo.loop = loop;
    avatarVideo.load();
    avatarVideo.play();
}

window.onload = initializeApp;
