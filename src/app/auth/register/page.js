"use client";

import Link from 'next/link';
import { RegisterForm } from './form';
import "@/styles/Auth.css"

export default function Page() {
  return (
    <div className='auth-layouts'>

      <div className="logo"></div>
          <div className="register-form">
            <div className="flex flex-col p-4 lg:w-1/3">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Create an Account</h1>
                <p className="mt-2 text-gray-400">Enter your information here</p>
              </div>
              <div className="mt-6">
                <RegisterForm />
              </div>
              <div className="mt-6 text-center text-sm">
                Already have an account?{' '}
                <Link className="text-blue-400 underline" href="/auth/signin">
                  Sign In
                </Link>
              </div>
            </div>
          </div>

    </div>
  );
}