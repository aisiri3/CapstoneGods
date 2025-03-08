import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Mapping between Rhubarb phonemes and your avatar's viseme indices
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

// Strength of the mouth movements
const VISEME_INTENSITY = 1.5;
// Smoothing factor (lower = smoother but slower transitions) -- find the sweet spot
const SMOOTHING_FACTOR = 0.4;

export function LipSyncController({ meshRef, rhubarbData, isPlaying, audioElement }) {
  const animationFrameIdRef = useRef(null);
  const startTimeRef = useRef(0);
  const lastVisemeRef = useRef(null);
  
  // Function to update visemes on each frame
  const updateVisemes = (time) => {
    if (!meshRef.current?.morphTargetInfluences || !audioElement || !rhubarbData || rhubarbData.length === 0) {
      return;
    }
    
    // If audio isn't playing, reset and return
    if (!isPlaying || audioElement.paused || audioElement.ended) {
      // Reset all visemes with smoothing
      Object.values(PHONEME_TO_VISEME).forEach(visemeIndex => {
        if (meshRef.current.morphTargetInfluences[visemeIndex] !== undefined) {
          meshRef.current.morphTargetInfluences[visemeIndex] = 
            THREE.MathUtils.lerp(
              meshRef.current.morphTargetInfluences[visemeIndex], 
              0, 
              SMOOTHING_FACTOR
            );
        }
      });
      
      // Continue animation loop until all visemes are close to 0
      const hasActiveViseme = Object.values(PHONEME_TO_VISEME).some(
        index => meshRef.current.morphTargetInfluences[index] > 0.01
      );
      
      if (hasActiveViseme) {
        animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
      } else {
        animationFrameIdRef.current = null;
      }
      return;
    }
    
    // Calculate time since audio started
    const audioTime = audioElement.currentTime;
    
    // First reset all visemes with smooth transitions
    Object.values(PHONEME_TO_VISEME).forEach(visemeIndex => {
      if (meshRef.current.morphTargetInfluences[visemeIndex] !== undefined) {
        meshRef.current.morphTargetInfluences[visemeIndex] = 
          THREE.MathUtils.lerp(
            meshRef.current.morphTargetInfluences[visemeIndex], 
            0, 
            SMOOTHING_FACTOR
          );
      }
    });
    
    // Find current mouth shape based on audio time
    let currentMark = null;
    for (let i = 0; i < rhubarbData.length; i++) {
      const mark = rhubarbData[i];
      if (audioTime >= mark.start && audioTime <= mark.end) {
        currentMark = mark;
        break;
      }
    }
    
    // Apply the current viseme with smooth transition
    if (currentMark) {
      const targetVisemeIndex = PHONEME_TO_VISEME[currentMark.value];
      
      if (targetVisemeIndex !== undefined) {
        // Only update if we have a valid index
        meshRef.current.morphTargetInfluences[targetVisemeIndex] = 
          THREE.MathUtils.lerp(
            meshRef.current.morphTargetInfluences[targetVisemeIndex], 
            VISEME_INTENSITY, 
            SMOOTHING_FACTOR
          );
        
        lastVisemeRef.current = targetVisemeIndex;
      }
    }
    
    // Continue the animation loop
    animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
  };
  
  // Set up animation loop when component mounts or parameters change
  useEffect(() => {
    // Clean up any existing animation frame
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Only start animation if we have the necessary data
    if (meshRef.current && rhubarbData && rhubarbData.length > 0 && audioElement) {
      console.log("Starting lipsync animation loop with", rhubarbData.length, "mouth cues");
      
      // Start the animation loop
      animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
      
      // Set up audio event handlers for animation control
      const handlePlay = () => {
        if (!animationFrameIdRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
        }
      };
      
      const handlePause = () => {
        // Keep animation running to smoothly reset visemes
      };
      
      // Add event listeners
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      
      // Clean up
      return () => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
        
        // Reset all visemes immediately on unmount
        if (meshRef.current?.morphTargetInfluences) {
          Object.values(PHONEME_TO_VISEME).forEach(visemeIndex => {
            if (meshRef.current.morphTargetInfluences[visemeIndex] !== undefined) {
              meshRef.current.morphTargetInfluences[visemeIndex] = 0;
            }
          });
        }
      };
    }
  }, [meshRef, rhubarbData, isPlaying, audioElement]);
  
  return null; // This is a controller component, so it doesn't render anything
}