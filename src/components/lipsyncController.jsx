import React, { useEffect, useRef } from 'react';

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
const VISEME_INTENSITY = 1.0;

export function LipSyncController({ meshRef, rhubarbData }) {
  const currentVisemeRef = useRef(null);
  
  useEffect(() => {
    if (!meshRef.current || !rhubarbData) return;

    // Reset all visemes
    const resetVisemes = () => {
      Object.values(PHONEME_TO_VISEME).forEach(visemeIndex => {
        if (meshRef.current.morphTargetInfluences) {
          meshRef.current.morphTargetInfluences[visemeIndex] = 0;
        }
      });
    };

    // Set a specific viseme
    const setViseme = (visemeIndex, intensity = VISEME_INTENSITY) => {
      if (meshRef.current.morphTargetInfluences) {
        resetVisemes();
        meshRef.current.morphTargetInfluences[visemeIndex] = intensity;
        currentVisemeRef.current = visemeIndex;
      }
    };

    // Process Rhubarb data and animate
    let animationFrameId;
    let startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;

      // Find the current phoneme based on timestamp
      const currentMark = rhubarbData.find((mark, index) => {
        const nextMark = rhubarbData[index + 1];
        if (!nextMark) return true;
        return elapsed >= mark.start * 1000 && elapsed < nextMark.start * 1000;
      });

      if (currentMark) {
        const visemeIndex = PHONEME_TO_VISEME[currentMark.value];
        if (visemeIndex !== currentVisemeRef.current) {
          setViseme(visemeIndex);
        }
      }

      // Check if animation should continue
      if (elapsed < rhubarbData[rhubarbData.length - 1].start * 1000) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        resetVisemes();
      }
    };

    // Start animation
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      resetVisemes();
    };
  }, [meshRef, rhubarbData]);

  return null; // This is a controller component, so it doesn't render anything
}
