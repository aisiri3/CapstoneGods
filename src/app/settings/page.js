"use client";

import { React, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { removeAuth, getUser, authHeader } from '@/utils/auth';
import "@/styles/Auth.css";
import "@/styles/Settings.css";
import withAuth from '@/components/withAuth';

function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password state variables
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [currentPasswordMessage, setCurrentPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Get user data from auth utilities
    const userData = getUser();
    if (!userData) {
      // No user data found, redirect to login
      router.push('/auth/signin');
    } else {
      setUser(userData);
    }
  }, [router]);

  const handleBack = () => {
    if (window.history.length > 1 && typeof window !== "undefined") {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Handle logout properly using auth utilities
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await removeAuth(); // Remove auth token and user data (async)
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to redirect even if there's an error
      router.push('/auth/signin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value);
    // Reset verification status when the current password changes
    setCurrentPasswordVerified(false);
    setCurrentPasswordMessage('');
  };

  // Verify the current password
  const verifyCurrentPassword = async () => {
    if (!currentPassword.trim()) {
      setCurrentPasswordMessage('Please enter your current password');
      setCurrentPasswordVerified(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(), // Add auth header
        },
        body: JSON.stringify({
          user_id: user.user_id,
          password: currentPassword,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        setCurrentPasswordMessage('The password you entered is incorrect. Please enter the correct password.');
        setCurrentPasswordVerified(false);
      } else {
        setCurrentPasswordMessage('Current password entered is correct! Proceed to change your password below.');
        setCurrentPasswordVerified(true);
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setCurrentPasswordMessage('An error occurred while verifying your password. Please try again.');
      setCurrentPasswordVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Password-related functions
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    // Reset error specifically about same password but keep verification status
    if (passwordError.includes("same as the current password")) {
      setPasswordError('');
    }
    validatePasswords(e.target.value, confirmNewPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmNewPassword(e.target.value);
    // Reset error specifically about same password but keep verification status
    if (passwordError.includes("same as the current password")) {
      setPasswordError('');
    }
    validatePasswords(newPassword, e.target.value);
  };

  const validatePasswords = (password, confirmPassword) => {
    // Reset errors and success messages except for "same as current password" error
    if (!passwordError.includes("same as the current password")) {
      setPasswordError('');
      setPasswordSuccess('');
    }
    
    if (password.length > 0 && password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    if (password.length >= 8 && password === confirmPassword && confirmPassword.length > 0) {
      if (!passwordError.includes("same as the current password")) {
        setPasswordSuccess('Passwords match and are valid!');
      }
      return true;
    }
    
    return false;
  };

  const handleSavePassword = async () => {
    // First check if current password has been verified
    if (!currentPasswordVerified) {
      setPasswordError('Please verify your current password first');
      return;
    }

    // Then validate the new passwords
    if (validatePasswords(newPassword, confirmNewPassword)) {
      try {
        setIsLoading(true);
        setPasswordSuccess('');
        
        // Include authentication headers
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(), // Add auth header
          },
          body: JSON.stringify({
            user_id: user.user_id,
            current_password: currentPassword, // Send current password for additional verification
            new_password: newPassword,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          if (result.error === "New password cannot be the same as the current password") {
            setPasswordSuccess('');
            setPasswordError(result.error);
            return;
          }
          throw new Error(result.error || 'Failed to update password');
        }
        
        setPasswordError('');
        setPasswordSuccess('Password updated successfully!');
        console.log('Password updated successfully');
        
        // Reset fields after success
        setTimeout(() => {
          setCurrentPassword('');
          setCurrentPasswordVerified(false);
          setCurrentPasswordMessage('');
          setNewPassword('');
          setConfirmNewPassword('');
          setPasswordSuccess('');
        }, 3000);
        
      } catch (error) {
        console.error('Error updating password:', error);
        setPasswordSuccess('');
        setPasswordError(error.message || 'An error occurred while updating your password');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // JSX for the component
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
      <div className="logo z-20"></div>

      {/* Left side */}
      <div className='split left'>
        {/* User profile information */}
        <div className='left-form z-1'>
          <div className="left-heading font-bold text-center">Profile Information</div>

          <div className="left-content-wrapper">
            <div className="left-content">
              {/* User image and info */}
              <Image
                className="user-placeholder object-center"
                src="/icons/user-placeholder.png"
                alt="User"
                width={200}
                height={200}
                priority
              />

              {user ? (
                <>
                  <div className="mt-10 font-bold text-xl text-gray-100">{user.username}</div>
                  <div className="text-l text-gray-400">{user.email}</div>
                </>
              ) : (
                <div className="mt-4 text-gray-300">Loading user data...</div>
              )}

              {/* Log out button - Updated to use handleLogout */}
              <button
                onClick={handleLogout}
                className="mt-10 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-40"
              >
                Log Out
              </button>

              {/* Developer Tools button */}
              <Link href="/developer-tools">
                <button className="mt-5 bg-violet-800 hover:bg-violet-900 text-white py-2 px-4 rounded">
                  Open Developer Mode
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Password Change */}
      <div className='split right'>
        <div className='right-form z-10'>
          <div className="right-heading font-bold text-center">User Settings</div>
          
          <div className="right-content-wrapper">
            <div className="subheading mb-6 font-bold text-gray-300 text-left">Change Password</div>

            {/* Current password with verify button */}
            <div className="mt-4">
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-300">
                Enter and verify your current password:
              </label>
              <div className="flex items-start gap-2">
                <div className="relative password-input-container">
                  <input 
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                    placeholder="Current password..."
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle-btn"
                    style={{ color: "#4B5563" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? 
                      <Eye size={18} style={{ color: "#4B5563" }} /> : 
                      <EyeOff size={18} style={{ color: "#4B5563" }} />
                    }
                  </button>
                </div>
                <button
                  onClick={verifyCurrentPassword}
                  disabled={isLoading || !currentPassword}
                  className={`mt-1 ${isLoading ? 'bg-gray-500' : !currentPassword ? 'bg-gray-500' : 'bg-violet-800 hover:bg-violet-900'} text-white py-2 px-4 rounded`}
                >
                  Verify
                </button>
              </div>
              {/* Current password verification message */}
              {currentPasswordMessage && (
                <div className={`mt-2 text-sm ${currentPasswordVerified ? 'text-green-500' : 'text-amber-500'}`}>
                  {currentPasswordMessage}
                </div>
              )}
            </div>

            {/* New password */}
            <div className="mt-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="relative password-input-container">
                <input 
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  placeholder="Enter new password"
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle-btn"
                  style={{ color: "#4B5563" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? 
                    <Eye size={18} style={{ color: "#4B5563" }} /> : 
                    <EyeOff size={18} style={{ color: "#4B5563" }} />
                  }
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div className="mt-5">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <div className="relative password-input-container">
                <input 
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm new password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Error or success message */}
            {passwordError && (
              <div className="mt-4 text-red-500 text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="mt-4 text-green-500 text-sm">{passwordSuccess}</div>
            )}

            {/* Save button */}
            <button
              onClick={handleSavePassword}
              disabled={isLoading || !currentPasswordVerified || !newPassword || !confirmNewPassword}
              className={`mt-5 mb-5 ${isLoading || !currentPasswordVerified || !newPassword || !confirmNewPassword ? 'bg-gray-500' : 'bg-violet-800 hover:bg-violet-900'} text-white py-2 px-4 w-60 rounded`}
            >
              {isLoading ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Settings);