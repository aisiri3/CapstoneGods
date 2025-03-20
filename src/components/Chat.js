"use client";

import { useRef, useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import "@/styles/Chat.css";

export default function Chat({ onAvatarStateChange }) {
  const inputFieldRef = useRef(null);
  const conversationBoxRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const introDisplayedRef = useRef(false);
  
  // Debug counter to track component renders
  const renderCountRef = useRef(0);

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

  // Debug: Track renders
  useEffect(() => {
    renderCountRef.current++;
    console.log(`Chat component rendered (${renderCountRef.current}) with selection:`, 
                avatarSelection.language, avatarSelection.persona);
  });

  // Get intro message based on current selection
  const getIntroMessage = () => {
    const { language, persona } = avatarSelection;
    console.log(`Getting intro message for: ${language}, ${persona}`);
    
    const formalKey = persona === "Professional" ? "Formal" : "Casual";
    const message = introMessages[language]?.[formalKey] || introMessages.English.Casual;
    
    console.log(`Selected intro message: "${message}"`);
    return message;
  };

  // Load initial avatar selection from localStorage
  useEffect(() => {
    try {
      const storedSelections = JSON.parse(localStorage.getItem("userSelections"));
      if (storedSelections) {
        console.log("Loading initial selection from localStorage:", storedSelections);
        setAvatarSelection(storedSelections);
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
      introDisplayedRef.current = false;
    };

    window.addEventListener('avatarSelectionChanged', handleSelectionChange);

    return () => {
      window.removeEventListener('avatarSelectionChanged', handleSelectionChange);
    };
  }, []);

  // Function to display the intro message in the chatbox
  const displayIntroMessage = () => {
    if (!conversationBoxRef.current || introDisplayedRef.current) {
      return;
    }
    
    // Mark as displayed immediately to prevent duplicate displays
    introDisplayedRef.current = true;
    
    // Get the intro message AFTER the state has been updated
    // This ensures we're using the current avatar selection
    const introMessage = getIntroMessage();
    
    console.log(`Displaying intro message: "${introMessage}" for ${avatarSelection.language}, ${avatarSelection.persona}`);
    
    const botDiv = document.createElement("div");
    botDiv.className = "outputMessage";
    botDiv.innerText = introMessage;
    conversationBoxRef.current.prepend(botDiv);
    conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
  };

  // Use separate effects for better control
  
  // First effect: Clear flags when selection changes
  useEffect(() => {
    console.log("Avatar selection changed to:", avatarSelection);
    
    // Only reset if it's not the initial render
    if (renderCountRef.current > 1) {
      console.log("Resetting intro flags due to selection change");
      introDisplayedRef.current = false;
      setIntroPlayed(false);
    }
  }, [avatarSelection]);

  // Second effect: Display intro when needed
  useEffect(() => {
    if (!introPlayed) {
      console.log("Intro not played yet, scheduling display...");
      
      // Use a small delay to ensure state has been updated properly
      const timer = setTimeout(() => {
        console.log("Now displaying intro message...");
        displayIntroMessage();
        setIntroPlayed(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [introPlayed, avatarSelection]);

  // Initialize on mount
  useEffect(() => {
    console.log("Chat component mounted");
    introDisplayedRef.current = false;
    setIntroPlayed(false);
    
    return () => {
      cleanupPreviousAudio();
    };
  }, []);

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
      
      // Create loading spinner element
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "outputMessage loadingMessage";
      
      // Create a span with CSS-only spinner
      const spinnerSpan = document.createElement("span");
      spinnerSpan.className = "spinner";
      
      loadingDiv.appendChild(spinnerSpan);
      conversationBoxRef.current.prepend(loadingDiv);
      
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

        // Remove loading message
        if (conversationBoxRef.current.firstChild && conversationBoxRef.current.firstChild.classList.contains('loadingMessage')) {
          conversationBoxRef.current.removeChild(conversationBoxRef.current.firstChild);
        }

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
        
        // Remove loading message
        if (conversationBoxRef.current.firstChild && conversationBoxRef.current.firstChild.classList.contains('loadingMessage')) {
          conversationBoxRef.current.removeChild(conversationBoxRef.current.firstChild);
        }
        
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
          SEND
        </button>
      </div>
    </div>
  );
}