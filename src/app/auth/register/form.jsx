'use client';

import Link from 'next/link';
import { useRouter } from "next/navigation";
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
    const handleSubmit = (event) => {
      event.preventDefault(); // Prevent page refresh
      console.log("Form submitted (no backend yet)");
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
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
//   const { pending } = useFormStatus();

//   return (
//     <Button type="submit" className="mt-2 w-full" ariaDisabled={pending}>
//       {pending ? 'Submitting...' : 'Register'}
//     </Button>
//   );

    const router = useRouter();
    const handleRegister = (event) => {
        event.preventDefault(); // Prevent form submission for now
        router.push("/auth/signin"); // Navigate to the signin page
    };

    return (
        <Button type="submit" className="mt-8 w-full" onClick={handleRegister}>
        Register
        </Button>
    );
}