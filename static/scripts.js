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
        await fetch('/play_audio', { method: 'POST' });

        // clear input field
        inputField.value = "";
    }
}

function sendMessageOnEnter(event) {
    // to send by pressing enter on keyboard
    if (event.key === "Enter") {
        sendMessage();
    }
}