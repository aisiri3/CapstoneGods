import React, { Suspense, useEffect, useRef, useState } from 'react'
import { useGraph } from '@react-three/fiber'
import { Environment, OrbitControls, useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { LipSyncController } from './lipsyncController'
import { SpeechController } from './SpeechSync'

export function Ahmad(props) {
  const headMeshRef = useRef();
  const { scene } = useGLTF('/avatars/HeyAhmad.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const group = useRef()

  // Load and name animations
  const { animations: idleAnimation } = useFBX("/animations/Breathing Idle.fbx")
  const { animations: talkingAnimation } = useFBX("/animations/Talking.fbx")
  const { animations: wavingAnimation } = useFBX("/animations/Waving.fbx")
  
  idleAnimation[0].name = "Idle"
  talkingAnimation[0].name = "Talking"
  wavingAnimation[0].name = "Waving"

  // // Debug model structure
  // useEffect(() => {
  //   console.log("Model structure:", {
  //     armature: nodes.Armature,
  //     bones: nodes.Armature?.children,
  //     hips: nodes.Armature?.getObjectByName('Hips')
  //   })
  // }, [nodes])

  // Create speech controller
  const speech = SpeechController({
    meshRef: headMeshRef,
    audioUrl: '/audios/casual-female-intro.wav',
    lipSyncUrl: '/audios/casual-female-intro.json'
  });

  const { actions } = useAnimations(
    [idleAnimation[0], talkingAnimation[0], wavingAnimation[0]], 
    group
  )

  const [animation, setAnimation] = useState("Talking")
  const [lipSyncData, setLipSyncData] = useState(null);

  useEffect(() => {
    // Load the JSON file
    fetch('/audios/casual-female-intro.json')
      .then(res => res.json())
      .then(data => setLipSyncData(data.mouthCues));
  }, []);

  useEffect(() => {
    console.log(nodes.UnionAvatars_Head_1.morphTargetDictionary)
  }, []);

  useEffect(() => {
    if (actions && actions[animation]) {
      // Fade out any currently running animations
      Object.values(actions).forEach(action => {
        if (action.isRunning()) {
          action.fadeOut(0.5)
        }
      })

      // Play the new animation
      actions[animation].reset().fadeIn(0.5).play()

      return () => {
        if (actions[animation]) {
          actions[animation].fadeOut(0.5)
        }
      }
    }
  }, [animation, actions])

  // Start speech when component mounts
  useEffect(() => {
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      speech.startSpeech();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <group {...props} dispose={null} ref={group}>
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

      {/* claude inssert */}
      <skinnedMesh 
        ref={headMeshRef}
        name="UnionAvatars_Head_1"
        geometry={nodes.UnionAvatars_Head_1.geometry}
        material={materials.v3_phr_unionavatars_head_d}
        skeleton={nodes.UnionAvatars_Head_1.skeleton}
        morphTargetDictionary={nodes.UnionAvatars_Head_1.morphTargetDictionary}
        morphTargetInfluences={nodes.UnionAvatars_Head_1.morphTargetInfluences}
      />
      <LipSyncController 
        meshRef={headMeshRef}
        rhubarbData={lipSyncData}
      />

      <group name="UnionAvatars_Head">
        <skinnedMesh 
          name="UnionAvatars_Head_1" 
          geometry={nodes.UnionAvatars_Head_1.geometry} 
          material={materials.v3_phr_unionavatars_head_d} 
          skeleton={nodes.UnionAvatars_Head_1.skeleton} 
          morphTargetDictionary={nodes.UnionAvatars_Head_1.morphTargetDictionary} 
          morphTargetInfluences={nodes.UnionAvatars_Head_1.morphTargetInfluences} 
        />
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
