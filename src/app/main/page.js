"use client";

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import "@/styles/MainPage.css";
import { Environment, OrbitControls } from '@react-three/drei';
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// import avatars
import { Ahmad } from "@/components/ahmadAvatar";

export default function MainPage() {
  // Shared state for avatar data (lipSync and optionally response text)
  const [avatarData, setAvatarData] = useState({ lipSync: null, response: "" });

  const EnableShadows = () => {
    const { gl } = useThree();
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    return null;
  };

  // Callback to update avatar data when Chat gets new info from backend
  const handleAvatarUpdate = (data) => {
    setAvatarData(data);
  };

  // Force layout recalculation on page load (for changing avatars, etc.)
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
            <Ahmad 
              lipSyncData={avatarData.lipSync} 
              audioUrl={avatarData.audioUrl} 
              position={[-0.6, -3.05, 5]} /* Positioned further left */
              rotation={[0, Math.PI * 0.06, 0]}
              scale={2}
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