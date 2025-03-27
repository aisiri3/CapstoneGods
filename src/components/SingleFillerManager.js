"use client";

import { useRef, useState, useEffect } from 'react';

export default function useSingleFillerManager(avatarStateCallback) {
  const [fillerData, setFillerData] = useState([]);
  const [isPlayingFiller, setIsPlayingFiller] = useState(false);
  const fillerAudioRef = useRef(null);
  const currentFillerIndexRef = useRef(0);
  const responseReadyRef = useRef(false);
  const pendingResponseRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  // Track audio elements for cleanup
  const createdAudioElementsRef = useRef([]);
  
  // Function to get filler path based on avatar selection
  const getFillerPath = (avatarSelection) => {
    const { language, gender, persona } = avatarSelection;
    
    const genderKey = gender.toLowerCase();
    const personaKey = persona === "Professional" ? "professional" : "casual";
    const languageKey = language.toLowerCase();

    const fillerPath = `/fillers/${languageKey}/${genderKey}_${personaKey}`;
    return fillerPath;
  };
  
  // Function to load filler data
  const loadFillerData = async (avatarSelection) => {
    try {
      const basePath = getFillerPath(avatarSelection);
      
      // First, fetch the index file that contains the list of available fillers
      const indexResponse = await fetch(`${basePath}/index.json`);
      
      if (!indexResponse.ok) {
        throw new Error(`No fillers found in path: ${indexResponse.statusText}`);
      }
      
      const indexData = await indexResponse.json();
      const fillerCount = indexData.count || 5; // Default to 5 if count is not provided
      
      // Load each filler's lipsync data
      const fillers = [];
      
      for (let i = 1; i <= fillerCount; i++) {
        try {
          // Construct URLs
          const audioUrl = `${basePath}/filler_${i}.wav`;
          const lipsyncUrl = `${basePath}/filler_${i}_lipsync.json`;
          
          const lipsyncResponse = await fetch(lipsyncUrl);
          
          if (!lipsyncResponse.ok) {
            console.warn(`Could not load lipsync for filler ${i}`);
            continue;
          }
          
          const lipsyncData = await lipsyncResponse.json();
          
          // Make sure we have mouth cues
          if (!lipsyncData.mouthCues || !Array.isArray(lipsyncData.mouthCues)) {
            console.warn(`Invalid lipsync data for filler ${i}`);
            continue;
          }
          
          // Check if audio file exists
          const audioResponse = await fetch(audioUrl, { method: 'HEAD' });
          
          if (!audioResponse.ok) {
            console.warn(`Could not load audio for filler ${i}`);
            continue;
          }
          
          fillers.push({
            audioUrl: audioUrl,
            lipsyncData: lipsyncData.mouthCues,
            index: i
          });
        } catch (error) {
          console.warn(`Error loading filler ${i}`);
        }
      }
      
      if (fillers.length === 0) {
        throw new Error("No valid fillers found");
      }
      
      setFillerData(fillers);
      return fillers;
    } catch (error) {
      console.error("Error loading filler data:", error);
      return [];
    }
  };
  
  // Function to clean up all audio resources
  const cleanupAudioResources = () => {
    // Clean up current audio
    if (fillerAudioRef.current) {
      fillerAudioRef.current.pause();
      fillerAudioRef.current.onended = null;
      fillerAudioRef.current.oncanplay = null;
      fillerAudioRef.current.onplay = null;
      fillerAudioRef.current.onerror = null;
      fillerAudioRef.current.onloadedmetadata = null;
      fillerAudioRef.current = null;
    }
    
    // Clean up all tracked audio elements
    createdAudioElementsRef.current.forEach(audio => {
      if (audio) {
        try {
          audio.pause();
          audio.onended = null;
          audio.oncanplay = null;
          audio.onplay = null;
          audio.onerror = null;
          audio.onloadedmetadata = null;
          audio.src = ""; // Clear the source
        } catch (e) {
          console.error("Error cleaning up audio element:", e);
        }
      }
    });
    
    // Clear the tracking array
    createdAudioElementsRef.current = [];
  };
  
  // Function to play a single filler
  const playSingleFiller = () => {
    if (fillerData.length === 0) {
      console.log("Cannot play filler - no fillers available");
      return;
    }
    
    if (isPlayingFiller) {
      stopFiller();
    }
    
    // Reset pending response
    pendingResponseRef.current = null;
    responseReadyRef.current = false;
    
    // Set the processing ref directly to ensure it's updated immediately
    isProcessingRef.current = true;
    
    // Set state for tracking in UI
    setIsPlayingFiller(true);
    
    // Get the current filler to play
    const fillerToPlay = fillerData[currentFillerIndexRef.current];
    
    if (!fillerToPlay) {
      console.error("No filler found at index", currentFillerIndexRef.current);
      currentFillerIndexRef.current = 0;
      
      if (fillerData.length > 0) {
        playSingleFiller(); // Try again with reset index
      } else {
        stopFiller();
      }
      return;
    }
    
    // Test if the audio file exists and is accessible
    fetch(fillerToPlay.audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load audio file: ${response.status}`);
        }
        
        // Send to avatar
        if (avatarStateCallback) {
          avatarStateCallback({
            lipSync: fillerToPlay.lipsyncData,
            audioUrl: fillerToPlay.audioUrl,
            response: "",
            isFiller: true
          });
        }
        
        // Clean up just the current audio element
        if (fillerAudioRef.current) {
          fillerAudioRef.current.pause();
          fillerAudioRef.current.onended = null;
          fillerAudioRef.current.onerror = null;
        }
        
        // Create tracking audio
        const audio = new Audio(fillerToPlay.audioUrl);
        audio.volume = 0.01; // Nearly silent
        
        // Track this audio element for cleanup
        createdAudioElementsRef.current.push(audio);
        
        // Set as current audio
        fillerAudioRef.current = audio;
        
        // When this filler ends, check if response is ready
        audio.onended = () => {
          console.log("Filler playback completed");
          // Increment to the next filler for next time
          currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
          
          // Remove this audio element from current reference
          fillerAudioRef.current = null;
          
          // If response is ready, transition to it
          if (responseReadyRef.current && pendingResponseRef.current) {
            console.log("Response is ready, transitioning");
            // Wait 1.5 seconds before playing response
            setTimeout(() => {
              // Reset states
              setIsPlayingFiller(false);
              responseReadyRef.current = false;
              
              // Clean up all audio resources before playing response
              cleanupAudioResources();
              
              // Send the response to avatar
              if (avatarStateCallback && pendingResponseRef.current) {
                console.log("Playing response after filler completed");
                avatarStateCallback(pendingResponseRef.current);
              }
              
              // Clear the pending response
              pendingResponseRef.current = null;
            }, 1500);
          } else {
            console.log("No response ready, stopping filler playback");
            // Just stop - we only play one filler
            setIsPlayingFiller(false);
          }
        };
        
        // Handle errors
        audio.onerror = (e) => {
          console.error("Audio error");
          fillerAudioRef.current = null;
          setIsPlayingFiller(false);
          
          // Increment to the next filler for next time
          currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
        };
        
        // Play the audio
        audio.play().catch((error) => {
          console.error("Error playing audio");
          fillerAudioRef.current = null;
          setIsPlayingFiller(false);
          
          // Increment to the next filler for next time
          currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
        });
      })
      .catch((error) => {
        console.error("Error fetching audio");
        setIsPlayingFiller(false);
        
        // Increment to the next filler for next time
        currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
      });
  };

  // Function to transition from filler to response
  const transitionToResponse = () => {
    // Only clean up if no filler is playing
    if (!fillerAudioRef.current) {
      console.log("No filler playing, transitioning after delay");
      // Wait 1.5 seconds before playing response
      setTimeout(() => {
        // Reset states
        setIsPlayingFiller(false);
        responseReadyRef.current = false;
        
        // Clean up all audio resources before playing response
        cleanupAudioResources();
        
        // Send the response to avatar
        if (avatarStateCallback && pendingResponseRef.current) {
          console.log("Playing queued response");
          avatarStateCallback(pendingResponseRef.current);
        } else {
          console.log("No pending response to play");
        }
        
        // Clear the pending response
        pendingResponseRef.current = null;
      }, 1500);
    } else {
      console.log("Filler is currently playing, will transition when it ends");
      // Let the current audio's onended handler handle the transition
      // No need to do anything here
    }
  };

  // Function to queue a response
  const queueResponse = (responseData) => {
    console.log("Response queued, isPlayingFiller:", isPlayingFiller);
    
    // Store the response
    pendingResponseRef.current = responseData;
    
    // Mark response as ready
    responseReadyRef.current = true;
    
    // If no filler is playing, transition immediately
    if (!isPlayingFiller || !fillerAudioRef.current) {
      console.log("No filler playing, transitioning immediately to response");
      transitionToResponse();
    } else {
      console.log("Filler is playing, will transition when it completes");
      // Otherwise, current filler will detect the ready response when it ends
    }
  };

  // Function to stop the filler
  const stopFiller = async () => {
    // Clear any pending response
    pendingResponseRef.current = null;
    responseReadyRef.current = false;
    
    // Clean up all audio resources
    cleanupAudioResources();
    
    // Update state
    setIsPlayingFiller(false);
    
    // Send a null update to avatar to reset its state
    if (avatarStateCallback) {
      avatarStateCallback({
        lipSync: null,
        audioUrl: null,
        response: "",
        isFiller: false
      });
    }
    
    // Add a forced delay before any future audio is sent
    return new Promise(resolve => setTimeout(resolve, 200));
  };
  
  // Alias for backward compatibility with FillerManager
  const stopAllFillers = stopFiller;

  // Function to tell the SingleFillerManager whether processing is happening
  const setIsProcessing = (isProcessing) => {
    isProcessingRef.current = isProcessing;
  };
  
  // Function to reset the filler index (for example, on avatar change)
  const resetSequence = () => {
    currentFillerIndexRef.current = 0;
    cleanupAudioResources();
  };
  
  // Cleanup function for unmounting
  useEffect(() => {
    return () => {
      stopFiller();
      cleanupAudioResources();
    };
  }, []);

  // Return the public API
  return {
    loadFillerData,
    playSingleFiller,
    stopFiller,
    stopAllFillers, // For backward compatibility
    setIsProcessing,
    queueResponse,
    resetSequence,
    isPlayingFiller,
    fillerData
  };
}