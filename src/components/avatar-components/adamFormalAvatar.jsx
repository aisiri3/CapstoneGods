/**
 * Adam Avatar Component (Professional)
 * 
 * Renders Adam, the avatar for English, Male, Professional settings.
 * A 3D avatar component that handles facial animations, lip syncing, and audio playback.
 * 
 */

import React, { useEffect, useRef, useState } from 'react'
import { useGraph } from '@react-three/fiber'
import { useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { LipSyncController } from './lipsyncController'

export function AdamFormal({ lipSyncData, audioUrl, position, rotation, scale, isFiller }) {
  const headMeshRef = useRef();
  const audioRef = useRef(null);
  const { scene } = useGLTF('/avatars/adamishere.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const group = useRef()
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [introLipSyncData, setIntroLipSyncData] = useState(null);
  const [activeAudio, setActiveAudio] = useState('intro');
  const [activeLipSync, setActiveLipSync] = useState(null);

  // Load intro lipsync data when component mounts
  useEffect(() => {
    fetch('/intros/male-professional-intro.json')
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

  const { animations: idleAnimation } = useFBX("/animations/adam/Adam Idle.fbx")
  const { animations: talkingAnimation } = useFBX("/animations/adam/Adam Talking.fbx")
  const { animations: wavingAnimation } = useFBX("/animations/adam/Adam Waving.fbx")
  
  idleAnimation[0].name = "Idle"
  talkingAnimation[0].name = "Talking"
  wavingAnimation[0].name = "Waving"

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
    
    try {
      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileLeft"]
      ] = 1.0;

      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileRight"]
      ] = 1.0;
      
      console.log("Default facial expressions set successfully");
      setIsInitialized(true);
    } catch (e) {
      console.error("Error setting default facial expressions:", e);
    }
    
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
        }, 100); 
      } catch (e) {
        console.error("Error during blink animation:", e);
      }
    };
  
    const blinkInterval = setInterval(() => {
      blink();
    }, Math.random() * 3000 + 3000); 
  
    return () => clearInterval(blinkInterval);
  }, [nodes]);

  const { actions, mixer } = useAnimations(
    [idleAnimation[0], talkingAnimation[0], wavingAnimation[0]], 
    group
  )

  const [animation, setAnimation] = useState("Idle");

  useEffect(() => {
    return () => {
      console.log("Avatar component unmounting - cleaning up resources");
      cleanupAudio();
    };
  }, []);

  const startAudioPlayback = (url, audioType, lipsyncData) => {
    console.log(`Starting ${audioType} audio playback`, url);
    
    const audio = new Audio();
    audio.src = url;
    
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
      
      if (activeAudio === 'intro' && !audioType.includes('filler')) {
        setActiveAudio('response');
      }
    };
    
    audio.onerror = (e) => {
      console.error(`Error with ${audioType} audio:`, e);
      setIsPlaying(false);
      setAnimation("Idle");
    };
    
    audioRef.current = audio;
    
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
    
    playWithRetry();
  };

  /* Set animation states based on playing/loading/otherwise */
  useEffect(() => {
    if (isInitialized && introLipSyncData && activeAudio === 'intro') {
      console.log("Playing intro audio");
      
      const introAudio = new Audio('/intros/male-professional-intro.wav');
      audioRef.current = introAudio;
      
      introAudio.onplay = () => {
        setIsPlaying(true);
        setAnimation("Waving");
      };
      
      introAudio.onended = () => {
        setIsPlaying(false);
        setAnimation("Idle");
        setActiveAudio('response');
      };
      
      introAudio.onpause = () => {
        setIsPlaying(false);
        setAnimation("Idle");
      };
      
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

  useEffect(() => {
    console.log(`Audio effect triggered with URL: ${audioUrl}, isFiller: ${isFiller}`);
    
    cleanupAudio();
    
    if (!audioUrl) {
      console.log("No audio URL provided, resetting state");
      setIsPlaying(false);
      setAnimation("Idle");
      return;
    }

    const audioType = isFiller ? 'filler' : 'response';
    console.log(`Processing ${audioType} audio with URL:`, audioUrl);
    
    if (!isFiller) {
      console.log("Response audio detected, adding delay before playback");
      setTimeout(() => {
        startAudioPlayback(audioUrl, audioType, lipSyncData);
      }, 300);
    } else {
      startAudioPlayback(audioUrl, audioType, lipSyncData);
    }
  }, [audioUrl, lipSyncData, isFiller]);

  useEffect(() => {
    if (actions && actions[animation]) {
      console.log(`Switching to animation: ${animation}`);
      
      Object.values(actions).forEach(action => {
        if (action.isRunning()) {
          action.fadeOut(0.5);
        }
      });

      actions[animation].fadeIn(0.4).play();
    }
  }, [animation, actions]);

  return (
    <group position={position} rotation={rotation} scale={scale} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <primitive object={nodes.neutral_bone} />
      <skinnedMesh geometry={nodes.UnionAvatars_Body.geometry} material={materials.UnionAvatars_Body} skeleton={nodes.UnionAvatars_Body.skeleton} />
      <skinnedMesh geometry={nodes.UnionAvatars_Bottom.geometry} material={materials.UnionAvatars_Bottom} skeleton={nodes.UnionAvatars_Bottom.skeleton} />
      <skinnedMesh geometry={nodes.UnionAvatars_Hair.geometry} material={materials['UnionAvatars_Hair.001']} skeleton={nodes.UnionAvatars_Hair.skeleton} />
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

useGLTF.preload('/avatars/adamishere.glb')