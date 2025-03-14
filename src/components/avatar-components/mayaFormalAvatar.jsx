import React, { useEffect, useRef, useState } from 'react'
import { useGraph } from '@react-three/fiber'
import { useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { LipSyncController } from './lipsyncController'

export function MayaFormal({ lipSyncData, audioUrl, position, rotation, scale }) {
  const headMeshRef = useRef();
  const audioRef = useRef(null);
  const { scene } = useGLTF('/avatars/Mayaiseating.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const group = useRef()
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
    fetch('/intros/female-casual-intro.json')
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

      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintLeft"]
      ] = 0.5;

      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["eyeSquintRight"]
      ] = 0.5;
      
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

  /* Set animation states based on playing/loading/otherwise */
  // Play intro audio when component mounts and intro lipsync data is loaded
  useEffect(() => {
    if (isInitialized && introLipSyncData && activeAudio === 'intro') {
      console.log("Playing intro audio");
      
      // Create audio element for intro
      const introAudio = new Audio('/intros/female-casual-intro.wav');
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
        console.log("Intro audio playback paused");
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
        setAnimation("Talking");
      };
      
      responseAudio.onended = () => {
        console.log("Response audio playback ended");
        setIsPlaying(false);
        setAnimation("Idle");
      };
      
      responseAudio.onpause = () => {
        console.log("Response audio playback paused");
        setIsPlaying(false);
        setAnimation("Idle");
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
useGLTF.preload('/avatars/Mayaiseating.glb')