"use client";

import { useRef, useState, useEffect } from 'react';

export default function useFillerManager(avatarStateCallback) {
  const [shortFillerData, setShortFillerData] = useState([]);
  const [longFillerData, setLongFillerData] = useState([]);
  const useShortFillerNextRef = useRef(true); // Track whether to use short or long next
  const [isPlayingFillers, setIsPlayingFillers] = useState(false);
  const fillerIntervalRef = useRef(null);
  const fillerAudioRef = useRef(null);
  const fillerQueueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const responseReadyRef = useRef(false);
  const pendingResponseRef = useRef(null);
  
  // Track audio elements created to ensure proper cleanup
  const createdAudioElementsRef = useRef([]);
  
  // Replace the single index with two separate indices
  const nextShortFillerIndexRef = useRef(0);
  const nextLongFillerIndexRef = useRef(0);
  
  // Function to get filler path based on avatar selection
  const getFillerPath = (avatarSelection) => {
    const { language, gender, persona } = avatarSelection;
    
    const genderKey = gender.toLowerCase();
    const personaKey = persona === "Professional" ? "professional" : "casual";
    const languageKey = language.toLowerCase();

    const fillerPath = `/fillers/${languageKey}/${genderKey}_${personaKey}`;
    return fillerPath;
  };
  
  const loadFillerData = async (avatarSelection) => {
    try {
      const basePath = getFillerPath(avatarSelection);
      // console.log(`Loading fillers from: ${basePath}`);
      
      // First, fetch the index file that contains the list of available fillers
      const indexResponse = await fetch(`${basePath}/index.json`);
      
      if (!indexResponse.ok) {
        throw new Error(`No fillers found in path: ${indexResponse.statusText}`);
      }
      
      const indexData = await indexResponse.json();
      const shortFillerCount = indexData.shortCount || 5; // Default to 5 if count is not provided
      const longFillerCount = indexData.longCount || 3; // Default to 3 if count is not provided
      
      // Load each filler's lipsync data
      const shortFillers = [];
      const longFillers = [];
      
      // Load short fillers
      for (let i = 1; i <= shortFillerCount; i++) {
        try {
          // Construct URLs
          const audioUrl = `${basePath}/filler_${i}.wav`;
          const lipsyncUrl = `${basePath}/filler_${i}_lipsync.json`;
          
          const lipsyncResponse = await fetch(lipsyncUrl);
          
          if (!lipsyncResponse.ok) {
            console.warn(`Could not load lipsync for short filler ${i}`);
            continue;
          }
          
          const lipsyncData = await lipsyncResponse.json();
          
          // Make sure we have mouth cues
          if (!lipsyncData.mouthCues || !Array.isArray(lipsyncData.mouthCues)) {
            console.warn(`Invalid lipsync data for short filler ${i}`);
            continue;
          }
          
          // Check if audio file exists
          const audioResponse = await fetch(audioUrl, { method: 'HEAD' });
          
          if (!audioResponse.ok) {
            console.warn(`Could not load audio for short filler ${i}`);
            continue;
          }
          
          shortFillers.push({
            audioUrl: audioUrl,
            lipsyncData: lipsyncData.mouthCues,
            isLong: false,
            index: i
          });
        } catch (error) {
          console.warn(`Error loading short filler ${i}`);
        }
      }
      
      // Load long fillers
      for (let i = 1; i <= longFillerCount; i++) {
        try {
          // Construct URLs
          const audioUrl = `${basePath}/filler_long_${i}.wav`;
          const lipsyncUrl = `${basePath}/filler_long_${i}_lipsync.json`;
          
          const lipsyncResponse = await fetch(lipsyncUrl);
          
          if (!lipsyncResponse.ok) {
            console.warn(`Could not load lipsync for long filler ${i}`);
            continue;
          }
          
          const lipsyncData = await lipsyncResponse.json();
          
          // Make sure we have mouth cues
          if (!lipsyncData.mouthCues || !Array.isArray(lipsyncData.mouthCues)) {
            console.warn(`Invalid lipsync data for long filler ${i}`);
            continue;
          }
          
          // Check if audio file exists
          const audioResponse = await fetch(audioUrl, { method: 'HEAD' });
          
          if (!audioResponse.ok) {
            console.warn(`Could not load audio for long filler ${i}`);
            continue;
          }
          
          longFillers.push({
            audioUrl: audioUrl,
            lipsyncData: lipsyncData.mouthCues,
            isLong: true,
            index: i
          });
        } catch (error) {
          console.warn(`Error loading long filler ${i}`);
        }
      }
      
      // setFillerData([...shortFillers, ...longFillers]);
      setShortFillerData(shortFillers);
      setLongFillerData(longFillers);
      
      // Return both types of fillers for convenience
      return { shortFillers, longFillers };
    } catch (error) {
      console.error("Error loading filler data:", error);
      return { shortFillers: [], longFillers: [] };
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
  
  const startFillers = () => {
    if (shortFillerData.length === 0 && longFillerData.length === 0) {
      console.log("Cannot start fillers - no fillers available");
      return;
    }
    
    if (isPlayingFillers) {
      stopAllFillers();
    }
    
    // Reset pending response
    pendingResponseRef.current = null;
    responseReadyRef.current = false;
    
    // Set the processing ref directly to ensure it's updated immediately
    isProcessingRef.current = true;
    
    // Set state for tracking in UI
    setIsPlayingFillers(true);
    
    // Clear the queue first
    fillerQueueRef.current = [];
    
    // Add the next filler to the queue based on the alternating pattern
    addNextFillerToQueue();
    
    // Start playing the first filler
    playNextFillerInQueue();
  };
  
  // New helper function to add the next appropriate filler to the queue
  const addNextFillerToQueue = () => {
    // First determine if we should use a short or long filler
    const useShortFiller = useShortFillerNextRef.current;
    
    // Toggle for next time
    useShortFillerNextRef.current = !useShortFillerNextRef.current;
    
    if (useShortFiller && shortFillerData.length > 0) {
      // Add a short filler
      const nextFillerToPlay = shortFillerData[nextShortFillerIndexRef.current];
      if (nextFillerToPlay) {
        fillerQueueRef.current.push(nextFillerToPlay);
        // Update index for next time
        nextShortFillerIndexRef.current = (nextShortFillerIndexRef.current + 1) % shortFillerData.length;
      } else if (longFillerData.length > 0) {
        // Fall back to long filler if no short fillers available
        const longFiller = longFillerData[nextLongFillerIndexRef.current];
        fillerQueueRef.current.push(longFiller);
        nextLongFillerIndexRef.current = (nextLongFillerIndexRef.current + 1) % longFillerData.length;
      }
    } else if (!useShortFiller && longFillerData.length > 0) {
      // Add a long filler
      const nextFillerToPlay = longFillerData[nextLongFillerIndexRef.current];
      if (nextFillerToPlay) {
        fillerQueueRef.current.push(nextFillerToPlay);
        // Update index for next time
        nextLongFillerIndexRef.current = (nextLongFillerIndexRef.current + 1) % longFillerData.length;
      } else if (shortFillerData.length > 0) {
        // Fall back to short filler if no long fillers available
        const shortFiller = shortFillerData[nextShortFillerIndexRef.current];
        fillerQueueRef.current.push(shortFiller);
        nextShortFillerIndexRef.current = (nextShortFillerIndexRef.current + 1) % shortFillerData.length;
      }
    } else if (shortFillerData.length > 0) {
      // Just use short filler if no long fillers at all
      const shortFiller = shortFillerData[nextShortFillerIndexRef.current];
      fillerQueueRef.current.push(shortFiller);
      nextShortFillerIndexRef.current = (nextShortFillerIndexRef.current + 1) % shortFillerData.length;
    } else if (longFillerData.length > 0) {
      // Just use long filler if no short fillers at all
      const longFiller = longFillerData[nextLongFillerIndexRef.current];
      fillerQueueRef.current.push(longFiller);
      nextLongFillerIndexRef.current = (nextLongFillerIndexRef.current + 1) % longFillerData.length;
    }
  };

  // Function to play the next filler in the queue
  const playNextFillerInQueue = () => {
    // If response is ready, don't start another filler
    if (responseReadyRef.current && pendingResponseRef.current) {
      transitionToResponse();
      return;
    }
    
    // If processing is complete and no response is pending, stop fillers
    if (!isProcessingRef.current && !pendingResponseRef.current) {
      stopAllFillers();
      return;
    }
    
    // If queue is empty, add the next filler from the sequence
    if (fillerQueueRef.current.length === 0) {
      // Use the helper function to add the next filler
      addNextFillerToQueue();
      
      // If queue is still empty after trying to add, return
      if (fillerQueueRef.current.length === 0) {
        return;
      }
    }
    
    // Get the next filler from the queue
    const nextFiller = fillerQueueRef.current.shift();
    
    if (!nextFiller) {
      return;
    }
        
    // Test if the audio file exists and is accessible
    fetch(nextFiller.audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load audio file: ${response.status}`);
        }
        
        // Send to avatar
        if (avatarStateCallback) {
          avatarStateCallback({
            lipSync: nextFiller.lipsyncData,
            audioUrl: nextFiller.audioUrl,
            response: "",
            isFiller: true
          });
        }
        
        // Clean up just the current audio element, not all resources
        if (fillerAudioRef.current) {
          fillerAudioRef.current.pause();
          fillerAudioRef.current.onended = null;
          fillerAudioRef.current.onerror = null;
        }
        
        // Create tracking audio
        const audio = new Audio(nextFiller.audioUrl);
        audio.volume = 0.01; // Nearly silent
        
        // Track this audio element for cleanup
        createdAudioElementsRef.current.push(audio);
        
        // Set as current audio
        fillerAudioRef.current = audio;
        
        // When this filler ends, check if response is ready or schedule next filler
        audio.onended = () => {
          // Remove this audio element from current reference
          fillerAudioRef.current = null;
          
          // If response is ready, transition to it
          if (responseReadyRef.current && pendingResponseRef.current) {
            transitionToResponse();
          } 
          // If still processing and no response is ready, play another filler
          else if (isProcessingRef.current) {
            // Schedule next filler after delay
            fillerIntervalRef.current = setTimeout(() => {
              // Check again after delay
              if (isProcessingRef.current || pendingResponseRef.current) {
                playNextFillerInQueue();
              } else {
                stopAllFillers();
              }
            }, 2000); // 2 second delay between fillers
          } 
          // Otherwise stop
          else {
            stopAllFillers();
          }
        };
        
        // Handle errors
        audio.onerror = (e) => {
          console.error("Audio error");
          fillerAudioRef.current = null;
          
          setTimeout(() => {
            if (isProcessingRef.current || pendingResponseRef.current) {
              playNextFillerInQueue();
            } else {
              stopAllFillers();
            }
          }, 500);
        };
        
        // Play the audio
        audio.play().catch((error) => {
          console.error("Error playing audio");
          fillerAudioRef.current = null;
          
          setTimeout(() => {
            if (isProcessingRef.current || pendingResponseRef.current) {
              playNextFillerInQueue();
            } else {
              stopAllFillers();
            }
          }, 500);
        });
      })
      .catch((error) => {
        console.error("Error fetching audio");
        
        setTimeout(() => {
          if (isProcessingRef.current || pendingResponseRef.current) {
            playNextFillerInQueue();
          } else {
            stopAllFillers();
          }
        }, 500);
      });
  };

  // Function to transition from fillers to response
  const transitionToResponse = () => {
    // Clear any pending timeouts
    if (fillerIntervalRef.current) {
      clearTimeout(fillerIntervalRef.current);
      fillerIntervalRef.current = null;
    }
    
    // If no filler is currently playing, wait 1.5 seconds then play response
    if (!fillerAudioRef.current) {
      setTimeout(() => {
        // Reset states
        setIsPlayingFillers(false);
        responseReadyRef.current = false;
        
        // Clean up all audio resources before playing response
        cleanupAudioResources();
        
        // Send the response to avatar
        if (avatarStateCallback && pendingResponseRef.current) {
          avatarStateCallback(pendingResponseRef.current);
        }
        
        // Clear the pending response
        pendingResponseRef.current = null;
      }, 1500);
      
      return;
    }
    
    // Otherwise, let the current filler finish naturally
    const currentAudio = fillerAudioRef.current;
    
    // Let the current filler finish naturally if it's playing
    currentAudio.onended = () => {
      // Wait 1.5 seconds before playing response
      setTimeout(() => {
        // Reset states
        setIsPlayingFillers(false);
        responseReadyRef.current = false;
        
        // Clean up all audio resources before playing response
        cleanupAudioResources();
        
        // Send the response to avatar
        if (avatarStateCallback && pendingResponseRef.current) {
          avatarStateCallback(pendingResponseRef.current);
        }
        
        // Clear the pending response
        pendingResponseRef.current = null;
      }, 1500);
    };
  };

  // Function to queue a response
  const queueResponse = (responseData) => {
    // Store the response
    pendingResponseRef.current = responseData;
    
    // Mark response as ready
    responseReadyRef.current = true;
    
    // If no fillers are playing, transition immediately
    if (!isPlayingFillers) {
      transitionToResponse();
    }
    // Otherwise, current filler will detect the ready response when it ends
  };

  // Function to stop all fillers immediately (used for cleanup)
  const stopAllFillers = async () => {
    // Clear any pending response
    pendingResponseRef.current = null;
    responseReadyRef.current = false;
    
    // Clear the queue
    fillerQueueRef.current = [];
    
    // Clean up all audio resources
    cleanupAudioResources();
    
    // Clear any pending timeouts
    if (fillerIntervalRef.current) {
      clearTimeout(fillerIntervalRef.current);
      fillerIntervalRef.current = null;
    }
    
    // Update state
    setIsPlayingFillers(false);
    
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

  // Function to tell the FillerManager whether processing is happening
  const setIsProcessing = (isProcessing) => {
    isProcessingRef.current = isProcessing;
  };
  
  // Function to reset the sequential playback (for example, on avatar change)
  const resetSequence = () => {
    nextShortFillerIndexRef.current = 0;
    nextLongFillerIndexRef.current = 0;
    useShortFillerNextRef.current = true; // Reset to starting with short fillers
    cleanupAudioResources();
  };
  
  // Cleanup function for unmounting
  useEffect(() => {
    return () => {
      stopAllFillers();
      cleanupAudioResources();
    };
  }, []);

  // Return the public API
  return {
    loadFillerData,
    startFillers,
    stopAllFillers,
    setIsProcessing,
    queueResponse,
    resetSequence,
    isPlayingFillers,
    shortFillerData,
    longFillerData
  };
}