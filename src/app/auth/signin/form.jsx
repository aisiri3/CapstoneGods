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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);  // Reset error

    const formData = new FormData(event.target);
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Wrong email or password, please try again");
      }

      console.log(result.message);
      router.push("/main");  // Redirect on success
    } catch (err) {
      setError(err.message);
      console.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-700">{error}</p>}  {/* Show error messages */}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" placeholder="john@example.com" required />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <Button type="submit" className="mt-8 w-full">
        Sign In
      </Button>
    </form>
  );
}

export function SignInButton() {
  const router = useRouter();
  const handleSignIn = (event) => {
    event.preventDefault(); // Prevent form submission for now
    router.push("/main"); // Navigate to main page
  };

  return (
    <Button type="submit" className="mt-8 w-full" onClick={handleSignIn}>
      Sign In
    </Button>
  );
}