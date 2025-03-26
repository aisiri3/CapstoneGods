"use client";

import { React, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import "@/styles/Settings.css";
import ChatbotEvaluationDashboard from '@/components/ChatbotEvaluationDashboard';

export default function DeveloperTools() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back(); // Go back if there is history
    } else {
      router.push('/'); // Redirect to home if no history
    }
  };

  return (
    <div className="settings-container">

      {/* Back button */}
      <div className="back-button">
        <button
          onClick={handleBack}
          className="flex items-center text-white hover:text-gray-500"
        >
          <ArrowLeft size={40} className="mr-2" />
          <span>Back to Settings</span>
        </button>
      </div>

      <ChatbotEvaluationDashboard />

      {/* Logo */}
      <div className="logo"></div>


    </div>
  );
}