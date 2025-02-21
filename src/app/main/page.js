"use client";

import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import "@/styles/MainPage.css";
import { Environment, OrbitControls } from '@react-three/drei';

// import avatars
import { Ahmad } from "@/components/ahmadAvatar";

export default function MainPage() {
  // Force layout recalculation on page load (for changing avatars, etc.)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("resize"));
    }
  }, []);

  return (
    <div>
        {/* <Sidebar />  */}
        <div>
            <Sidebar />
        </div>

        <div className="logo"></div>

        {/* avatar + chatbox */}
        {/* avatar + chatbox */}
        <div className="main-container">
        {/* <div className="w-full overflow-x-auto bg-accent"> */}

          {/* Avatar */}
          <div className="split left">
            {/* Controls: decrease fov to zoom in */}
            <Canvas shadows camera={{ position: [0, 0, 8], fov: 30 }} style={{ background: 'transparent' }}>
              <OrbitControls />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <Ahmad position={[0, -3, 5]} scale={2}/>         
            </Canvas>
          </div>

          {/* Chatbox */}
          <div className="split right">
            <Chat /> 
          </div>

        </div>
    </div>
  );
}
