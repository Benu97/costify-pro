import { Suspense } from 'react';
import { createServerClient } from '@/app/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardContent from './components/dashboard-content';
import { getIngredients } from '@/app/actions/ingredients';
import { getMeals } from '@/app/actions/meals';
import { getPackets } from '@/app/actions/packets';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData userEmail={user.email || ''} />
    </Suspense>
  );
}

async function DashboardData({ userEmail }: { userEmail: string }) {
  // Fetch counts for quick stats
  const [ingredients, meals, packets] = await Promise.all([
    getIngredients(),
    getMeals(),
    getPackets()
  ]);

  const stats = {
    ingredients: ingredients.length,
    meals: meals.length,
    packets: packets.length
  };

  return <DashboardContent userEmail={userEmail} stats={stats} />;
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 