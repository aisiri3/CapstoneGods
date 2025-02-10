"use client";

import React, { useEffect } from 'react';
import Chat from "@/components/Chat";
import Avatar from "@/components/Avatar";
import Sidebar from "@/components/Sidebar";
import "@/styles/MainPage.css";

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

        <div className="main-container">
        {/* <div className="w-full overflow-x-auto bg-accent"> */}

          {/* Avatar */}
          <div className="split left">
            {/* TODO: Replace with actual avatar from Avatar.js */}
            <div className="temp-avatar casual-img"></div>
          </div>

          {/* Chatbox */}
          <div className="split right">
            <Chat /> 
          </div>

        </div>
    </div>
  );
}
