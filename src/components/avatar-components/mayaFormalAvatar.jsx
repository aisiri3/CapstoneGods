import React, { useEffect, useRef, useState } from 'react'
import { useGraph } from '@react-three/fiber'
import { useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { LipSyncController } from './lipsyncController'

export function MayaFormal({ lipSyncData, audioUrl, position, rotation, scale, isFiller }) {
  const headMeshRef = useRef();
  const audioRef = useRef(null);
  const { scene } = useGLTF('/avatars/Noor.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const group = useRef()
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for intro and response lipsync
  const [introLipSyncData, setIntroLipSyncData] = useState(null);
  const [activeAudio, setActiveAudio] = useState('intro'); // 'intro' or 'response' or 'filler'
  const [activeLipSync, setActiveLipSync] = useState(null);

  // Track props changes for debugging
  useEffect(() => {
    console.log("Avatar props changed:", {
      hasLipSyncData: !!lipSyncData,
      audioUrl,
      isFiller,
      isPlaying,
      animation: isPlaying ? "Playing" : "Not playing",
      activeAudio
    });
  }, [lipSyncData, audioUrl, isFiller, isPlaying, activeAudio]);

  // Load intro lipsync data when component mounts
  useEffect(() => {
    fetch('/intros/malay-female-professional-intro.json')
      .then(response => response.json())
      .then(data => {
        console.log("Loaded intro lipsync data:", data.mouthCues.length, "mouth cues");
        setIntroLipSyncData(data.mouthCues);
        setActiveLipSync(data.mouthCues);
      })
      .catch(error => {
        console.error("Error loading intro lipsync data:", error);
      });
  }, []);

  // Load and name animations
  const { animations: idleAnimation } = useFBX("/animations/maya/Maya Idle.fbx")
  const { animations: talkingAnimation } = useFBX("/animations/maya/Maya Talking.fbx")
  const { animations: wavingAnimation } = useFBX("/animations/maya/Maya Waving.fbx")
  
  idleAnimation[0].name = "Idle"
  talkingAnimation[0].name = "Talking"
  wavingAnimation[0].name = "Waving"

  // Cleanup function for audio resources
  const cleanupAudio = () => {
    if (audioRef.current) {
      console.log("Avatar cleaning up audio resources");
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onpause = null;
      audioRef.current.onerror = null;
      audioRef.current.oncanplay = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current = null;
    }
  };

  // default facial animations
  useEffect(() => {
    if (!nodes.UnionAvatars_Head_1 || !nodes.UnionAvatars_Head_1.morphTargetDictionary) {
      console.log("Head mesh or morphTargetDictionary not available yet");
      return;
    }
    
    // Setup default facial expressions
    try {
      // Avatar is always smiling
      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileLeft"]
      ] = 0.4;

      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileRight"]
      ] = 0.4;
      
      console.log("Default facial expressions set successfully");
      setIsInitialized(true);
    } catch (e) {
      console.error("Error setting default facial expressions:", e);
    }
    
    // Function to handle blinking
    const blink = () => {
      try {
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeBlinkLeft"]
        ] = 1;
    
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeBlinkRight"]
        ] = 1;
    
        setTimeout(() => {
          nodes.UnionAvatars_Head_1.morphTargetInfluences[
            nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeBlinkLeft"]
          ] = 0;
    
          nodes.UnionAvatars_Head_1.morphTargetInfluences[
            nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeBlinkRight"]
          ] = 0;
        }, 100); // Blink duration (adjust for smoothness)
      } catch (e) {
        console.error("Error during blink animation:", e);
      }
    };
  
    // Blink every 3-6 seconds randomly
    const blinkInterval = setInterval(() => {
      blink();
    }, Math.random() * 3000 + 3000); 
  
    return () => clearInterval(blinkInterval); // Cleanup on unmount
  }, [nodes]);

  const { actions, mixer } = useAnimations(
    [idleAnimation[0], talkingAnimation[0], wavingAnimation[0]], 
    group
  )

  const [animation, setAnimation] = useState("Idle");

  // Add this effect to handle component unmounting
  useEffect(() => {
    return () => {
      console.log("Avatar component unmounting - cleaning up resources");
      cleanupAudio();
    };
  }, []);

  // Separate function to handle audio playback
  const startAudioPlayback = (url, audioType, lipsyncData) => {
    console.log(`Starting ${audioType} audio playback`, url);
    
    // Create new audio element
    const audio = new Audio();
    audio.src = url;
    
    // Set up event handlers
    audio.onloadedmetadata = () => {
      console.log(`${audioType} audio metadata loaded, duration:`, audio.duration);
    };
    
    audio.oncanplay = () => {
      console.log(`${audioType} audio ready to play`);
    };
    
    audio.onplay = () => {
      console.log(`${audioType} audio playback started`);
      setIsPlaying(true);
      setActiveLipSync(lipsyncData);
      setAnimation("Talking");
    };
    
    audio.onended = () => {
      console.log(`${audioType} audio playback ended`);
      setIsPlaying(false);
      setAnimation("Idle");
      
      // Only update activeAudio if this was intro audio
      if (activeAudio === 'intro' && !audioType.includes('filler')) {
        setActiveAudio('response');
      }
    };
    
    audio.onerror = (e) => {
      console.error(`Error with ${audioType} audio:`, e);
      setIsPlaying(false);
      setAnimation("Idle");
    };
    
    // Store reference
    audioRef.current = audio;
    
    // Play audio with retry logic
    const playWithRetry = (retries = 3) => {
      console.log(`Attempting to play ${audioType} audio (retries left: ${retries})`);
      audio.play().catch(err => {
        console.error(`Error playing ${audioType} audio:`, err);
        if (retries > 0) {
          console.log(`Retrying playback in 100ms...`);
          setTimeout(() => playWithRetry(retries - 1), 100);
        } else {
          console.error(`Failed to play ${audioType} audio after multiple attempts`);
          setIsPlaying(false);
          setAnimation("Idle");
        }
      });
    };
    
    // Start playback
    playWithRetry();
  };

  /* Set animation states based on playing/loading/otherwise */
  // Play intro audio when component mounts and intro lipsync data is loaded
  useEffect(() => {
    if (isInitialized && introLipSyncData && activeAudio === 'intro') {
      console.log("Playing intro audio");
      
      // Create audio element for intro
      const introAudio = new Audio('/intros/malay-female-professional-intro.wav');
      audioRef.current = introAudio;
      
      // Set up event handlers
      introAudio.onplay = () => {
        console.log("Intro audio playback started");
        setIsPlaying(true);
        setAnimation("Waving");
      };
      
      introAudio.onended = () => {
        console.log("Intro audio playback ended");
        setIsPlaying(false);
        setAnimation("Idle");
        setActiveAudio('response'); // Switch to response mode after intro
      };
      
      introAudio.onpause = () => {
        setIsPlaying(false);
        setAnimation("Idle");
      };
      
      // Start playing after a short delay to ensure everything is loaded
      setTimeout(() => {
        introAudio.play().catch(err => {
          console.error("Error playing intro audio:", err);
        });
      }, 500);
      
      return () => {
        introAudio.pause();
        introAudio.onplay = null;
        introAudio.onended = null;
        introAudio.onpause = null;
      };
    }
  }, [isInitialized, introLipSyncData, activeAudio]);

  // Handle playing response or filler audio when provided
  useEffect(() => {
    console.log(`Audio effect triggered with URL: ${audioUrl}, isFiller: ${isFiller}`);
    
    // Always clean up previous audio regardless of what's coming next
    cleanupAudio();
    
    if (!audioUrl) {
      console.log("No audio URL provided, resetting state");
      setIsPlaying(false);
      setAnimation("Idle");
      return;
    }

    // Determine if we're handling a filler or a response
    const audioType = isFiller ? 'filler' : 'response';
    console.log(`Processing ${audioType} audio with URL:`, audioUrl);
    
    // Force a delay before starting response audio (if not a filler)
    if (!isFiller) {
      console.log("Response audio detected, adding delay before playback");
      setTimeout(() => {
        startAudioPlayback(audioUrl, audioType, lipSyncData);
      }, 300); // Longer delay for response audio
    } else {
      // Start filler audio immediately
      startAudioPlayback(audioUrl, audioType, lipSyncData);
    }
  }, [audioUrl, lipSyncData, isFiller]);

  // Handle animation transitions
  useEffect(() => {
    if (actions && actions[animation]) {
      console.log(`Switching to animation: ${animation}`);
      
      // Fade out any currently running animations
      Object.values(actions).forEach(action => {
        if (action.isRunning()) {
          action.fadeOut(0.5);
        }
      });

      // Play the new animation
      actions[animation].fadeIn(0.4).play();
    }
  }, [animation, actions]);

  return (
    <group position={position} rotation={rotation} scale={scale} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <primitive object={nodes.neutral_bone} />
      <skinnedMesh geometry={nodes.UnionAvatars_Body.geometry} material={materials.UnionAvatars_Body} skeleton={nodes.UnionAvatars_Body.skeleton} />
      <skinnedMesh geometry={nodes.UnionAvatars_Bottom.geometry} material={materials.UnionAvatars_Bottom} skeleton={nodes.UnionAvatars_Bottom.skeleton} />
      <skinnedMesh geometry={nodes.UnionAvatars_Hair.geometry} material={materials.UnionAvatars_Hair} skeleton={nodes.UnionAvatars_Hair.skeleton} />
      <skinnedMesh geometry={nodes.UnionAvatars_Shoes.geometry} material={materials.UnionAvatars_Shoes} skeleton={nodes.UnionAvatars_Shoes.skeleton} />
      <skinnedMesh geometry={nodes.UnionAvatars_Top.geometry} material={materials.UnionAvatars_Top} skeleton={nodes.UnionAvatars_Top.skeleton} />
      
      <skinnedMesh 
        ref={headMeshRef}
        name="UnionAvatars_Head_1" 
        geometry={nodes.UnionAvatars_Head_1.geometry} 
        material={materials.v3_phr_unionavatars_head_d} 
        skeleton={nodes.UnionAvatars_Head_1.skeleton} 
        morphTargetDictionary={nodes.UnionAvatars_Head_1.morphTargetDictionary} 
        morphTargetInfluences={nodes.UnionAvatars_Head_1.morphTargetInfluences} 
      />
      
      {/* LipSync controller for dynamically updating lip movements */}
      {activeLipSync && isPlaying && (
        <LipSyncController 
          meshRef={headMeshRef}
          rhubarbData={activeLipSync}
          isPlaying={isPlaying}
          audioElement={audioRef.current}
        />
      )}

      <skinnedMesh name="UnionAvatars_Head_2" geometry={nodes.UnionAvatars_Head_2.geometry} material={materials.UnionAvatars_Body} skeleton={nodes.UnionAvatars_Head_2.skeleton} morphTargetDictionary={nodes.UnionAvatars_Head_2.morphTargetDictionary} morphTargetInfluences={nodes.UnionAvatars_Head_2.morphTargetInfluences} />
      <skinnedMesh name="UnionAvatars_Head_3" geometry={nodes.UnionAvatars_Head_3.geometry} material={materials.v3_phr_unionavatars_eye_ball_d} skeleton={nodes.UnionAvatars_Head_3.skeleton} morphTargetDictionary={nodes.UnionAvatars_Head_3.morphTargetDictionary} morphTargetInfluences={nodes.UnionAvatars_Head_3.morphTargetInfluences} />
    </group>
  )
}

// Preload the GLB model
useGLTF.preload('/avatars/Noor.glb')