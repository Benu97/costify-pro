'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '../lib/supabase-browser';
import LogoutButton from '../components/LogoutButton';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get authenticated user
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user) {
          setUser(userData.user);
          
          // Fetch user profile from the profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userData.user.id)
            .single();
            
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold">Costify Pro Dashboard</h1>
          <LogoutButton />
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <div className="space-y-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                <p className="font-medium">{profile?.full_name || 'Not set'}</p>
              </div>
              
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">Account ID</p>
                <p className="font-mono text-xs break-all">{user?.id}</p>
              </div>

              <Link 
                href="/dashboard/profile" 
                className="block w-full mt-4 px-4 py-2 bg-gray-200 text-center text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Welcome to Costify Pro</h2>
            <p className="mb-4">
              This is your personal dashboard where you can manage your expenses, track your budget, 
              and analyze your spending habits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Link href="/dashboard/expenses" className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="text-lg font-medium mb-1">Expenses</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track and manage your daily expenses
                </p>
              </Link>
              
              <Link href="/dashboard/budget" className="block p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                <h3 className="text-lg font-medium mb-1">Budget</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set up and monitor your monthly budget
                </p>
              </Link>
              
              <Link href="/dashboard/reports" className="block p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                <h3 className="text-lg font-medium mb-1">Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View detailed spending reports
                </p>
              </Link>
              
              <Link href="/dashboard/settings" className="block p-4 bg-gray-50 dark:bg-gray-700/20 rounded-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-1">Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize your account preferences
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 