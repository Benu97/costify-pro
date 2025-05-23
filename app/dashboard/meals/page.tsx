import { Suspense } from 'react';
import { getMeals } from '@/app/actions/meals';
import MealsDataTable from './components/meals-data-table';
import { Meal } from '@/app/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function MealsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Meals Management</h1>
      <Suspense fallback={<p>Loading meals...</p>}>
        <MealsContent />
      </Suspense>
    </div>
  );
}

async function MealsContent() {
  const meals = await getMeals();
  
  return (
    <MealsDataTable initialMeals={meals as Meal[]} />
  );
}
