'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '../lib/supabase-browser';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createBrowserClient();

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Costify Pro</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Sign in to your account or create a new one
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6', // Tailwind blue-500
                  brandAccent: '#2563eb', // Tailwind blue-600
                }
              }
            },
            style: {
              button: {
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                padding: '0.625rem 1rem',
              },
              input: {
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                padding: '0.625rem 1rem',
              },
            },
          }}
          providers={['github', 'google']}
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
          magicLink={true}
          socialLayout="horizontal"
        />
      </div>
    </div>
  );
} 