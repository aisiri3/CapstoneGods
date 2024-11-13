async function sendMessage() {
    const inputField = document.getElementById("userInput");
    const conversationBox = document.getElementById("messagesContainer");
    const userMessage = inputField.value;

    if (userMessage) {
        // display user's msg in chat
        const userDiv = document.createElement("div");
        userDiv.className = "userMessage";
        userDiv.innerText = userMessage;
        conversationBox.appendChild(userDiv);

        // scroll to bottom to show the latest message
        conversationBox.scrollTop = conversationBox.scrollHeight;

        // send message to server
        const response = await fetch('/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userMessage })
        });

        // get the response from server
        const data = await response.json();
        const outputMessage = data.response;

        // display response
        const botDiv = document.createElement("div");
        botDiv.className = "outputMessage";
        botDiv.innerText = outputMessage;
        conversationBox.appendChild(botDiv);
        conversationBox.scrollTop = conversationBox.scrollHeight;

        // update placeholder vid with lipsync vid 
        const avatarVideo = document.getElementById("avatarVideo");
        avatarVideo.src = "static/result_voice.mp4";
        avatarVideo.loop = false; // Play only once

        avatarVideo.onended = () => {
            // revert back to placeholder video once lipsync video finishes
            avatarVideo.src = "/static/placeholder.mp4";
            avatarVideo.loop = true;
        };

        // clear input field
        inputField.value = "";
    }
}

function replayLastResponse() {
    const avatarVideo = document.getElementById("avatarVideo");

    // Reload and play the last response video explicitly
    avatarVideo.src = "static/result_voice.mp4";  // Ensure the video source is set
    avatarVideo.loop = false;                      // Play only once
    avatarVideo.load();                            // Force reload of the video source
    avatarVideo.play();                            // Play the video

    console.log("Replaying the last response video.");

    // Handle end of video to revert to placeholder
    avatarVideo.onended = () => {
        avatarVideo.src = "/static/placeholder.mp4";  // Switch back to placeholder video
        avatarVideo.loop = true;                      // Loop the placeholder video
        avatarVideo.load();                           // Ensure placeholder reloads
        avatarVideo.play();                           // Play placeholder in a loop
    };
}

function sendMessageOnEnter(event) {
    // to send by pressing enter on keyboard
    if (event.key === "Enter") {
        sendMessage();
    }
}