"use client";

import { React, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
// use cards from auth pages
import "@/styles/Auth.css";
import "@/styles/Settings.css";

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null); // Store user data

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleBack = () => {
    if (window.history.length > 1 && typeof window !== "undefined") {
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
          <span>Back to Main Page</span>
        </button>
      </div>

      {/* Logo */}
      <div className="logo"></div>

      {/* Left side */}
      <div className='split left'>
        <div className='left-form'>
          <div className="font-bold form-heading">Profile Information</div>
          {/* need to check whether user is null! */}
          {user ? (
            <>
              <div className="mt-8 text-white font-bold">Username:</div>
              <div className="text-gray-400">{user.username}</div>
              <div className="mt-8 text-white font-bold">Email:</div>
              <div className="text-gray-400">{user.email}</div>
            </>
          ) : (
            <div className="mt-4 text-gray-300">Loading user data...</div>
          )}
          {/* Developer Tools button */}
          <Link href="/developer-tools">
            <button className="mt-20 bg-violet-800 hover:bg-violet-900 text-white py-2 px-4 rounded">
              Open Developer Mode
            </button>
          </Link>
        </div>
      </div>

      {/* Right side */}
      <div className='split right'>
        <div className='right-form'>
          <div className="font-bold form-heading">User Settings</div>
        </div>
      </div>

    </div>
  );
}