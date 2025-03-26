"use client";

import Link from 'next/link';
import { SignInForm } from './form';
import "@/styles/Auth.css";

export default function Page() {
  return (
    <div className='auth-layouts'>
      <div className="logo"></div>
      <div className="register-form">
        <div className="flex flex-col p-4 lg:w-1/3">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Welcome back!</h1>
            <p className="mt-2 text-gray-400">Sign in to your account</p>
          </div>
          <div className="mt-6">
            <SignInForm />
          </div>
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account yet?{' '}
            <Link className="text-blue-400 underline" href="/auth/register">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}