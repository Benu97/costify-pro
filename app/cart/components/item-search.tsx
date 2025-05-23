'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  type: 'meal' | 'packet';
}

interface ItemSearchProps {
  onSearch: (query: string) => Promise<void>;
  isSearching: boolean;
  searchResults: SearchResult[];
  onSelectItem: (item: SearchResult) => void;
}

export default function ItemSearch({
  onSearch,
  isSearching,
  searchResults,
  onSelectItem
}: ItemSearchProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Handle outside click to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      onSearch(value);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };
  
  const handleSelectItem = (item: SearchResult) => {
    onSelectItem(item);
    setShowResults(false);
    setQuery('');
  };
  
  return (
    <div className="relative" ref={searchRef}>
      <div className="flex">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for meals or packets..."
            className="pl-8"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length >= 2 && setShowResults(true)}
          />
        </div>
      </div>
      
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md">
          {isSearching ? (
            <div className="p-4 text-center">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No results found</div>
          ) : (
            <ul className="py-2 max-h-80 overflow-auto">
              {searchResults.map((item) => (
                <li key={`${item.type}-${item.id}`} className="px-4 py-2 hover:bg-accent cursor-pointer">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                          {item.type}
                        </span>
                        {item.description && (
                          <span className="ml-2 truncate">{item.description}</span>
                        )}
                      </div>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
