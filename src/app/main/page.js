"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import "@/styles/MainPage.css";
import { Environment, OrbitControls } from '@react-three/drei';
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// import avatars (casual & professional)
// Make sure these imports match your export style (default exports or named exports)
import { Ahmad } from "@/components/avatar-components/ahmadAvatar";
// Fix this import to match your export style
import { AhmadFormal } from '@/components/avatar-components/ahmadFormalAvatar';
import { Lana2Formal } from '@/components/avatar-components/LanaFormal2Avatar';
import { Lana2Avatar } from '@/components/avatar-components/Lana2Avatar';
import { Adam } from "@/components/avatar-components/adamAvatar";
import { AdamFormal } from '@/components/avatar-components/adamFormalAvatar';
import { Maya } from '@/components/avatar-components/mayaAvatar';
import { MayaFormal } from '@/components/avatar-components/mayaFormalAvatar';

export default function MainPage() {
  // Shared state for avatar data
  const [avatarState, setAvatarState] = useState({
    lipSync: null,
    audioUrl: null,
    response: "",
    isFiller: false
  });

  // State to store current avatar selection
  const [avatarSelection, setAvatarSelection] = useState({
    gender: "Male", 
    persona: "Casual", 
    language: "English"
  });

  // State to toggle video fade-in animation
  const [videoKey, setVideoKey] = useState(0);
  
  // State to toggle avatar component remounting
  const [avatarKey, setAvatarKey] = useState(0);

  // Reference to the video element for controlling playback
  const videoRef = useRef(null);
  
  // Reference to any audio elements that need to be cleaned up
  const activeAudioRef = useRef(null);

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
      responseLength: data.response ? data.response.length : 0,
      isFiller: !!data.isFiller
    });
    
    // If this is response audio (not a filler), make sure to clean up first
    if (!data.isFiller && data.audioUrl) {
      // Clean up any existing audio URLs
      if (activeAudioRef.current) {
        console.log("Cleaning up previous audio before response");
        URL.revokeObjectURL(activeAudioRef.current);
        activeAudioRef.current = null;
      }
      
      // Add a small delay before setting the new audio to ensure the avatar is ready
      setTimeout(() => {
        console.log("Setting response audio after delay");
        setAvatarState({
          lipSync: data.lipSync,
          audioUrl: data.audioUrl,
          response: data.response || "",
          isFiller: false
        });
      }, 100);
      
      // Store a reference to the audio URL for later cleanup
      if (data.audioUrl.startsWith('blob:')) {
        activeAudioRef.current = data.audioUrl;
      }
    } else if (data.audioUrl === null && data.lipSync === null) {
      // This is a reset signal
      console.log("Received reset signal");
      setAvatarState({
        lipSync: null,
        audioUrl: null,
        response: "",
        isFiller: false
      });
    } else {
      // For fillers, update immediately
      setAvatarState({
        lipSync: data.lipSync,
        audioUrl: data.audioUrl,
        response: data.response || "",
        isFiller: !!data.isFiller
      });
    }
  };

  // Function to clean up audio resources
  const cleanupAudioResources = () => {
    if (activeAudioRef.current && activeAudioRef.current.startsWith('blob:')) {
      console.log("Cleaning up audio URL:", activeAudioRef.current);
      URL.revokeObjectURL(activeAudioRef.current);
      activeAudioRef.current = null;
    }
  };

  // Get background video source based on persona
  const getBackgroundVideo = () => {
    return avatarSelection.persona === "Professional" 
      ? "backgrounds/office-background.mp4" 
      : "backgrounds/cafe-background.mp4";
  };

  // Load saved avatar selection from localStorage on initial render
  useEffect(() => {
    try {
      const storedSelections = JSON.parse(localStorage.getItem("userSelections"));
      if (storedSelections) {
        setAvatarSelection(storedSelections);
        console.log("Loaded avatar selection from localStorage:", storedSelections);
      }
    } catch (error) {
      console.error("Error loading stored selections:", error);
    }

    // Listen for avatar selection changes from the sidebar
    const handleSelectionChange = (event) => {
      console.log("Avatar selection changed:", event.detail);
      
      // Clean up any existing audio URLs
      cleanupAudioResources();
      
      // Reset avatar state
      setAvatarState({
        lipSync: null,
        audioUrl: null,
        response: "",
        isFiller: false
      });
      
      // Update selection
      setAvatarSelection(event.detail);
      
      // Increment keys to force remounting of components
      setVideoKey(prevKey => prevKey + 1);
      setAvatarKey(prevKey => prevKey + 1);
    };

    window.addEventListener('avatarSelectionChanged', handleSelectionChange);

    return () => {
      window.removeEventListener('avatarSelectionChanged', handleSelectionChange);
      cleanupAudioResources();
    };
  }, []);

  // Handle video playback when background changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.log("Autoplay failed. User interaction required.");
      });
    }
  }, [avatarSelection.persona, videoKey]);

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
          return Lana2Avatar;
        } else { // Professional
          return Lana2Formal;
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

  // Get avatar positioning based on persona
  const getAvatarPosition = () => {
    if (avatarSelection.persona === "Casual") {
      return {
        position: [-0.55, -3.05, 5],
        rotation: [0, Math.PI * 0.06, 0],
        scale: 2
      };
    } else { // Professional
      return {
        position: [-0.55, -3.05, 5],
        rotation: [0, Math.PI * 0.06, 0],
        scale: 2
      };
    }
  };

  const avatarProps = getAvatarPosition();

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
        <video 
          key={videoKey} // This forces a complete re-render when changed
          id="bg-video" 
          className="video-background" 
          autoPlay 
          loop 
          muted
          disablePictureInPicture
          ref={videoRef}
        >
          <source src={getBackgroundVideo()} type="video/mp4" />
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
            <ambientLight intensity={1} />

            {/* Light to shine in avatar's face */}
            <directionalLight 
              castShadow
              position={[5, 4, 50]} 
              intensity={1.5} 
            />

            {/* Extra light to shine above and behind the head */}
            <directionalLight 
              castShadow
              position={[-10, 80, -20]} 
              intensity={2.5} 
            />
            
            {/* Dynamic avatar component based on selection */}
            {/* Key forces complete remount when selection changes */}
            <CurrentAvatar
              key={avatarKey}
              lipSyncData={avatarState.lipSync} 
              audioUrl={avatarState.audioUrl}
              position={avatarProps.position}
              rotation={avatarProps.rotation}
              scale={avatarProps.scale}
              isFiller={avatarState.isFiller}
            />
          </Canvas>
        </div>

        {/* Chat panel on the right */}
        <div className="chat-panel">
          <Chat 
            key={avatarKey} // Force Chat component to reset when avatar changes
            onAvatarStateChange={handleAvatarUpdate} 
          /> 
        </div>
      </div>
    </div>
  );
}