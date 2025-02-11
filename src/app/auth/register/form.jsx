'use client';

import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormState, useFormStatus } from 'react-dom';
import "@/styles/Auth.css";
// import { signup } from '@/app/auth/01-auth';

// Define the Label component
function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block mt-2 text-sm font-medium text-gray-300">
      {children}
    </label>
  );
}

// Define the Input component
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

// Define the Button component
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

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = {
          username: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
      };

      try {
          const response = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
          });

          const result = await response.json();

          if (!response.ok) {
              setError(result.error);
              return;
          }

          console.log(result.message);
          router.push("/auth/signin");  // Redirect to login page
      } catch (error) {
          console.error("Unexpected error:", error);
          setError("Something went wrong. Please try again.");
      }
  };

  return (
      <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
              {error && <p className="text-red-700">{error}</p>}

              <div>
                  <Label htmlFor="name">Username</Label>
                  <Input id="name" name="name" placeholder="John Doe" />
              </div>

              <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" placeholder="john@example.com" />
              </div>

              <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" />
              </div>

              <RegisterButton />
          </div>
      </form>
  );
}


export function RegisterButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="mt-2 w-full" ariaDisabled={pending}>
      {pending ? 'Submitting...' : 'Register'}
    </Button>
  );
}