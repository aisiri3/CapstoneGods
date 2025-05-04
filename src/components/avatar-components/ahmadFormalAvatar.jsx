/**
 * Ahmad Avatar Component (Professional)
 * 
 * Renders Ahmad, the avatar for Malay, Male, Professional settings.
 * A 3D avatar component that handles facial animations, lip syncing, and audio playback.
 * 
 */

import React, { useEffect, useRef, useState } from 'react'
import { useGraph } from '@react-three/fiber'
import { useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { LipSyncController } from './lipsyncController'

export function AhmadFormal({ lipSyncData, audioUrl, position, rotation, scale, isFiller }) {
  const headMeshRef = useRef();
  const audioRef = useRef(null);
  const { scene } = useGLTF('/avatars/HeyAhmad.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const group = useRef()
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [introLipSyncData, setIntroLipSyncData] = useState(null);
  const [activeAudio, setActiveAudio] = useState('intro');
  const [activeLipSync, setActiveLipSync] = useState(null);

  useEffect(() => {
    fetch('/intros/malay-male-professional-intro.json')
      .then(response => response.json())
      .then(data => {
        setIntroLipSyncData(data.mouthCues);
        setActiveLipSync(data.mouthCues);
      })
      .catch(error => {
      });
  }, []);

  const { animations: idleAnimation } = useFBX("/animations/ahmad/Idle.fbx")
  const { animations: talkingAnimation } = useFBX("/animations/ahmad/Long Talking.fbx")
  const { animations: wavingAnimation } = useFBX("/animations/ahmad/Waving.fbx")
  
  idleAnimation[0].name = "Idle"
  talkingAnimation[0].name = "Talking"
  wavingAnimation[0].name = "Waving"

  const cleanupAudio = () => {
    if (audioRef.current) {
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
      return;
    }
    
    try {
      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileLeft"]
      ] = 0.8;

      nodes.UnionAvatars_Head_1.morphTargetInfluences[
        nodes.UnionAvatars_Head_1.morphTargetDictionary["mouthSmileRight"]
      ] = 0.8;
      
      setIsInitialized(true);
    } catch (e) {
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
      cleanupAudio();
    };
  }, []);

  const startAudioPlayback = (url, audioType, lipsyncData) => {
    const audio = new Audio();
    audio.src = url;
    
    audio.onloadedmetadata = () => {
    };
    
    audio.oncanplay = () => {
    };
    
    audio.onplay = () => {
      setIsPlaying(true);
      setActiveLipSync(lipsyncData);
      setAnimation("Talking");
    };
    
    audio.onended = () => {
      setIsPlaying(false);
      setAnimation("Idle");
      
      if (activeAudio === 'intro' && !audioType.includes('filler')) {
        setActiveAudio('response');
      }
    };
    
    audio.onerror = (e) => {
      setIsPlaying(false);
      setAnimation("Idle");
    };
    
    audioRef.current = audio;
    
    const playWithRetry = (retries = 3) => {
      audio.play().catch(err => {
        if (retries > 0) {
          setTimeout(() => playWithRetry(retries - 1), 100);
        } else {
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
      const introAudio = new Audio('/intros/malay-male-professional-intro.wav');
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
    cleanupAudio();
    
    if (!audioUrl) {
      setIsPlaying(false);
      setAnimation("Idle");
      return;
    }

    const audioType = isFiller ? 'filler' : 'response';
    
    if (!isFiller) {
      setTimeout(() => {
        startAudioPlayback(audioUrl, audioType, lipSyncData);
      }, 300);
    } else {
      startAudioPlayback(audioUrl, audioType, lipSyncData);
    }
  }, [audioUrl, lipSyncData, isFiller]);

  useEffect(() => {
    if (actions && actions[animation]) {
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
        <primitive object={nodes.Armature} />
        <skinnedMesh 
          geometry={nodes.UnionAvatars_Body.geometry} 
          material={materials.UnionAvatars_Body} 
          skeleton={nodes.UnionAvatars_Body.skeleton} 
        />
        <skinnedMesh 
          geometry={nodes.UnionAvatars_Bottom.geometry} 
          material={materials.UnionAvatars_Bottom} 
          skeleton={nodes.UnionAvatars_Bottom.skeleton} 
        />
        <skinnedMesh 
          geometry={nodes.UnionAvatars_Hair.geometry} 
          material={materials.UnionAvatars_Hair} 
          skeleton={nodes.UnionAvatars_Hair.skeleton} 
        />
        <skinnedMesh 
          geometry={nodes.UnionAvatars_Shoes.geometry} 
          material={materials.UnionAvatars_Shoes} 
          skeleton={nodes.UnionAvatars_Shoes.skeleton} 
        />
        <skinnedMesh 
          geometry={nodes.UnionAvatars_Top.geometry} 
          material={materials.UnionAvatars_Top} 
          skeleton={nodes.UnionAvatars_Top.skeleton} 
        />
  
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
  
        <group name="UnionAvatars_Head">
          <skinnedMesh 
            name="UnionAvatars_Head_2" 
            geometry={nodes.UnionAvatars_Head_2.geometry} 
            material={materials.UnionAvatars_Body} 
            skeleton={nodes.UnionAvatars_Head_2.skeleton} 
            morphTargetDictionary={nodes.UnionAvatars_Head_2.morphTargetDictionary} 
            morphTargetInfluences={nodes.UnionAvatars_Head_2.morphTargetInfluences} 
          />
          <skinnedMesh 
            name="UnionAvatars_Head_3" 
            geometry={nodes.UnionAvatars_Head_3.geometry} 
            material={materials.v3_phr_unionavatars_eye_ball_d} 
            skeleton={nodes.UnionAvatars_Head_3.skeleton} 
            morphTargetDictionary={nodes.UnionAvatars_Head_3.morphTargetDictionary} 
            morphTargetInfluences={nodes.UnionAvatars_Head_3.morphTargetInfluences} 
          />
        </group>
      </group>
    )
  }
  
  useGLTF.preload('/avatars/HeyAhmad.glb')