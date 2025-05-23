import { Suspense } from 'react';
import { getIngredients } from '@/app/actions/ingredients';
import IngredientsDataTable from './components/ingredients-data-table';
import { Ingredient } from '@/app/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function IngredientsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Ingredients Management</h1>
      <Suspense fallback={<p>Loading ingredients...</p>}>
        <IngredientsContent />
      </Suspense>
    </div>
  );
}

async function IngredientsContent() {
  const ingredients = await getIngredients();
  
  return (
    <IngredientsDataTable initialIngredients={ingredients as Ingredient[]} />
  );
}
