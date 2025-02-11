"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function Settings() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back(); // Go back if there is history
    } else {
      router.push('/'); // Redirect to home if no history
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Back button */}
      <div className="self-start mb-8">
        <button
          onClick={handleBack}
          className="mt-6 ml-6 flex items-center text-white hover:text-gray-500"
        >
          <ArrowLeft size={40} className="mr-2" />
          <span>Back to Main Page</span>
        </button>
      </div>

      <h1 className="text-4xl">Settings (to add)</h1>

      {/* Developer Tools button */}
      <Link href="/developer-tools">
        <button className="mt-8 bg-purple-800 hover:bg-purple-900 text-white font-bold py-2 px-4 rounded">
          Open Developer Tools
        </button>
      </Link>
    </div>
  );
}