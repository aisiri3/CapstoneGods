import React, { useEffect, useRef, useState } from 'react';

export function SpeechController({ meshRef, audioUrl, lipSyncUrl }) {
  const [lipSyncData, setLipSyncData] = useState(null);
  const audioRef = useRef(new Audio());
  const isPlayingRef = useRef(false);

  // Load lip sync data
  useEffect(() => {
    fetch(lipSyncUrl)
      .then(res => res.json())
      .then(data => setLipSyncData(data.mouthCues))
      .catch(err => console.error('Error loading lip sync data:', err));
  }, [lipSyncUrl]);

  // Set up audio
  useEffect(() => {
    const audio = audioRef.current;
    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  // Function to start speech
  const startSpeech = () => {
    if (!lipSyncData || isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    audioRef.current.play();
  };

  // Function to stop speech
  const stopSpeech = () => {
    if (!isPlayingRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    isPlayingRef.current = false;
  };

  // Handle lip sync animation
  useEffect(() => {
    if (!meshRef.current || !lipSyncData || !isPlayingRef.current) return;

    const startTime = performance.now();
    let animationFrameId;

    const animate = (currentTime) => {
      if (!isPlayingRef.current) return;

      const elapsed = (currentTime - startTime) / 1000; // Convert to seconds

      // Find current mouth shape
      const currentCue = lipSyncData.find((cue, index) => {
        const nextCue = lipSyncData[index + 1];
        if (!nextCue) return elapsed >= cue.start;
        return elapsed >= cue.start && elapsed < nextCue.start;
      });

      if (currentCue) {
        // Update morph targets based on the phoneme
        // You'll need to adjust these indices based on your model
        switch (currentCue.value) {
          case 'A':
            meshRef.current.morphTargetInfluences[53] = 1; // viseme_aa
            break;
          case 'B':
            meshRef.current.morphTargetInfluences[44] = 1; // viseme_PP
            break;
          case 'C':
            meshRef.current.morphTargetInfluences[49] = 1; // viseme_CH
            break;
          // Add other phoneme cases here
        }
      }

      if (elapsed < audioRef.current.duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        stopSpeech();
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [lipSyncData, meshRef]);

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleEnded = () => {
      isPlayingRef.current = false;
      // Reset all morph targets to 0
      if (meshRef.current) {
        meshRef.current.morphTargetInfluences.fill(0);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  return {
    startSpeech,
    stopSpeech,
    isPlaying: isPlayingRef.current
  };
}