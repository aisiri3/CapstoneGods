import React, { useEffect, useRef } from 'react';

// Mapping between Rhubarb phonemes and your avatar's viseme indices
// These might need to be verified against your actual model
const PHONEME_TO_VISEME = {
  'A': 53,  // viseme_aa
  'B': 44,  // viseme_PP
  'C': 49,  // viseme_CH
  'D': 47,  // viseme_DD
  'E': 54,  // viseme_E
  'F': 45,  // viseme_FF
  'G': 48,  // viseme_kk
  'H': 46,  // viseme_TH
  'X': 43,  // viseme_sil (rest position)
};

// Increased for better visibility during testing
const VISEME_INTENSITY = 1.0;

export function LipSyncController({ meshRef, rhubarbData, isPlaying, audioElement }) {
  const currentVisemeRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const startTimeRef = useRef(0);
  const debugCounterRef = useRef(0);
  
  // Debug function to log morph target info
  useEffect(() => {
    if (meshRef.current) {
      console.log("LipSyncController received meshRef with:");
      console.log("- morphTargetDictionary:", meshRef.current.morphTargetDictionary);
      console.log("- Total morphTargetInfluences:", meshRef.current.morphTargetInfluences.length);
      
      // Log the first few indices to verify they exist
      if (meshRef.current.morphTargetInfluences) {
        console.log("- Sample morphTargetInfluences values:");
        for (let i = 40; i < 60; i++) {
          console.log(`  Index ${i}: ${meshRef.current.morphTargetInfluences[i]}`);
        }
      }
      
      // Log the actual viseme indices we'll be using
      console.log("Viseme indices to be used:");
      Object.entries(PHONEME_TO_VISEME).forEach(([phoneme, index]) => {
        console.log(`- ${phoneme}: ${index}`);
      });
    }
    
    if (rhubarbData) {
      console.log("LipSyncController received rhubarbData:", rhubarbData.slice(0, 3), "...");
    }
  }, [meshRef, rhubarbData]);
  
  // Reset all visemes
  const resetVisemes = () => {
    if (!meshRef.current?.morphTargetInfluences) {
      console.log("Cannot reset visemes, meshRef or morphTargetInfluences not available");
      return;
    }
    
    Object.values(PHONEME_TO_VISEME).forEach(visemeIndex => {
      try {
        meshRef.current.morphTargetInfluences[visemeIndex] = 0;
      } catch (e) {
        console.error(`Error resetting viseme at index ${visemeIndex}:`, e);
      }
    });
  };

  // Set a specific viseme
  const setViseme = (phoneme, visemeIndex, intensity = VISEME_INTENSITY) => {
    if (!meshRef.current?.morphTargetInfluences) {
      console.log("Cannot set viseme, meshRef or morphTargetInfluences not available");
      return;
    }
    
    try {
      // Log every 10th viseme change to avoid flooding the console
      if (debugCounterRef.current % 10 === 0) {
        console.log(`Setting viseme for phoneme ${phoneme} at index ${visemeIndex} to intensity ${intensity}`);
      }
      debugCounterRef.current++;
      
      // Only reset the lip-related visemes, not other facial expressions
      Object.entries(PHONEME_TO_VISEME).forEach(([p, idx]) => {
        try {
          meshRef.current.morphTargetInfluences[idx] = 0;
        } catch (e) {
          console.error(`Error resetting viseme at index ${idx}:`, e);
        }
      });
      
      // Set the new viseme
      meshRef.current.morphTargetInfluences[visemeIndex] = intensity;
      currentVisemeRef.current = visemeIndex;
      
      // Manually trigger an update if needed
      if (meshRef.current.needsUpdate !== undefined) {
        meshRef.current.needsUpdate = true;
      }
    } catch (e) {
      console.error(`Error setting viseme at index ${visemeIndex}:`, e);
    }
  };
  
  // Main animation effect
  useEffect(() => {
    // Guard clauses with detailed logging
    if (!meshRef.current) {
      console.log("LipSync animation not starting: meshRef.current is null");
      return;
    }
    if (!rhubarbData || !rhubarbData.length) {
      console.log("LipSync animation not starting: rhubarbData is empty or null");
      return;
    }
    if (!isPlaying) {
      console.log("LipSync animation not starting: isPlaying is false");
      return;
    }
    if (!audioElement) {
      console.log("LipSync animation not starting: audioElement is null");
      return;
    }
    
    console.log("Starting lipsync animation with data:", rhubarbData.length, "mouth cues");
    
    // Always reset visemes before starting new animation
    resetVisemes();
    
    // Set the start time based on audio's current time
    startTimeRef.current = performance.now() - (audioElement.currentTime * 1000);
    
    // Animation function
    const animate = (currentTime) => {
      if (!meshRef.current || !audioElement) {
        console.log("Animation frame canceled: meshRef or audioElement no longer available");
        return;
      }
      
      // Calculate elapsed time from the start of audio playback
      const elapsed = currentTime - startTimeRef.current;
      
      // Every second, log the elapsed time for debugging
      if (Math.floor(elapsed / 1000) !== Math.floor((elapsed - 16) / 1000)) {
        console.log(`LipSync elapsed time: ${(elapsed/1000).toFixed(2)}s, Audio time: ${audioElement.currentTime.toFixed(2)}s`);
      }
      
      // Find current mouth shape based on elapsed time
      const currentMark = rhubarbData.find((mark, index) => {
        const nextMark = rhubarbData[index + 1];
        if (!nextMark) return elapsed >= mark.start * 1000;
        return elapsed >= mark.start * 1000 && elapsed < nextMark.start * 1000;
      });
      
      if (currentMark) {
        const visemeIndex = PHONEME_TO_VISEME[currentMark.value];
        if (visemeIndex !== undefined && visemeIndex !== currentVisemeRef.current) {
          setViseme(currentMark.value, visemeIndex);
        }
      } else if (debugCounterRef.current % 30 === 0) {
        console.log("No matching mouth cue found for time:", elapsed);
      }
      
      // Check if animation should continue
      if (isPlaying && audioElement && !audioElement.paused && !audioElement.ended) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        console.log("Animation stopping:", { 
          isPlaying, 
          audioElement: !!audioElement,
          isPaused: audioElement?.paused,
          isEnded: audioElement?.ended
        });
        resetVisemes();
      }
    };
    
    // Start animation
    animationFrameIdRef.current = requestAnimationFrame(animate);
    console.log("First animation frame requested:", animationFrameIdRef.current);
    
    // Cleanup
    return () => {
      console.log("LipSync animation cleanup triggered");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      resetVisemes();
    };
  }, [meshRef, rhubarbData, isPlaying, audioElement]);
  
  // Additional effect to handle audio playback state changes
  useEffect(() => {
    if (!audioElement) {
      console.log("Audio event listeners not added: audioElement is null");
      return;
    }
    
    console.log("Adding audio event listeners");
    
    const handlePlay = () => {
      console.log("Audio play event received");
      // Reset the start time when audio starts playing
      startTimeRef.current = performance.now() - (audioElement.currentTime * 1000);
      
      // Start animation if it's not already running
      if (!animationFrameIdRef.current && rhubarbData && rhubarbData.length > 0) {
        console.log("Restarting animation from audio play event");
        animationFrameIdRef.current = requestAnimationFrame(function animate(time) {
          // Calculate elapsed time from the start of audio playback
          const elapsed = time - startTimeRef.current;
          
          // Find current mouth shape based on elapsed time
          const currentMark = rhubarbData.find((mark, index) => {
            const nextMark = rhubarbData[index + 1];
            if (!nextMark) return elapsed >= mark.start * 1000;
            return elapsed >= mark.start * 1000 && elapsed < nextMark.start * 1000;
          });
          
          if (currentMark) {
            const visemeIndex = PHONEME_TO_VISEME[currentMark.value];
            if (visemeIndex !== undefined && visemeIndex !== currentVisemeRef.current) {
              setViseme(currentMark.value, visemeIndex);
            }
          }
          
          // Continue the animation loop
          if (audioElement && !audioElement.paused && !audioElement.ended) {
            animationFrameIdRef.current = requestAnimationFrame(animate);
          } else {
            console.log("Animation stopping from play handler");
            resetVisemes();
          }
        });
      }
    };
    
    const handlePause = () => {
      console.log("Audio pause event received");
      // Cancel animation when audio is paused
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      resetVisemes();
    };
    
    const handleEnded = () => {
      console.log("Audio ended event received");
      // Cancel animation when audio ends
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      resetVisemes();
    };
    
    // Add event listeners
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    
    // Cleanup
    return () => {
      console.log("Removing audio event listeners");
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement, rhubarbData]);
  
  return null; // This is a controller component, so it doesn't render anything
}