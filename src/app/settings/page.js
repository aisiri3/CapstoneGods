"use client";

import { React, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import "@/styles/Auth.css";
import "@/styles/Settings.css";

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null); // Store user data
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls

  // To change password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    // Clear the "same password" error when user starts typing a new password
    if (passwordError.includes("same as the current password")) {
      setPasswordError('');
    }
    validatePasswords(e.target.value, confirmNewPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmNewPassword(e.target.value);
    // Clear the "same password" error when user starts typing a new confirmation
    if (passwordError.includes("same as the current password")) {
      setPasswordError('');
    }
    validatePasswords(newPassword, e.target.value);
  };

  const validatePasswords = (password, confirmPassword) => {
    // Only clear validation messages if there are no current API error messages
    // This ensures API errors like "same password" don't get overwritten during typing
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
      // Only set success message if there's no API error about same password
      if (!passwordError.includes("same as the current password")) {
        setPasswordSuccess('Passwords match and are valid!');
      }
      return true;
    }
    
    return false;
  };

  const handleSavePassword = async () => {
    if (validatePasswords(newPassword, confirmNewPassword)) {
      try {
        setIsLoading(true);
        
        // Clear the success message before API call
        setPasswordSuccess('');
        
        // Make API call to update password
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.user_id, // Assuming your user object has user_id field
            new_password: newPassword,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          // Check if it's the same password error (this is expected behavior, not an exception)
          if (result.error === "New password cannot be the same as the current password") {
            setPasswordSuccess(''); // Clear any success message
            setPasswordError(result.error);
            return;
          }
          // For other errors, throw an exception
          throw new Error(result.error || 'Failed to update password');
        }
        
        // Password updated successfully
        setPasswordError(''); // Clear any error message
        setPasswordSuccess('Password updated successfully!');
        console.log('Password updated successfully');
        
        // Clear the form after successful validation
        setTimeout(() => {
          setNewPassword('');
          setConfirmNewPassword('');
          setPasswordSuccess('');
        }, 3000);
        
      } catch (error) {
        console.error('Error updating password:', error);
        setPasswordSuccess(''); // Clear any success message
        setPasswordError(error.message || 'An error occurred while updating your password');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
      <div className="logo z-20"></div>

      {/* Left side */}
      <div className='split left'>
      <div className='left-form z-1'>
        <div className="left-heading font-bold text-center">Profile Information</div>

        <div className="left-content-wrapper">
            <div className="left-content">
                {/* Placeholder user icon */}
                <Image
                  className="user-placeholder object-center"
                  src="/icons/user-placeholder.png"
                  alt="User"
                  width={200}
                  height={200}
                  priority
                />

                {/* Display user info */}
                {user ? (
                  <>
                    <div className="mt-10 font-bold text-xl text-gray-100">{user.username}</div>
                    <div className="text-l text-gray-400">{user.email}</div>
                  </>
                ) : (
                  <div className="mt-4 text-gray-300">Loading user data...</div>
                )}

                {/* Log out button */}
                <button
                    onClick={() => {
                      localStorage.removeItem("user");
                      router.push('/auth/signin');
                    }}
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

      {/* Right side */}
      <div className='split right'>
        <div className='right-form z-10'>
          {/* User Settings -- Change password + Log out */}
          <div className="right-heading font-bold text-center">User Settings</div>
          

          <div className="right-content-wrapper">
          <div className="subheading mb-6 font-bold text-gray-300 text-left">Change Password</div>

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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? 
                    <EyeOff size={18} className="text-gray-600" /> : 
                    <Eye size={18} className="text-gray-600" />
                  }
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div className="mt-6">
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
              disabled={isLoading}
              className={`mt-5 mb-5 ${isLoading ? 'bg-gray-500' : 'bg-violet-800 hover:bg-violet-900'} text-white py-2 px-4 w-60 rounded`}
            >
              {isLoading ? 'Updating...' : 'Save New Password'}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}