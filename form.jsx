'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import "@/styles/Auth.css";

// Reuse the Label, Input, and Button components from the register form
function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block mt-2 text-sm font-medium text-gray-300">
      {children}
    </label>
  );
}

function Input({ id, name, type = 'text', placeholder }) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      className="mt-1 block w-full px-3 py-2 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
    />
  );
}

function Button({ children, type = 'button', className, ariaDisabled, onClick }) {
  return (
    <button
      type={type}
      className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${className}`}
      aria-disabled={ariaDisabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState(null);  // Store error messages
  const [isLoading, setIsLoading] = useState(false);  // Add loading state

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);  // Reset error
    setIsLoading(true);  // Start loading

    const formData = new FormData(event.target);
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      // Send login data to the new JWT API
      const response = await fetch('http://127.0.0.1:3001/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Authentication failed. Please check your credentials.");
      }

      // Store JWT token in localStorage
      localStorage.setItem("token", result.token);
      
      // Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(result.user));
      
      // Set the Authorization header for future requests
      const authHeader = `Bearer ${result.token}`;
      localStorage.setItem("authHeader", authHeader);

      console.log("Login successful");
      
      // Redirect on success
      router.push("/main");
    } catch (err) {
      setError(err.message);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);  // End loading regardless of outcome
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-700">{error}</p>}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" placeholder="john@example.com" required />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <Button 
        type="submit" 
        className="mt-8 w-full" 
        ariaDisabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}

// Updated to use proper authentication
export function SignInButton() {
  const router = useRouter();
  
  const handleClick = () => {
    router.push("/signin");  // Navigate to sign-in page instead of bypassing auth
  };

  return (
    <Button className="mt-8 w-full" onClick={handleClick}>
      Sign In
    </Button>
  );
}