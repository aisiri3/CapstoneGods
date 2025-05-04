"use client";

import { useRef, useState, useEffect } from 'react';

/**
 * SingleFillerManager Hook
 * 
 * Manages loading and playback of "filler" animations and audio for avatars
 * during processing states, and handles transitions between fillers and responses.
 * 
 * This hook provides functionality to:
 * - Load filler data based on avatar selection (language, gender, persona)
 * - Play single filler animations during response processing
 * - Queue and transition to real responses when ready
 * - Clean up audio resources properly
 */

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
      
      const indexResponse = await fetch(`${basePath}/index.json`);
      
      if (!indexResponse.ok) {
        throw new Error(`No fillers found in path: ${indexResponse.statusText}`);
      }
      
      const indexData = await indexResponse.json();
      const fillerCount = indexData.count || 5; // Default to 5 if count is not provided
      
      const fillers = [];
      
      for (let i = 1; i <= fillerCount; i++) {
        try {
          const audioUrl = `${basePath}/filler_${i}.wav`;
          const lipsyncUrl = `${basePath}/filler_${i}_lipsync.json`;
          
          const lipsyncResponse = await fetch(lipsyncUrl);
          
          if (!lipsyncResponse.ok) {
            continue;
          }
          
          const lipsyncData = await lipsyncResponse.json();
          
          if (!lipsyncData.mouthCues || !Array.isArray(lipsyncData.mouthCues)) {
            continue;
          }
          
          const audioResponse = await fetch(audioUrl, { method: 'HEAD' });
          
          if (!audioResponse.ok) {
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
    if (fillerAudioRef.current) {
      fillerAudioRef.current.pause();
      fillerAudioRef.current.onended = null;
      fillerAudioRef.current.oncanplay = null;
      fillerAudioRef.current.onplay = null;
      fillerAudioRef.current.onerror = null;
      fillerAudioRef.current.onloadedmetadata = null;
      fillerAudioRef.current = null;
    }
    
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
    
    createdAudioElementsRef.current = [];
  };
  
  // Function to play a single filler
  const playSingleFiller = () => {
    if (fillerData.length === 0) {
      return;
    }
    
    if (isPlayingFiller) {
      stopFiller();
    }
    
    pendingResponseRef.current = null;
    responseReadyRef.current = false;
    isProcessingRef.current = true;
    setIsPlayingFiller(true);
    
    const fillerToPlay = fillerData[currentFillerIndexRef.current];
    
    if (!fillerToPlay) {
      currentFillerIndexRef.current = 0;
      
      if (fillerData.length > 0) {
        playSingleFiller(); // Try again with reset index
      } else {
        stopFiller();
      }
      return;
    }
    
    fetch(fillerToPlay.audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load audio file: ${response.status}`);
        }
        
        if (avatarStateCallback) {
          avatarStateCallback({
            lipSync: fillerToPlay.lipsyncData,
            audioUrl: fillerToPlay.audioUrl,
            response: "",
            isFiller: true
          });
        }
        
        if (fillerAudioRef.current) {
          fillerAudioRef.current.pause();
          fillerAudioRef.current.onended = null;
          fillerAudioRef.current.onerror = null;
        }
        
        const audio = new Audio(fillerToPlay.audioUrl);
        audio.volume = 0.01; // Nearly silent
        
        createdAudioElementsRef.current.push(audio);
        fillerAudioRef.current = audio;
        
        audio.onended = () => {
          currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
          fillerAudioRef.current = null;
          
          if (responseReadyRef.current && pendingResponseRef.current) {
            setTimeout(() => {
              setIsPlayingFiller(false);
              responseReadyRef.current = false;
              
              cleanupAudioResources();
              
              if (avatarStateCallback && pendingResponseRef.current) {
                avatarStateCallback(pendingResponseRef.current);
              }
              
              pendingResponseRef.current = null;
            }, 1500);
          } else {
            setIsPlayingFiller(false);
          }
        };
        
        audio.onerror = (e) => {
          fillerAudioRef.current = null;
          setIsPlayingFiller(false);
          currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
        };
        
        audio.play().catch((error) => {
          fillerAudioRef.current = null;
          setIsPlayingFiller(false);
          currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
        });
      })
      .catch((error) => {
        setIsPlayingFiller(false);
        currentFillerIndexRef.current = (currentFillerIndexRef.current + 1) % fillerData.length;
      });
  };

  // Function to transition from filler to response
  const transitionToResponse = () => {
    if (!fillerAudioRef.current) {
      setTimeout(() => {
        setIsPlayingFiller(false);
        responseReadyRef.current = false;
        
        cleanupAudioResources();
        
        if (avatarStateCallback && pendingResponseRef.current) {
          avatarStateCallback(pendingResponseRef.current);
        }
        
        pendingResponseRef.current = null;
      }, 1500);
    }
  };

  // Function to queue a response
  const queueResponse = (responseData) => {
    pendingResponseRef.current = responseData;
    responseReadyRef.current = true;
    
    if (!isPlayingFiller || !fillerAudioRef.current) {
      transitionToResponse();
    }
  };

  // Function to stop the filler
  const stopFiller = async () => {
    pendingResponseRef.current = null;
    responseReadyRef.current = false;
    
    cleanupAudioResources();
    setIsPlayingFiller(false);
    
    if (avatarStateCallback) {
      avatarStateCallback({
        lipSync: null,
        audioUrl: null,
        response: "",
        isFiller: false
      });
    }
    
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