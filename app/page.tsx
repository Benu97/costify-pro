import { Suspense } from 'react';
import { createServerClient } from '@/app/lib/supabase-server';
import { redirect } from 'next/navigation';
import NewDashboard from './components/new-dashboard';
import { getIngredients } from './actions/ingredients';
import { getMeals } from './actions/meals';
import { getPackets } from './actions/packets';
import { CartProvider } from './providers/cart-provider';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <CartProvider>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData userEmail={user.email || ''} />
      </Suspense>
    </CartProvider>
  );
}

async function DashboardData({ userEmail }: { userEmail: string }) {
  // Fetch all data for the dashboard
  const [ingredients, meals, packets] = await Promise.all([
    getIngredients(),
    getMeals(),
    getPackets()
  ]);

  return (
    <NewDashboard 
      userEmail={userEmail} 
      ingredients={ingredients}
      meals={meals}
      packets={packets}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="flex space-x-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded w-24"></div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-80 border-l bg-muted/20 p-4">
          <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
