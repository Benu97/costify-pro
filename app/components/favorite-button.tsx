'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/app/providers/favorites-provider';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  id: string;
  type: 'meal' | 'packet';
  name: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export function FavoriteButton({ 
  id, 
  type, 
  name, 
  variant = 'ghost', 
  size = 'icon',
  showText = false,
  className 
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const favorited = isFavorite(id, type);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleFavorite(id, type, name);
    
    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        "transition-all duration-200",
        isAnimating && "scale-125",
        className
      )}
      title={favorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
    >
      <Heart 
        className={cn(
          "h-4 w-4 transition-colors duration-200",
          favorited ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"
        )} 
      />
      {showText && (
        <span className="ml-1">
          {favorited ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </Button>
  );
} 