"use client";

import { useRef, useEffect } from "react"; // Import useEffect
import "@/styles/Chat.css";

export default function Chat() {
  const inputFieldRef = useRef(null);
  const conversationBoxRef = useRef(null);

  // Function to play the intro audio
  // TODO: Set a different file for every persona
  // TODO: This should only play for every starting chat! Connect to DB
  const playIntroAudio = () => {
    const audio = new Audio("/audios/casual-female-intro.wav"); // Path to the intro audio
    audio.play();
  };

  // Function to display the intro message in the chatbox
  const displayIntroMessage = () => {
    const introMessage = "Hello! Let's have a simple, casual conversation.";
    const botDiv = document.createElement("div");
    botDiv.className = "outputMessage";
    botDiv.innerText = introMessage;
    conversationBoxRef.current.prepend(botDiv); // Prepend the intro message
    conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight; // Scroll to bottom
  };

  // Use useEffect to trigger the intro behavior when the component mounts
  useEffect(() => {
    playIntroAudio(); // Play the intro audio
    displayIntroMessage(); // Display the intro message
  }, []); // Empty dependency array ensures this runs only once on mount

  const sendMessage = async () => {
    const userMessage = inputFieldRef.current.value;

    if (userMessage) {
      // Display user's message in chat
      const userDiv = document.createElement("div");
      userDiv.className = "userMessage";
      userDiv.innerText = userMessage;
      conversationBoxRef.current.prepend(userDiv); // Prepend instead of append
      // Clear input field
      inputFieldRef.current.value = "";

      // Scroll to bottom to show the latest message
      conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;

      // Send message to server and handle the response
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMessage })
      });

      const data = await response.json();
      const botMessage = data.response;

      // Display bot's response
      const botDiv = document.createElement("div");
      botDiv.className = "outputMessage";
      botDiv.innerText = botMessage;
      conversationBoxRef.current.prepend(botDiv); // Prepend instead of append

      // Play audio response
      await fetch("/api/play_audio", { method: "POST" });

      // Scroll to bottom again
      conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
    }
  };

  return (
    <div className="chatBox">
        <div className="messagesContainer" ref={conversationBoxRef}></div>
        <div className="inputArea">
            <input type="text"
                className="userInput"
                ref={inputFieldRef}
                placeholder="Enter your message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="button" onClick={sendMessage}>SEND</button>
        </div>
    </div>
  );
}