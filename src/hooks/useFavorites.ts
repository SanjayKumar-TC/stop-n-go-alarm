import { useState, useEffect, useCallback } from 'react';

export interface FavoriteDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  icon: 'home' | 'briefcase' | 'train' | 'star';
  createdAt: number;
}

const STORAGE_KEY = 'travel-alarm-favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteDestination[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: FavoriteDestination[]) => {
    setFavorites(newFavorites);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, []);

  const addFavorite = useCallback((
    name: string,
    lat: number,
    lng: number,
    icon: FavoriteDestination['icon'] = 'star'
  ) => {
    const newFavorite: FavoriteDestination = {
      id: Date.now().toString(),
      name,
      lat,
      lng,
      icon,
      createdAt: Date.now(),
    };
    saveFavorites([...favorites, newFavorite]);
    return newFavorite;
  }, [favorites, saveFavorites]);

  const removeFavorite = useCallback((id: string) => {
    saveFavorites(favorites.filter(f => f.id !== id));
  }, [favorites, saveFavorites]);

  const updateFavorite = useCallback((id: string, updates: Partial<Omit<FavoriteDestination, 'id' | 'createdAt'>>) => {
    saveFavorites(favorites.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  }, [favorites, saveFavorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    updateFavorite,
  };
};
