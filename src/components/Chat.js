"use client";

import { useRef, useEffect, useState } from "react";
import "@/styles/Chat.css";

export default function Chat({ onAvatarStateChange }) {
  const inputFieldRef = useRef(null);
  const conversationBoxRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [lastSelection, setLastSelection] = useState(null);

  // State to store current avatar selection
  const [avatarSelection, setAvatarSelection] = useState({
    gender: "Male", 
    persona: "Casual", 
    language: "English"
  });

  // Define intro messages based on language and persona
  const introMessages = {
    English: {
      Formal: "Nice to meet you! Shall we have a formal discussion?",
      Casual: "Hello, let's have a simple, casual conversation."
    },
    Malay: {
      Formal: "To be confirmed: Malay formal intro.",
      Casual: "To be confirmed: Malay casual intro."
    }
  };

  // Get intro message based on current selection
  const getIntroMessage = () => {
    const { language, persona } = avatarSelection;
    const formalKey = persona === "Professional" ? "Formal" : "Casual";
    return introMessages[language]?.[formalKey] || introMessages.English.Casual;
  };

  // Load initial avatar selection from localStorage
  useEffect(() => {
    try {
      const storedSelections = JSON.parse(localStorage.getItem("userSelections"));
      if (storedSelections) {
        setAvatarSelection(storedSelections);
        setLastSelection(storedSelections);
      }
    } catch (error) {
      console.error("Error loading stored selections:", error);
    }
  }, []);

  // Function to clear all messages in the chat
  const clearChat = () => {
    if (conversationBoxRef.current) {
      // Remove all messages
      while (conversationBoxRef.current.firstChild) {
        conversationBoxRef.current.removeChild(conversationBoxRef.current.firstChild);
      }
    }
  };

  // Listen for changes in avatar selection
  useEffect(() => {
    const handleSelectionChange = (event) => {
      console.log("Chat received avatar selection change:", event.detail);
      
      // Clear chat completely when selection changes
      clearChat();
      
      // Update avatar selection
      setAvatarSelection(event.detail);
      
      // Reset intro state to trigger new intro message
      setIntroPlayed(false);
      
      // Store the last selection to compare
      setLastSelection(event.detail);
    };

    window.addEventListener('avatarSelectionChanged', handleSelectionChange);

    return () => {
      window.removeEventListener('avatarSelectionChanged', handleSelectionChange);
    };
  }, []);

  // Function to display the intro message in the chatbox
  const displayIntroMessage = () => {
    if (!conversationBoxRef.current) return;
    
    const introMessage = getIntroMessage();
    const botDiv = document.createElement("div");
    botDiv.className = "outputMessage";
    botDiv.innerText = introMessage;
    conversationBoxRef.current.prepend(botDiv);
    conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
  };

  // Use useEffect to trigger the intro message when component mounts or selection changes
  useEffect(() => {
    if (!introPlayed) {
      displayIntroMessage();
      setIntroPlayed(true);
    }
  }, [introPlayed, avatarSelection]);

  // Function to convert base64 to blob URL
  const createAudioBlobUrl = (base64AudioData) => {
    if (!base64AudioData) return null;
    
    // Convert base64 to blob
    const byteCharacters = atob(base64AudioData);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });
    
    // Create and return blob URL
    return URL.createObjectURL(blob);
  };

  // Clean up previous audio URL if it exists
  const cleanupPreviousAudio = () => {
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
    }
  };

  const sendMessage = async () => {
    const userMessage = inputFieldRef.current.value;

    if (userMessage && !isProcessing) {
      setIsProcessing(true);
      
      // Display user's message in chat
      const userDiv = document.createElement("div");
      userDiv.className = "userMessage";
      userDiv.innerText = userMessage;
      conversationBoxRef.current.prepend(userDiv);
      
      // Clear input field
      inputFieldRef.current.value = "";

      // Scroll to bottom to show the latest message
      conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;

      try {
        // Send message to server and handle the response
        const response = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: userMessage,
            avatarConfig: avatarSelection // Send current avatar config to backend
          })
        });

        const data = await response.json();
        
        // Log the received data for debugging
        console.log("CHAT.JS: Received data from backend:", {
          responseTextLength: data.response ? data.response.length : 0,
          audioAvailable: !!data.audio,
          mouthCuesLength: data.mouthCues ? data.mouthCues.length : 0
        });

        // Display bot's response in chat
        const botDiv = document.createElement("div");
        botDiv.className = "outputMessage";
        botDiv.innerText = data.response;
        conversationBoxRef.current.prepend(botDiv);

        // Clean up previous audio if any
        cleanupPreviousAudio();
        
        // Create a blob URL from the base64 audio
        const audioUrl = createAudioBlobUrl(data.audio);
        setCurrentAudioUrl(audioUrl);
        
        // Update the parent component with lipsync data and audio URL
        if (onAvatarStateChange && typeof onAvatarStateChange === 'function') {
          onAvatarStateChange({
            lipSync: data.mouthCues,
            audioUrl: audioUrl,
            response: data.response
          });
        }

        // Scroll to bottom again
        conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
      } catch (error) {
        console.error("Error processing message:", error);
        // Display error message
        const errorDiv = document.createElement("div");
        errorDiv.className = "errorMessage";
        errorDiv.innerText = "Sorry, there was an error processing your message.";
        conversationBoxRef.current.prepend(errorDiv);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupPreviousAudio();
    };
  }, []);

  return (
    <div className="chatBox">
      <div className="messagesContainer" ref={conversationBoxRef}></div>
      <div className="inputArea">
        <input 
          type="text"
          className="userInput"
          ref={inputFieldRef}
          placeholder="Enter your message..."
          onKeyDown={(e) => e.key === "Enter" && !isProcessing && sendMessage()}
          disabled={isProcessing}
        />
        <button 
          className="button" 
          onClick={sendMessage}
          disabled={isProcessing}
        >
          {/* TODO: Replace with loading icon within chat */}
          {isProcessing ? '......' : 'SEND'}
        </button>
      </div>
    </div>
  );
}