'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FavoriteItem = {
  id: string;
  type: 'meal' | 'packet';
  name: string;
};

type FavoritesContextType = {
  favorites: FavoriteItem[];
  isFavorite: (id: string, type: 'meal' | 'packet') => boolean;
  addToFavorites: (id: string, type: 'meal' | 'packet', name: string) => void;
  removeFromFavorites: (id: string, type: 'meal' | 'packet') => void;
  toggleFavorite: (id: string, type: 'meal' | 'packet', name: string) => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('costify-favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('costify-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (id: string, type: 'meal' | 'packet') => {
    return favorites.some(fav => fav.id === id && fav.type === type);
  };

  const addToFavorites = (id: string, type: 'meal' | 'packet', name: string) => {
    setFavorites(prev => {
      // Don't add if already exists
      if (prev.some(fav => fav.id === id && fav.type === type)) {
        return prev;
      }
      return [...prev, { id, type, name }];
    });
  };

  const removeFromFavorites = (id: string, type: 'meal' | 'packet') => {
    setFavorites(prev => prev.filter(fav => !(fav.id === id && fav.type === type)));
  };

  const toggleFavorite = (id: string, type: 'meal' | 'packet', name: string) => {
    if (isFavorite(id, type)) {
      removeFromFavorites(id, type);
    } else {
      addToFavorites(id, type, name);
    }
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      isFavorite,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
} 