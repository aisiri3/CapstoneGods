'use client';

import { useRouter } from "next/navigation";
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
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent page refresh
    console.log("Sign In form submitted (no backend yet)");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <div>
          <Label htmlFor="email">Username / Email</Label>
          <Input id="email" name="email" placeholder="john@example.com" />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" />
        </div>

        <SignInButton />
      </div>
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