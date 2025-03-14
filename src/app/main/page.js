"use client";

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import "@/styles/MainPage.css";
import { Environment, OrbitControls } from '@react-three/drei';
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// import avatars (casual & professional)
import { Ahmad } from "@/components/avatar-components/ahmadAvatar";
import { AhmadFormal } from '@/components/avatar-components/ahmadFormalAvatar';
import { Lana } from "@/components/avatar-components/lanaAvatar";
import { LanaFormal } from '@/components/avatar-components/lanaFormalAvatar';
import { Adam } from "@/components/avatar-components/adamAvatar";
import { AdamFormal } from '@/components/avatar-components/adamFormalAvatar';
import { Maya } from '@/components/avatar-components/mayaAvatar';
import { MayaFormal } from '@/components/avatar-components/mayaFormalAvatar';

export default function MainPage() {
  // Shared state for avatar data
  const [avatarState, setAvatarState] = useState({
    lipSync: null,
    audioUrl: null,
    response: ""
  });

  // State to store current avatar selection
  const [avatarSelection, setAvatarSelection] = useState({
    gender: "Male", 
    persona: "Casual", 
    language: "English"
  });

  const EnableShadows = () => {
    const { gl } = useThree();
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    return null;
  };

  // Callback to update avatar data when Chat gets new info from backend
  const handleAvatarUpdate = (data) => {
    console.log("Main page received avatar update:", {
      lipSyncAvailable: !!data.lipSync,
      audioUrlAvailable: !!data.audioUrl,
      responseLength: data.response ? data.response.length : 0
    });
    
    setAvatarState(data);
  };

  // Load saved avatar selection from localStorage on initial render
  useEffect(() => {
    const storedSelections = JSON.parse(localStorage.getItem("userSelections"));
    if (storedSelections) {
      setAvatarSelection(storedSelections);
      console.log("Loaded avatar selection from localStorage:", storedSelections);
    }

    // Listen for avatar selection changes from the sidebar
    const handleSelectionChange = (event) => {
      console.log("Avatar selection changed:", event.detail);
      setAvatarSelection(event.detail);
    };

    window.addEventListener('avatarSelectionChanged', handleSelectionChange);

    return () => {
      window.removeEventListener('avatarSelectionChanged', handleSelectionChange);
    };
  }, []);

  // Function to determine which avatar component to render based on selection
  const getAvatarComponent = () => {
    const { gender, persona, language } = avatarSelection;
    
    // Map selections to avatar components
    if (gender === "Male") {
      if (language === "English") {
        if (persona === "Casual") {
          return Adam;
        } else { // Professional
          return AdamFormal;
        }
      } else { // Malay
        if (persona === "Casual") {
          return Ahmad;
        } else { // Professional
          return AhmadFormal;
        }
      }
    } else { // Female
      if (language === "English") {
        if (persona === "Casual") {
          return Lana;
        } else { // Professional
          return LanaFormal;
        }
      } else { // Malay
        if (persona === "Casual") {
          return Maya;
        } else { // Professional
          return MayaFormal;
        }
      }
    }
  };

  // Get the appropriate avatar component
  const CurrentAvatar = getAvatarComponent();

  // TODO: Confirm this: Get avatar positioning based on persona
  const getAvatarPosition = () => {
    if (avatarSelection.persona === "Casual") {
      return {
        position: [-0.6, -3.05, 5],
        rotation: [0, Math.PI * 0.06, 0],
        scale: 2
      };
    } else { // Professional
      return {
        position: [-0.6, -3.05, 5],
        rotation: [0, Math.PI * 0.06, 0],
        scale: 2
      };
    }
  };

  const avatarProps = getAvatarPosition();

  window.addEventListener("load", function () {
    let video = document.getElementById("bg-video");
    video.play().catch(error => {
      console.log("Autoplay failed. User interaction required.");
    });
  });  

  // Force layout recalculation on page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("resize"));
    }
  }, []);

  return (
    <div>
      <div>
        <Sidebar />
      </div>

      <div className="logo"></div>

      {/* Main container for avatar and chat */}
      <div className="main-container">
        <video id="bg-video" className='video-background' autoPlay loop muted>
          <source src="backgrounds/cafe-background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Full-page avatar container */}
        <div className="avatar-container">
          <Canvas 
            shadows 
            camera={{ position: [0, 0, 8], fov: 30 }}
            style={{ background: 'transparent' }}
          >
            <EnableShadows />
            <OrbitControls 
              enableZoom={false} // Disable zooming
              enablePan={false} // Also disable panning
              enableRotate={false} // Disable rotation
            />
            <ambientLight intensity={0.8} />
            <directionalLight 
              castShadow
              position={[10, 10, 5]} 
              intensity={1.5} 
            />
            
            {/* Dynamic avatar component based on selection */}
            <CurrentAvatar
              lipSyncData={avatarState.lipSync} 
              audioUrl={avatarState.audioUrl}
              position={avatarProps.position}
              rotation={avatarProps.rotation}
              scale={avatarProps.scale}
            />
          </Canvas>
        </div>

        {/* Chat panel on the right */}
        <div className="chat-panel">
          <Chat onAvatarStateChange={handleAvatarUpdate} /> 
        </div>
      </div>
    </div>
  );
}