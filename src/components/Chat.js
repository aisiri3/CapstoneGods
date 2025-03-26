"use client";

import { useRef, useEffect, useState } from "react";
import useFillerManager from "./FillerManager";
import "@/styles/Chat.css";

export default function Chat({ onAvatarStateChange }) {
  const inputFieldRef = useRef(null);
  const conversationBoxRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const introDisplayedRef = useRef(false);
  const [inputError, setInputError] = useState("");
  
  // Debug counter to track component renders
  const renderCountRef = useRef(0);

  // State to store current avatar selection
  const [avatarSelection, setAvatarSelection] = useState({
    gender: "Male", 
    persona: "Casual", 
    language: "English"
  });

  // Initialize the filler manager with our avatar state callback
  const fillerManager = useFillerManager(onAvatarStateChange);
  
  // Define intro messages based on language and persona
  const introMessages = {
    English: {
      Formal: "Hello! I’m here to assist you in your language learning journey. Please feel free to ask me anything in the format of “How can I…” For instance, you might ask, “How can I ask someone for the project update?” and I’ll provide you with helpful guidance. Let’s begin!",
      Casual: "Hey there! I'm here to help you with your language learning journey. Feel free to ask me anything in the format of 'How can I...' For example, you can ask 'How can I order coffee?' and I'll provide you with the answer. Let's get started!"
    },
    Malay: {
      Formal: "Helo! Saya di sini untuk membantu anda dalam perjalanan pembelajaran bahasa anda. Jangan segan untuk bertanya apa sahaja dalam format “Bagaimana saya boleh…” Sebagai contoh, anda mungkin bertanya, “Bagaimana saya boleh meminta kemas kini projek daripada seseorang?” dan saya akan memberikan panduan yang berguna. Mari kita mulakan!",
      Casual: "Hai! Saya di sini untuk membantu anda dalam perjalanan pembelajaran bahasa anda. Jangan ragu untuk bertanya apa sahaja dalam format “Bagaimana saya boleh…” Sebagai contoh, anda boleh bertanya “Bagaimana saya boleh memesan kopi?” dan saya akan memberikan jawapannya. Jom mulakan!"
    }
  };

  // Update fillerManager's processing state when isProcessing changes
  useEffect(() => {
    fillerManager.setIsProcessing(isProcessing);
  }, [isProcessing, fillerManager]);

  // Debug: Track renders
  useEffect(() => {
    renderCountRef.current++;
  });

  // Get intro message based on current selection
  const getIntroMessage = () => {
    const { language, persona } = avatarSelection;
    console.log(`Getting intro message for: ${language}, ${persona}`);
    
    const formalKey = persona === "Professional" ? "Formal" : "Casual";
    const message = introMessages[language]?.[formalKey] || introMessages.English.Casual;
    
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
      console.log("Chat messages cleared");
    }
  };

  // Listen for changes in avatar selection
  useEffect(() => {
    const handleSelectionChange = (event) => {
      console.log("Chat received avatar selection change:", event.detail);
      
      // Clear chat completely when selection changes
      clearChat();
      
      // Update avatar selection - use the exact event detail to maintain original behavior
      setAvatarSelection(event.detail);
      
      // Reset intro state to trigger new intro message
      setIntroPlayed(false);
      introDisplayedRef.current = false;
      
      // Stop any current fillers
      fillerManager.stopAllFillers();
    };

    window.addEventListener('avatarSelectionChanged', handleSelectionChange);

    return () => {
      window.removeEventListener('avatarSelectionChanged', handleSelectionChange);
    };
  }, [fillerManager]);

  // Load fillers when avatar selection changes
  useEffect(() => {
    fillerManager.loadFillerData(avatarSelection).catch(err => {
      console.error("Error loading fillers after selection change:", err);
    });
  }, [avatarSelection, fillerManager]);

  // Function to display the intro message in the chatbox
  const displayIntroMessage = () => {
    if (!conversationBoxRef.current || introDisplayedRef.current) {
      console.log("Skipping intro display: already displayed or no conversation box");
      return;
    }
    
    // Mark as displayed immediately to prevent duplicate displays
    introDisplayedRef.current = true;
    
    // Get the intro message
    const introMessage = getIntroMessage();
    
    console.log(`Displaying intro message: "${introMessage}" for ${avatarSelection.language}, ${avatarSelection.persona}`);
    
    const botDiv = document.createElement("div");
    botDiv.className = "outputMessage";
    botDiv.innerText = introMessage;
    conversationBoxRef.current.prepend(botDiv);
    conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
  };

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
      console.log("Current avatar selection for intro:", JSON.stringify(avatarSelection));
      
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
    introDisplayedRef.current = false;
    setIntroPlayed(false);
    
    // Load fillers when component mounts
    fillerManager.loadFillerData(avatarSelection).catch(err => {
      console.error("Error loading initial fillers:", err);
    });
    
    return () => {
      console.log("Chat component unmounting - cleaning up resources");
      cleanupPreviousAudio();
    };
  }, []); // Empty dependency array - only runs once

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

  // Function to validate the user input
  const validateInput = (text) => {
    // Check if input is empty or only contains whitespace
    if (!text || text.trim() === '') {
      return false;
    }
    
    // Check if input contains at least one alphabetic character
    return /[a-zA-Z]/.test(text);
  };

  const sendMessage = async () => {
    const userMessage = inputFieldRef.current.value;
    
    // Clear any previous error messages
    setInputError("");
    
    // Validate the input
    if (!validateInput(userMessage)) {
      setInputError("Please include some text in your message.");
      return;
    }

    if (userMessage && !isProcessing) {
      // Set processing state
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
      
      // Start playing fillers while waiting for the response
      fillerManager.startFillers();

      try {
        // Send message to server and get response
        const response = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: userMessage,
            avatarConfig: avatarSelection
          })
        });

        const data = await response.json();
        
        // Log the received data
        console.log("Received data from backend:", {
          responseTextLength: data.response ? data.response.length : 0,
          audioAvailable: !!data.audio,
          mouthCuesLength: data.mouthCues ? data.mouthCues.length : 0
        });
        
        // Prepare the audio URL
        cleanupPreviousAudio();
        const audioUrl = createAudioBlobUrl(data.audio);
        setCurrentAudioUrl(audioUrl);
        
        // Create response data object
        const responseData = {
          lipSync: data.mouthCues,
          audioUrl: audioUrl,
          response: data.response,
          isFiller: false
        };
        
        // Signal that processing is done
        setIsProcessing(false);
        
        // Remove loading message
        if (conversationBoxRef.current.firstChild && conversationBoxRef.current.firstChild.classList.contains('loadingMessage')) {
          conversationBoxRef.current.removeChild(conversationBoxRef.current.firstChild);
        }

        // Display bot's response in chat
        const botDiv = document.createElement("div");
        botDiv.className = "outputMessage";
        botDiv.innerText = data.response;
        conversationBoxRef.current.prepend(botDiv);
        
        // Queue the response - the filler manager will handle the transition
        fillerManager.queueResponse(responseData);

        // Scroll to bottom again
        conversationBoxRef.current.scrollTop = conversationBoxRef.current.scrollHeight;
      } catch (error) {
        console.error("Error processing message:", error);
        
        // Stop playing fillers
        await fillerManager.stopAllFillers();
        
        // Remove loading message
        if (conversationBoxRef.current.firstChild && conversationBoxRef.current.firstChild.classList.contains('loadingMessage')) {
          conversationBoxRef.current.removeChild(conversationBoxRef.current.firstChild);
        }
        
        // Display error message
        const errorDiv = document.createElement("div");
        errorDiv.className = "errorMessage";
        errorDiv.innerText = "Sorry, there was an error processing your message.";
        conversationBoxRef.current.prepend(errorDiv);
        
        // Set processing to false
        setIsProcessing(false);
      }
    }
  };

  // Handle input changes to clear error when user types
  const handleInputChange = () => {
    if (inputError) {
      setInputError("");
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
          onChange={handleInputChange}
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
      {inputError && (
        <div className="inputErrorMessage">
          {inputError}
        </div>
      )}
    </div>
  );
}