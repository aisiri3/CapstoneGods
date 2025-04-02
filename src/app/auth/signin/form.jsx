'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from 'lucide-react';
import { setAuth } from '@/utils/auth';
import "@/styles/Auth.css";

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block mt-2 text-sm font-medium text-gray-300">
      {children}
    </label>
  );
}

function Input({ id, name, type = 'text', placeholder, value, onChange, required, className = "" }) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`mt-1 block w-full px-3 py-2 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 ${className}`}
    />
  );
}

function Button({ children, type = 'button', className, ariaDisabled, onClick, disabled }) {
  return (
    <button
      type={type}
      className={`px-4 py-2 ${disabled ? 'bg-gray-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${className}`}
      aria-disabled={ariaDisabled || disabled}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const data = {
      email,
      password,
    };

    try {
      console.log('Sending login request...');
      
      // Send login data to the server
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Instead of throwing an error, just set the error message and return early
        setError(result.error || "Wrong email or password, please try again");
        setIsLoading(false);
        return;
      }

      console.log('Login successful', result);

      // Check if we have the user data (token might not be visible due to HttpOnly)
      if (!result.user) {
        // Instead of throwing, set error and return
        setError('Invalid response from server: missing user data');
        setIsLoading(false);
        return;
      }

      // Store auth data - this sets the cookie and localStorage
      setAuth(result.token, result.user);
      
      console.log('Auth data stored, redirecting...');
      
      // Force direct navigation instead of router.push
      window.location.href = "/main";
      
    } catch (err) {
      // This catch block will only handle network errors or JSON parsing errors
      console.error('Login error:', err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-700">{error}</p>}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          name="email" 
          placeholder="john@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input 
            id="password" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10" // Add padding to the right for the eye icon
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 focus:outline-none"
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

      <Button 
        type="submit" 
        className="mt-8 w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}

// You can remove this component if not needed
export function SignInButton() {
  const handleSignIn = (event) => {
    event.preventDefault();
    window.location.href = "/main";
  };

  return (
    <Button type="submit" className="mt-8 w-full" onClick={handleSignIn}>
      Sign In
    </Button>
  );
}