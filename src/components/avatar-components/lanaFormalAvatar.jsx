import React, { useEffect, useRef, useState } from 'react'
import { useGraph, useFrame } from '@react-three/fiber'
import { useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { LipSyncController } from './lipsyncController'

export function LanaFormal({ lipSyncData, audioUrl, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const headMeshRef = useRef();
  const audioRef = useRef(null);
  const { scene } = useGLTF('/avatars/Lanaplsman.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const group = useRef()

  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAction, setCurrentAction] = useState('idle');
  
  // State for intro and response lipsync
  const [introLipSyncData, setIntroLipSyncData] = useState(null);
  const [activeAudio, setActiveAudio] = useState('intro'); // 'intro' or 'response'
  const [activeLipSync, setActiveLipSync] = useState(null);

  useEffect(() => {
    if (nodes.UnionAvatars_Head_1 && nodes.UnionAvatars_Head_1.morphTargetDictionary) {
      console.log("Morph target dictionary:", nodes.UnionAvatars_Head_1.morphTargetDictionary);
    }
  }, [nodes.UnionAvatars_Head_1]);

  // Load intro lipsync data when component mounts
  useEffect(() => {
    fetch('/intros/female-professional-intro.json')
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

  // Use only the sitting animation like Nazriya
  const { animations: sittingAnimation } = useFBX("/animations/lana/Lana Sitting.fbx")
  sittingAnimation[0].name = "Idle"
  
  // Configure animations
  const { actions, mixer } = useAnimations([sittingAnimation[0]], group)

  // Initialize and play the idle animation once
  useEffect(() => {
    if (actions.Idle) {
      actions.Idle.play();
    }
  }, [actions]);
  
  // default facial animations
  useEffect(() => {
    if (!nodes.UnionAvatars_Head_1 || !nodes.UnionAvatars_Head_1.morphTargetDictionary) {
      return;
    }
    
    // Setup default facial expressions - neutral smile
    try {
      // Avatar is always smiling slightly
      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileLeft"]
      ] = 0.5;

      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileRight"]
      ] = 0.5;

      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintLeft"]
      ] = 0.2;
      
      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintRight"]
      ] = 0.2;
      
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
        }, 100); // Blink duration
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

  // Custom facial animations for talking/waving without changing body pose
  const applyFacialAnimation = (animationType) => {
    if (!nodes.UnionAvatars_Head_1?.morphTargetDictionary) return;
    
    try {
      // Reset all facial morphs first (except base smile)
      for (const key in nodes.UnionAvatars_Head_1.morphTargetDictionary) {
        const index = nodes.UnionAvatars_Head_1.morphTargetDictionary[key];
        if (key !== "mouthSmileLeft" && key !== "mouthSmileRight") {
          nodes.UnionAvatars_Head_1.morphTargetInfluences[index] = 0;
        }
      }
      
      // Apply specific facial animation based on type
      if (animationType === 'talking') {
        // Add slight eyebrow raise for engagement
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["browInnerUp"]
        ] = 0.4;
        
        // Add squint for more engaged expression
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintLeft"]
        ] = 0.3;
        
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintRight"]
        ] = 0.3;
      } 
      else if (animationType === 'waving') {
        // Wide smile for greeting
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileLeft"]
        ] = 0.7;
        
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileRight"]
        ] = 0.7;
        
        // Friendly expression
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintLeft"]
        ] = 0.5;
        
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintRight"]
        ] = 0.5;
      }
      else {
        // Reset to default smile for idle
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileLeft"]
        ] = 0.4;
        
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileRight"]
        ] = 0.4;
        
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintLeft"]
        ] = 0.2;
        
        nodes.UnionAvatars_Head_1.morphTargetInfluences[
          nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintRight"]
        ] = 0.2;
      }
    } catch (e) {
      console.error("Error applying facial animation:", e);
    }
  };

  // Play intro audio when component mounts and intro lipsync data is loaded
  useEffect(() => {
    if (isInitialized && introLipSyncData && activeAudio === 'intro') {
      console.log("Playing intro audio");
      
      // Create audio element for intro
      const introAudio = new Audio('/intros/female-professional-intro.wav');
      audioRef.current = introAudio;
      
      // Set up event handlers
      introAudio.onplay = () => {
        console.log("Intro audio playback started");
        setIsPlaying(true);
        setCurrentAction('waving');
        applyFacialAnimation('waving');
      };
      
      introAudio.onended = () => {
        console.log("Intro audio playback ended");
        setIsPlaying(false);
        setCurrentAction('idle');
        applyFacialAnimation('idle');
        setActiveAudio('response'); // Switch to response mode after intro
      };
      
      introAudio.onpause = () => {
        console.log("Intro audio playback paused");
        setIsPlaying(false);
        setCurrentAction('idle');
        applyFacialAnimation('idle');
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

  // Handle playing response audio when provided
  useEffect(() => {
    if (audioUrl && activeAudio === 'response') {
      console.log("Setting up response audio with URL:", audioUrl);
      
      // Create new audio element for response
      const responseAudio = new Audio();
      audioRef.current = responseAudio;
      
      // Set up new audio
      responseAudio.src = audioUrl;
      
      // Event handlers
      responseAudio.onplay = () => {
        console.log("Response audio playback started");
        setIsPlaying(true);
        setActiveLipSync(lipSyncData);
        setCurrentAction('talking');
        applyFacialAnimation('talking');
      };
      
      responseAudio.onended = () => {
        console.log("Response audio playback ended");
        setIsPlaying(false);
        setCurrentAction('idle');
        applyFacialAnimation('idle');
      };
      
      responseAudio.onpause = () => {
        console.log("Response audio playback paused");
        setIsPlaying(false);
        setCurrentAction('idle');
        applyFacialAnimation('idle');
      };
      
      // Start playing the audio
      responseAudio.play().catch(err => {
        console.error("Error playing response audio:", err);
      });
      
      // Cleanup function
      return () => {
        responseAudio.pause();
        responseAudio.onplay = null;
        responseAudio.onended = null;
        responseAudio.onpause = null;
      };
    }
  }, [audioUrl, activeAudio, lipSyncData]);

  // Position stabilization (optional, but useful if the model tends to shift)
  useEffect(() => {
    if (!group.current) return;
    
    // Store the initial position
    const initialPos = new THREE.Vector3().copy(group.current.position);
    
    // Check position periodically and reset if needed
    const intervalId = setInterval(() => {
      if (group.current && group.current.position.distanceTo(initialPos) > 0.5) {
        console.log("Resetting position");
        group.current.position.copy(initialPos);
      }
    }, 500);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <group 
      position={position} 
      rotation={rotation} 
      scale={scale} 
      dispose={null} 
      ref={group}
    >
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
useGLTF.preload('/avatars/Lanaplsman.glb')