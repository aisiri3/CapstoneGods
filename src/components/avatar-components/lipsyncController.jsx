import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * LipSyncController - A React component that manages lip synchronization for 3D avatars
 * 
 * This system uses Rhubarb phoneme data to control morph targets on a 3D face mesh,
 * creating realistic lip movements that match speech audio. It supports both single
 * and multi-target morph configurations for complex mouth shapes, vowel enhancement
 * for better articulation, and natural transitions between phonemes.
 * 
 * The controller handles audio sync timing, smooth transitions between visemes,
 * anticipation of upcoming phonemes, proper handling of pauses in speech, and
 * automatic cleanup when unmounted.
 */

// Mapping between Rhubarb phonemes and avatar's viseme indices
// Supports both direct morphTarget indices and multi-target configurations
const PHONEME_TO_VISEME = {
  'A': {
    // "P" SOUND
    type: 'multi',
    targets: {
      'viseme_PP': 1.3,
    }
  },
  'B': {
    // "EE" SOUND
    type: 'multi',
    targets: {
      'mouthUpperUpLeft': 0.2,
      'mouthUpperUpRight': 0.2,
      'mouthLowerDownLeft': 0.4,
      'mouthLowerDownRight': 0.4,
      'viseme_I': 0.15,
    }
  },
  'C': 54,  // viseme_E
  'D': {
    // "AA" SOUND
    type: 'multi',
    targets: {
      'mouthUpperUpLeft': 0.2,
      'mouthUpperUpRight': 0.2,
      'viseme_aa': 0.3,
    }
  },
  'E': 54,  // viseme_E
  'F': 57,  // viseme_U
  'G': {
    // "FF" & "V"
    type: 'multi',
    targets: {
      'mouthUpperUpLeft': 0.1,
      'mouthUpperUpRight': 0.1,
      'viseme_FF': 1.3
    }
  },
  'H': 52,  // viseme_RR
  'X': 43,  // viseme_sil (rest position)
};

// Enhanced vowel mapping for better mouth openness
// Applies additional shape influence for improved vowel articulation
const VOWEL_ENHANCEMENT = {
  'F': { viseme: 57, intensity: 0.35 },  // "UU"
  'H': { viseme: 52, intensity: 0.6 },   // "L"
  'E': { viseme: 54, intensity: 0.8 },   // "ER"
};

// Configuration parameters for fine-tuning lip sync behavior
const VISEME_INTENSITY = 1.4;        // Base intensity of mouth movements
const VOWEL_BOOST = 0.3;             // Additional intensity for vowel sounds
const SMOOTHING_FACTOR = 0.2;        // Smoothness of transitions (lower = smoother)
const ANTICIPATION_TIME = 0;         // Look ahead time for next phoneme (seconds)
const HOLD_FACTOR = 0.2;             // How long to hold visemes at full strength
const MIN_DURATION_THRESHOLD = 0.05; // Minimum phoneme duration to include (seconds)
const GAP_THRESHOLD = 0.04;          // Maximum gap for continuous speech (seconds)
const DEFAULT_MOUTH_OPENNESS = 0.05; // Default minimum mouth openness during speech
const GAP_INTENSITY = 0.1;           // Intensity of mouth movement during gaps
const VOWEL_FADE_TIME = 0.01;        // Time to fade between vowel enhancements (seconds)
const AUDIO_SYNC_OFFSET = 0.15;      // Offset to address slight delay in lip movements

// Helper function to get morph target index from name or index
const getMorphTargetIndex = (mesh, targetName) => {
  // If targetName is a number, return it directly
  if (typeof targetName === 'number') return targetName;
  
  // Otherwise, look up by name in the morphTargetDictionary
  const morphTargetDictionary = mesh.morphTargetDictionary;
  if (morphTargetDictionary && morphTargetDictionary[targetName] !== undefined) {
    return morphTargetDictionary[targetName];
  }
  
  // Fallback to using the name as an index
  console.warn(`Morph target "${targetName}" not found, falling back to index`);
  return targetName;
};

export function LipSyncController({ meshRef, rhubarbData, isPlaying, audioElement }) {
  const animationFrameIdRef = useRef(null);
  const currentVisemeRef = useRef(null);
  const nextVisemeRef = useRef(null);
  const visemeTimingsRef = useRef({});
  const lastVowelTimeRef = useRef(0);
  const lastVowelRef = useRef(null);
  
  // Pre-process the rhubarbData for better performance and vowel enhancement
  useEffect(() => {
    if (rhubarbData && rhubarbData.length > 0) {
      // Filter out extremely short phonemes that can cause jitter
      let processedData = rhubarbData.filter(mark => 
        (mark.end - mark.start) >= MIN_DURATION_THRESHOLD
      );
      
      // Enhance specific vowel phonemes for better mouth shapes
      processedData = processedData.map(mark => {
        const isVowel = Object.keys(VOWEL_ENHANCEMENT).includes(mark.value);
        
        return {
          ...mark,
          isVowel,
          effectiveIntensity: isVowel ? 
            VISEME_INTENSITY + VOWEL_BOOST : 
            VISEME_INTENSITY
        };
      });
      
      // Fix any large gaps in the phoneme data to prevent closed mouth during speech
      if (processedData.length > 1) {
        const fixedData = [];
        for (let i = 0; i < processedData.length; i++) {
          fixedData.push(processedData[i]);
          
          // If there's a gap between this phoneme and the next one, add a filler
          if (i < processedData.length - 1) {
            const currentEnd = processedData[i].end;
            const nextStart = processedData[i + 1].start;
            const gap = nextStart - currentEnd;
            
            // If gap is significant but not too large (likely still during speech)
            if (gap > GAP_THRESHOLD && gap < 0.5) {
              // Insert a neutral mouth position during the gap
              fixedData.push({
                start: currentEnd,
                end: nextStart,
                value: 'A', // Neutral slightly open mouth
                isFillerPhoneme: true,
                isVowel: false,
                effectiveIntensity: VISEME_INTENSITY * 0.6
              });
            }
          }
        }
        processedData = fixedData;
      }
      
      // Store the processed data
      visemeTimingsRef.current = processedData;
    }
  }, [rhubarbData]);
  
  // Helper function to apply viseme (single or multiple targets)
  const applyViseme = (visemeConfig, intensity, smoothingFactor) => {
    if (!meshRef.current?.morphTargetInfluences) return;
    
    // Handle multi-target viseme
    if (typeof visemeConfig === 'object' && visemeConfig.type === 'multi') {
      // Apply each target with its specific intensity
      Object.entries(visemeConfig.targets).forEach(([targetName, targetIntensity]) => {
        const targetIndex = getMorphTargetIndex(meshRef.current, targetName);
        
        if (targetIndex !== undefined && meshRef.current.morphTargetInfluences[targetIndex] !== undefined) {
          meshRef.current.morphTargetInfluences[targetIndex] = 
            THREE.MathUtils.lerp(
              meshRef.current.morphTargetInfluences[targetIndex], 
              intensity * targetIntensity, 
              smoothingFactor
            );
        }
      });
    } 
    // Handle single-target viseme
    else if (typeof visemeConfig === 'number') {
      if (meshRef.current.morphTargetInfluences[visemeConfig] !== undefined) {
        meshRef.current.morphTargetInfluences[visemeConfig] = 
          THREE.MathUtils.lerp(
            meshRef.current.morphTargetInfluences[visemeConfig], 
            intensity, 
            smoothingFactor
          );
      }
    }
  };
  
  // Helper function to reset all morph targets
  const resetAllMorphTargets = (smoothingFactor) => {
    if (!meshRef.current?.morphTargetInfluences) return;
    
    // Reset standard visemes
    Object.values(PHONEME_TO_VISEME).forEach(visemeConfig => {
      if (typeof visemeConfig === 'number') {
        // Single target
        if (meshRef.current.morphTargetInfluences[visemeConfig] !== undefined) {
          meshRef.current.morphTargetInfluences[visemeConfig] *= (1 - smoothingFactor);
        }
      } else if (typeof visemeConfig === 'object' && visemeConfig.type === 'multi') {
        // Multi-target
        Object.entries(visemeConfig.targets).forEach(([targetName, _]) => {
          const targetIndex = getMorphTargetIndex(meshRef.current, targetName);
          if (targetIndex !== undefined && meshRef.current.morphTargetInfluences[targetIndex] !== undefined) {
            meshRef.current.morphTargetInfluences[targetIndex] *= (1 - smoothingFactor);
          }
        });
      }
    });
    
    // Reset vowel enhancement targets
    Object.values(VOWEL_ENHANCEMENT).forEach(enhancementConfig => {
      if (meshRef.current.morphTargetInfluences[enhancementConfig.viseme] !== undefined) {
        meshRef.current.morphTargetInfluences[enhancementConfig.viseme] *= (1 - smoothingFactor);
      }
    });
  };
  
  // Function to update visemes on each frame with improved vowel articulation
  const updateVisemes = (time) => {
    if (!meshRef.current?.morphTargetInfluences || !audioElement || !visemeTimingsRef.current || visemeTimingsRef.current.length === 0) {
      return;
    }
    
    // If audio isn't playing, smoothly reset all visemes
    if (!isPlaying || audioElement.paused || audioElement.ended) {
      resetAllMorphTargets(SMOOTHING_FACTOR);
      
      // Continue animation loop until all visemes are close to 0
      const hasActiveViseme = Object.values(PHONEME_TO_VISEME).some(visemeConfig => {
        if (typeof visemeConfig === 'number') {
          return meshRef.current.morphTargetInfluences[visemeConfig] > 0.01;
        } else if (typeof visemeConfig === 'object' && visemeConfig.type === 'multi') {
          return Object.entries(visemeConfig.targets).some(([targetName, _]) => {
            const targetIndex = getMorphTargetIndex(meshRef.current, targetName);
            return meshRef.current.morphTargetInfluences[targetIndex] > 0.01;
          });
        }
        return false;
      });
      
      if (hasActiveViseme) {
        animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
      } else {
        animationFrameIdRef.current = null;
      }
      return;
    }
    
    // Calculate current audio time with sync offset
    const audioTime = audioElement.currentTime + AUDIO_SYNC_OFFSET;
    
    // Find current and next visemes
    let currentMark = null;
    let nextMark = null;
    let isInGap = true; // Assume we're in a gap until we find a current mark
    const cues = visemeTimingsRef.current;
    
    for (let i = 0; i < cues.length; i++) {
      // Get current mark
      if (audioTime >= cues[i].start && audioTime <= cues[i].end) {
        currentMark = cues[i];
        isInGap = false;
        
        // Get next mark (if available)
        if (i < cues.length - 1) {
          nextMark = cues[i + 1];
        }
        break;
      }
      
      // Track if we're in a gap between phonemes
      if (i < cues.length - 1) {
        if (audioTime > cues[i].end && audioTime < cues[i + 1].start) {
          // We're in a gap between phonemes
          isInGap = true;
          // Use the previous and next phonemes to know what we're transitioning between
          if (audioTime - cues[i].end < cues[i + 1].start - audioTime) {
            // Closer to previous phoneme
            currentMark = cues[i];
          } else {
            // Closer to next phoneme
            nextMark = cues[i + 1];
          }
          break;
        }
      }
      
      // Look ahead for anticipation
      if (cues[i].start > audioTime && cues[i].start - audioTime <= ANTICIPATION_TIME) {
        nextMark = cues[i];
        break;
      }
    }
    
    // Calculate progress within current viseme for dynamic blending
    let currentProgress = 0;
    if (currentMark) {
      const markDuration = currentMark.end - currentMark.start;
      currentProgress = (audioTime - currentMark.start) / markDuration;
      
      // Apply hold factor to keep the viseme at full strength longer
      if (currentProgress < HOLD_FACTOR) {
        currentProgress = currentProgress / HOLD_FACTOR;
      } else {
        currentProgress = 1.0;
      }
    }
    
    // Reset all visemes gently
    resetAllMorphTargets(SMOOTHING_FACTOR * 0.5);
    
    // Apply minimum mouth openness during speech
    const defaultVisemeIndex = PHONEME_TO_VISEME['A'];
    if (DEFAULT_MOUTH_OPENNESS > 0 && typeof defaultVisemeIndex === 'number' && 
        meshRef.current.morphTargetInfluences[defaultVisemeIndex] !== undefined) {
      meshRef.current.morphTargetInfluences[defaultVisemeIndex] = 
        Math.max(meshRef.current.morphTargetInfluences[defaultVisemeIndex], DEFAULT_MOUTH_OPENNESS);
    }
    
    // Apply the current viseme with enhanced vowel handling
    if (currentMark) {
      const currentVisemeConfig = PHONEME_TO_VISEME[currentMark.value];
      
      if (currentVisemeConfig !== undefined) {
        // Use the effective intensity from pre-processing
        const dynamicIntensity = currentMark.effectiveIntensity || VISEME_INTENSITY;
        
        // Apply the viseme with a dynamic smoothing factor
        applyViseme(
          currentVisemeConfig, 
          dynamicIntensity, 
          SMOOTHING_FACTOR + (currentProgress * 0.2) // Faster onset, slower decay
        );
        
        currentVisemeRef.current = currentVisemeConfig;
        
        // Special handling for vowels to boost mouth openness
        if (currentMark.isVowel && VOWEL_ENHANCEMENT[currentMark.value]) {
          const vowelData = VOWEL_ENHANCEMENT[currentMark.value];
          
          // Track last vowel time and type for blending
          lastVowelTimeRef.current = audioTime;
          lastVowelRef.current = currentMark.value;
          
          // Apply enhanced intensity for this vowel
          if (typeof vowelData.viseme === 'number' && 
              meshRef.current.morphTargetInfluences[vowelData.viseme] !== undefined) {
            meshRef.current.morphTargetInfluences[vowelData.viseme] =
              THREE.MathUtils.lerp(
                meshRef.current.morphTargetInfluences[vowelData.viseme],
                dynamicIntensity * vowelData.intensity,
                SMOOTHING_FACTOR + (currentProgress * 0.3)
              );
          }
        }
      }
    } else if (isInGap && audioElement.currentTime > 0.1 && DEFAULT_MOUTH_OPENNESS > 0) {
      // Handle gaps between phonemes while audio is playing
      
      // Apply lingering vowel influence if we recently played a vowel
      const timeSinceLastVowel = audioTime - lastVowelTimeRef.current;
      
      if (timeSinceLastVowel < VOWEL_FADE_TIME && lastVowelRef.current) {
        const fadeRatio = 1 - (timeSinceLastVowel / VOWEL_FADE_TIME);
        const vowelData = VOWEL_ENHANCEMENT[lastVowelRef.current];
        
        if (vowelData && typeof vowelData.viseme === 'number' && 
            meshRef.current.morphTargetInfluences[vowelData.viseme] !== undefined) {
          // Apply fading vowel influence
          meshRef.current.morphTargetInfluences[vowelData.viseme] =
            THREE.MathUtils.lerp(
              meshRef.current.morphTargetInfluences[vowelData.viseme],
              VISEME_INTENSITY * vowelData.intensity * fadeRatio * 0.7,
              SMOOTHING_FACTOR * 0.5
            );
        }
      }
      
      // Apply a natural "talking" movement instead of closing the mouth completely
      const talkingVisemeConfig = PHONEME_TO_VISEME['A'];
      
      if (talkingVisemeConfig !== undefined && typeof talkingVisemeConfig === 'number') {
        // Gentle pulsing motion when in gaps
        const gapIntensity = DEFAULT_MOUTH_OPENNESS + Math.sin(audioTime * 10) * GAP_INTENSITY;
        
        meshRef.current.morphTargetInfluences[talkingVisemeConfig] = 
          THREE.MathUtils.lerp(
            meshRef.current.morphTargetInfluences[talkingVisemeConfig], 
            gapIntensity, 
            SMOOTHING_FACTOR * 0.7
          );
      }
    }
    
    // Apply anticipation for the next viseme
    if (nextMark) {
      const nextVisemeConfig = PHONEME_TO_VISEME[nextMark.value];
      
      if (nextVisemeConfig !== undefined) {
        // Calculate anticipation factor based on how close we are to the next phoneme
        const timeToNext = nextMark.start - audioTime;
        const anticipationFactor = 1 - (timeToNext / ANTICIPATION_TIME);
        
        // Apply subtle anticipation only if we're close enough to the next phoneme
        if (anticipationFactor > 0) {
          // Use enhanced intensity for vowel anticipation
          const anticipationIntensity = 
            (nextMark.isVowel ? VISEME_INTENSITY * 1.2 : VISEME_INTENSITY) * 
            0.3 * anticipationFactor;
          
          // Apply the next viseme with anticipation
          applyViseme(
            nextVisemeConfig, 
            anticipationIntensity, 
            SMOOTHING_FACTOR * 0.5
          );
          
          nextVisemeRef.current = nextVisemeConfig;
        }
      }
    }
    
    // Continue the animation loop
    animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
  };
  
  // Set up and clean up animation loop
  useEffect(() => {
    // Clean up any existing animation frame
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Start animation if we have the necessary data
    if (meshRef.current && rhubarbData && rhubarbData.length > 0 && audioElement) {
      // Start the animation loop
      animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
      
      // Set up audio event handlers
      const handlePlay = () => {
        if (!animationFrameIdRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(updateVisemes);
        }
      };
      
      // Add event listeners
      audioElement.addEventListener('play', handlePlay);
      
      // Clean up on unmount
      return () => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        
        audioElement.removeEventListener('play', handlePlay);
        
        // Reset all visemes on unmount
        if (meshRef.current?.morphTargetInfluences) {
          // Reset standard visemes
          Object.values(PHONEME_TO_VISEME).forEach(visemeConfig => {
            if (typeof visemeConfig === 'number') {
              // Single target
              if (meshRef.current.morphTargetInfluences[visemeConfig] !== undefined) {
                meshRef.current.morphTargetInfluences[visemeConfig] = 0;
              }
            } else if (typeof visemeConfig === 'object' && visemeConfig.type === 'multi') {
              // Multi-target
              Object.entries(visemeConfig.targets).forEach(([targetName, _]) => {
                const targetIndex = getMorphTargetIndex(meshRef.current, targetName);
                if (targetIndex !== undefined && meshRef.current.morphTargetInfluences[targetIndex] !== undefined) {
                  meshRef.current.morphTargetInfluences[targetIndex] = 0;
                }
              });
            }
          });
        }
      };
    }
  }, [meshRef, rhubarbData, isPlaying, audioElement]);
  
  // This is a controller component with no visual rendering
  return null;
}