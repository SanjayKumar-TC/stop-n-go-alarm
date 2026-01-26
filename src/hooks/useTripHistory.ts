import { useState, useEffect, useCallback } from 'react';

export interface Trip {
  id: string;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  startTime: number;
  endTime: number | null;
  completed: boolean;
  alertDistance: number;
}

const STORAGE_KEY = 'travel-alarm-history';
const MAX_TRIPS = 20;

export const useTripHistory = () => {
  const [trips, setTrips] = useState<Trip[]>([]);

  // Load trips from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTrips(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load trip history:', e);
    }
  }, []);

  // Save trips to localStorage
  const saveTrips = useCallback((newTrips: Trip[]) => {
    // Keep only the most recent trips
    const limitedTrips = newTrips.slice(0, MAX_TRIPS);
    setTrips(limitedTrips);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedTrips));
    } catch (e) {
      console.error('Failed to save trip history:', e);
    }
  }, []);

  const startTrip = useCallback((
    destinationName: string,
    destinationLat: number,
    destinationLng: number,
    alertDistance: number
  ): Trip => {
    const newTrip: Trip = {
      id: Date.now().toString(),
      destinationName,
      destinationLat,
      destinationLng,
      startTime: Date.now(),
      endTime: null,
      completed: false,
      alertDistance,
    };
    saveTrips([newTrip, ...trips]);
    return newTrip;
  }, [trips, saveTrips]);

  const endTrip = useCallback((tripId: string, completed: boolean) => {
    saveTrips(trips.map(t => 
      t.id === tripId 
        ? { ...t, endTime: Date.now(), completed }
        : t
    ));
  }, [trips, saveTrips]);

  const deleteTrip = useCallback((tripId: string) => {
    saveTrips(trips.filter(t => t.id !== tripId));
  }, [trips, saveTrips]);

  const clearHistory = useCallback(() => {
    saveTrips([]);
  }, [saveTrips]);

  return {
    trips,
    startTrip,
    endTrip,
    deleteTrip,
    clearHistory,
  };
};
