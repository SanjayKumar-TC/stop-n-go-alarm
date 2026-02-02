import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface WakeLockState {
  isActive: boolean;
  isSupported: boolean;
  error: string | null;
}

export const useWakeLock = () => {
  const [state, setState] = useState<WakeLockState>({
    isActive: false,
    isSupported: false,
    error: null,
  });

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Check if Wake Lock API is supported
  useEffect(() => {
    const isSupported = 'wakeLock' in navigator;
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    // On native platforms, background geolocation handles keeping the app alive
    // But we still try to acquire wake lock for additional protection
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API not supported');
      setState(prev => ({ 
        ...prev, 
        error: isNative ? null : 'Wake Lock not supported on this browser',
        // On native, we don't need web wake lock as background service handles it
        isActive: isNative,
      }));
      return isNative;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      
      wakeLockRef.current.addEventListener('release', () => {
        setState(prev => ({ ...prev, isActive: false }));
        console.log('Wake Lock released');
      });

      setState(prev => ({ ...prev, isActive: true, error: null }));
      console.log('Wake Lock acquired');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acquire wake lock';
      console.error('Wake Lock error:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage, isActive: false }));
      return false;
    }
  }, [isNative]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setState(prev => ({ ...prev, isActive: false }));
      } catch (error) {
        console.error('Failed to release wake lock:', error);
      }
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.isActive && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isActive, requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return {
    ...state,
    isNative,
    requestWakeLock,
    releaseWakeLock,
  };
};

