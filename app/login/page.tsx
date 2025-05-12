'use client';

import LoginButton from '../components/LoginButton';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="mt-2 text-gray-600">
            Enter your email to receive a magic link
          </p>
        </div>
        
        <LoginButton />
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              Return to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 