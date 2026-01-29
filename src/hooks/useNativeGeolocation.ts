import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation as CapacitorGeolocation, Position } from '@capacitor/geolocation';
import { BackgroundGeolocationPlugin, Location } from '@capacitor-community/background-geolocation';
import { registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export interface NativeGeolocationState {
  position: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  isWatching: boolean;
  isBackgroundTracking: boolean;
}

export interface UseNativeGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  backgroundConfig?: {
    notificationTitle?: string;
    notificationText?: string;
    distanceFilter?: number;
  };
}

const defaultOptions: UseNativeGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  backgroundConfig: {
    notificationTitle: 'Travel Alarm Active',
    notificationText: 'Tracking your journey to destination',
    distanceFilter: 10,
  },
};

export const useNativeGeolocation = (options: UseNativeGeolocationOptions = defaultOptions) => {
  const [state, setState] = useState<NativeGeolocationState>({
    position: null,
    error: null,
    isLoading: true,
    isWatching: false,
    isBackgroundTracking: false,
  });

  const watchIdRef = useRef<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const getCurrentPosition = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (isNative) {
        // Use Capacitor Geolocation for native
        const permission = await CapacitorGeolocation.checkPermissions();
        
        if (permission.location !== 'granted') {
          const requested = await CapacitorGeolocation.requestPermissions();
          if (requested.location !== 'granted') {
            throw new Error('Location permission denied');
          }
        }

        const position = await CapacitorGeolocation.getCurrentPosition({
          enableHighAccuracy: options.enableHighAccuracy,
          timeout: options.timeout,
          maximumAge: options.maximumAge,
        });

        setState(prev => ({
          ...prev,
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          isLoading: false,
        }));
      } else {
        // Fallback to browser geolocation
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported');
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setState(prev => ({
              ...prev,
              position: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              error: null,
              isLoading: false,
            }));
          },
          (error) => {
            setState(prev => ({
              ...prev,
              error: error.message,
              isLoading: false,
            }));
          },
          {
            enableHighAccuracy: options.enableHighAccuracy,
            timeout: options.timeout,
            maximumAge: options.maximumAge,
          }
        );
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get location',
        isLoading: false,
      }));
    }
  }, [isNative, options.enableHighAccuracy, options.timeout, options.maximumAge]);

  const startBackgroundTracking = useCallback(async (
    onLocationUpdate: (lat: number, lng: number) => void
  ) => {
    if (!isNative) {
      console.warn('Background tracking is only available on native platforms');
      return;
    }

    try {
      // Request background location permission
      const permission = await CapacitorGeolocation.checkPermissions();
      if (permission.location !== 'granted') {
        await CapacitorGeolocation.requestPermissions();
      }

      const config = options.backgroundConfig || defaultOptions.backgroundConfig!;

      // Start background geolocation
      watchIdRef.current = await BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: config.notificationTitle,
          backgroundMessage: config.notificationText,
          requestPermissions: true,
          stale: false,
          distanceFilter: config.distanceFilter,
        },
        (location: Location | undefined, error: Error | undefined) => {
          if (error) {
            console.error('Background geolocation error:', error);
            setState(prev => ({ ...prev, error: error.message }));
            return;
          }

          if (location) {
            const newPosition = {
              lat: location.latitude,
              lng: location.longitude,
            };
            
            setState(prev => ({
              ...prev,
              position: newPosition,
              error: null,
            }));

            onLocationUpdate(location.latitude, location.longitude);
          }
        }
      );

      setState(prev => ({ ...prev, isBackgroundTracking: true, isWatching: true }));
    } catch (error) {
      console.error('Failed to start background tracking:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start background tracking',
      }));
    }
  }, [isNative, options.backgroundConfig]);

  const stopBackgroundTracking = useCallback(async () => {
    if (watchIdRef.current) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: watchIdRef.current });
        watchIdRef.current = null;
      } catch (error) {
        console.error('Failed to stop background tracking:', error);
      }
    }
    setState(prev => ({ ...prev, isBackgroundTracking: false, isWatching: false }));
  }, []);

  const startWatching = useCallback(async () => {
    if (isNative) {
      // For native, we'll use background geolocation which handles foreground too
      // This is a simpler foreground-only watch
      try {
        const watchId = await CapacitorGeolocation.watchPosition(
          {
            enableHighAccuracy: options.enableHighAccuracy,
            timeout: options.timeout,
            maximumAge: options.maximumAge,
          },
          (position: Position | null, err?: any) => {
            if (err) {
              setState(prev => ({ ...prev, error: err.message }));
              return;
            }
            if (position) {
              setState(prev => ({
                ...prev,
                position: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
                error: null,
                isLoading: false,
              }));
            }
          }
        );
        watchIdRef.current = watchId;
        setState(prev => ({ ...prev, isWatching: true }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to start watching',
        }));
      }
    } else {
      // Browser fallback
      if (!navigator.geolocation) return;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setState(prev => ({
            ...prev,
            position: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            error: null,
            isLoading: false,
          }));
        },
        (error) => {
          setState(prev => ({ ...prev, error: error.message }));
        },
        {
          enableHighAccuracy: options.enableHighAccuracy,
          timeout: options.timeout,
          maximumAge: options.maximumAge,
        }
      );
      watchIdRef.current = String(watchId);
      setState(prev => ({ ...prev, isWatching: true }));
    }
  }, [isNative, options.enableHighAccuracy, options.timeout, options.maximumAge]);

  const stopWatching = useCallback(async () => {
    if (watchIdRef.current) {
      if (isNative) {
        await CapacitorGeolocation.clearWatch({ id: watchIdRef.current });
      } else {
        navigator.geolocation.clearWatch(Number(watchIdRef.current));
      }
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isWatching: false }));
  }, [isNative]);

  // Get initial position on mount
  useEffect(() => {
    getCurrentPosition();
    return () => {
      stopWatching();
      stopBackgroundTracking();
    };
  }, []);

  return {
    ...state,
    isNative,
    getCurrentPosition,
    requestPosition: getCurrentPosition,
    startWatching,
    stopWatching,
    startBackgroundTracking,
    stopBackgroundTracking,
  };
};
