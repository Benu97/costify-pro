'use client';

import { useState } from 'react';
import { useCart } from '@/app/providers/cart-provider';
import { searchItems } from '@/app/actions/cart';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CartSummary from './cart-summary';
import CartTable from './cart-table';
import ItemSearch from './item-search';
import AddItemSidePanel from './add-item-side-panel';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  type: 'meal' | 'packet';
}

export default function CartView() {
  const { cart, isLoading, finalizeCurrentCart } = useCart();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  
  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const results = await searchItems(query);
      
      const formattedResults: SearchResult[] = [
        ...results.meals.map(meal => ({
          id: meal.id,
          name: meal.name,
          description: meal.description,
          type: 'meal' as const
        })),
        ...results.packets.map(packet => ({
          id: packet.id,
          name: packet.name,
          description: packet.description,
          type: 'packet' as const
        }))
      ];
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectItem = (item: SearchResult) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };
  
  const handleFinalizeCart = async () => {
    if (window.confirm('Are you sure you want to finalize this cart? This action cannot be undone.')) {
      await finalizeCurrentCart();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading cart...</div>;
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="col-span-2 space-y-4">
          <ItemSearch 
            onSearch={handleSearch} 
            isSearching={isSearching}
            searchResults={searchResults}
            onSelectItem={handleSelectItem}
          />
        </div>
        
        <div className="col-span-2 lg:col-span-1">
          <CartSummary />
          <div className="mt-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleFinalizeCart}
            >
              Finalize Cart
            </Button>
          </div>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <CartTable />
      
      <AddItemSidePanel 
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        selectedItem={selectedItem}
      />
    </div>
  );
}
