import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type AlarmTone = 'beep' | 'chime' | 'alert' | 'gentle';

export interface AlarmSettings {
  vibrate: boolean;
  sound: boolean;
  tone: AlarmTone;
  volume: number;
}

export interface AlarmState {
  isActive: boolean;
  isRinging: boolean;
  settings: AlarmSettings;
}

const DEFAULT_SETTINGS: AlarmSettings = {
  vibrate: true,
  sound: true,
  tone: 'beep',
  volume: 0.7,
};

// Frequency patterns for different tones (used for web audio)
const TONE_FREQUENCIES: Record<AlarmTone, { freq: number; pattern: number[] }> = {
  beep: { freq: 880, pattern: [200, 100] },
  chime: { freq: 659, pattern: [400, 200] },
  alert: { freq: 1047, pattern: [100, 50] },
  gentle: { freq: 440, pattern: [600, 400] },
};

export const useNativeAlarm = (initialSettings?: Partial<AlarmSettings>) => {
  const [state, setState] = useState<AlarmState>({
    isActive: false,
    isRinging: false,
    settings: { ...DEFAULT_SETTINGS, ...initialSettings },
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationIdRef = useRef<number>(1);
  
  const isNative = Capacitor.isNativePlatform();

  const updateSettings = useCallback((newSettings: Partial<AlarmSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  // Request notification permissions on native
  const requestNotificationPermission = useCallback(async () => {
    if (isNative) {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    }
  }, [isNative]);

  // Create web audio alarm (fallback for web)
  const createWebAudioAlarm = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const toneConfig = TONE_FREQUENCIES[state.settings.tone];

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = state.settings.tone === 'gentle' ? 'sine' : 'square';
    oscillator.frequency.value = toneConfig.freq;
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;

    oscillator.start();

    return { oscillator, gainNode, ctx, toneConfig };
  }, [state.settings.tone]);

  // Trigger native alarm notification (works even when app is in background)
  // AGGRESSIVE MODE: Multiple notifications, loud sounds, persistent vibration
  const triggerNativeAlarm = useCallback(async (destinationName: string) => {
    const { settings } = state;
    
    try {
      // Schedule MULTIPLE immediate high-priority notifications for maximum wakeup effect
      const urgentNotifications = [
        {
          id: notificationIdRef.current++,
          title: '🚨 WAKE UP NOW! 🚨',
          body: `ARRIVING AT ${destinationName.toUpperCase()}! GET READY TO EXIT!`,
          sound: settings.sound ? 'beep.wav' : undefined,
          ongoing: true, // Makes it persistent on Android - cannot be swiped away
          autoCancel: false,
          smallIcon: 'ic_stat_alarm',
          largeIcon: 'ic_launcher',
          extra: {
            type: 'arrival_alarm',
            priority: 'max',
          },
          schedule: { at: new Date() },
        },
        {
          id: notificationIdRef.current++,
          title: '⏰ DESTINATION REACHED!',
          body: `You are at ${destinationName}. Time to get off!`,
          sound: settings.sound ? 'beep.wav' : undefined,
          schedule: { at: new Date(Date.now() + 500) },
        },
      ];

      await LocalNotifications.schedule({ notifications: urgentNotifications });

      // AGGRESSIVE: Immediate strong vibration burst
      if (settings.vibrate && navigator.vibrate) {
        navigator.vibrate([1000, 200, 1000, 200, 1000, 200, 1000]);
      }

      // Continuous AGGRESSIVE notifications every 2 seconds (more frequent)
      let notificationCount = 0;
      intervalRef.current = setInterval(async () => {
        notificationCount++;
        
        // Alternate between different alarm messages for attention
        const alarmMessages = [
          { title: '🔔 WAKE UP! WAKE UP!', body: `GET OFF AT ${destinationName.toUpperCase()}!` },
          { title: '⚠️ ARRIVING NOW!', body: `Don't miss your stop at ${destinationName}!` },
          { title: '🚨 DESTINATION ALERT!', body: `${destinationName} - EXIT NOW!` },
          { title: '⏰ TIME TO GO!', body: `Your stop ${destinationName} is here!` },
        ];
        
        const message = alarmMessages[notificationCount % alarmMessages.length];

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationIdRef.current++,
              title: message.title,
              body: message.body,
              sound: settings.sound ? 'beep.wav' : undefined,
              schedule: { at: new Date() },
            },
          ],
        });

        // AGGRESSIVE vibration pattern - longer and more intense
        if (settings.vibrate && navigator.vibrate) {
          navigator.vibrate([800, 150, 800, 150, 800, 150, 800, 150, 800]);
        }
      }, 2000); // Every 2 seconds instead of 3
      
      // Also set up a secondary vibration interval for maximum effect
      const vibrationInterval = setInterval(() => {
        if (settings.vibrate && navigator.vibrate) {
          navigator.vibrate([500, 100, 500, 100, 500]);
        }
      }, 1000);
      
      
      // Store the vibration interval to clear later
      (intervalRef as any).vibrationInterval = vibrationInterval;
      
    } catch (error) {
      console.error('Failed to trigger native alarm:', error);
    }
  }, [state.settings]);

  const triggerAlarm = useCallback((destinationName?: string) => {
    if (state.isRinging) return;

    setState(prev => ({ ...prev, isRinging: true }));

    const { settings } = state;

    if (isNative && destinationName) {
      // Use native notifications for background alarm
      triggerNativeAlarm(destinationName);
    }

    if (settings.sound && !isNative) {
      // Web audio for web platform
      const { gainNode, ctx, toneConfig } = createWebAudioAlarm();

      let beepOn = true;
      intervalRef.current = setInterval(() => {
        if (gainNode && ctx) {
          const now = ctx.currentTime;
          if (beepOn) {
            gainNode.gain.setValueAtTime(settings.volume, now);
          } else {
            gainNode.gain.setValueAtTime(0, now);
          }
          beepOn = !beepOn;
        }
        
        if (settings.vibrate && navigator.vibrate && beepOn) {
          navigator.vibrate(toneConfig.pattern[0]);
        }
      }, TONE_FREQUENCIES[settings.tone].pattern[0] + TONE_FREQUENCIES[settings.tone].pattern[1]);
    } else if (settings.vibrate && !isNative) {
      intervalRef.current = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate([300, 200]);
        }
      }, 500);
    }

    // Always vibrate on native too
    if (isNative && settings.vibrate && navigator.vibrate) {
      const vibrationInterval = setInterval(() => {
        navigator.vibrate([500, 200, 500]);
      }, 1500);
      
      // Store reference to clear later
      const existingInterval = intervalRef.current;
      intervalRef.current = setInterval(() => {}, 0);
      clearInterval(intervalRef.current);
      intervalRef.current = existingInterval || vibrationInterval;
    }
  }, [state.isRinging, state.settings, isNative, createWebAudioAlarm, triggerNativeAlarm]);

  const stopAlarm = useCallback(async () => {
    // Clear main interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear secondary vibration interval if exists
    if ((intervalRef as any).vibrationInterval) {
      clearInterval((intervalRef as any).vibrationInterval);
      (intervalRef as any).vibrationInterval = null;
    }

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    // Stop all vibration immediately
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    // Cancel ALL notifications on native (both pending and delivered)
    if (isNative) {
      try {
        // Cancel pending notifications
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: pending.notifications,
          });
        }
        
        // Also try to remove delivered notifications
        const delivered = await LocalNotifications.getDeliveredNotifications();
        if (delivered.notifications.length > 0) {
          await LocalNotifications.removeDeliveredNotifications({
            notifications: delivered.notifications,
          });
        }
      } catch (error) {
        console.error('Failed to cancel notifications:', error);
      }
    }

    setState(prev => ({ ...prev, isRinging: false }));
  }, [isNative]);

  const activateAlarm = useCallback(async () => {
    await requestNotificationPermission();
    setState(prev => ({ ...prev, isActive: true }));
  }, [requestNotificationPermission]);

  const deactivateAlarm = useCallback(() => {
    stopAlarm();
    setState(prev => ({ ...prev, isActive: false, isRinging: false }));
  }, [stopAlarm]);

  const testAlarm = useCallback(() => {
    const { settings } = state;
    
    if (settings.sound) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const toneConfig = TONE_FREQUENCIES[settings.tone];
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = settings.tone === 'gentle' ? 'sine' : 'square';
      oscillator.frequency.value = toneConfig.freq;
      gainNode.gain.value = settings.volume;

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      
      setTimeout(() => {
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        oscillator.stop();
      }, 500);
    }

    if (settings.vibrate && navigator.vibrate) {
      navigator.vibrate(300);
    }
  }, [state.settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAlarm]);

  // Request permissions on mount for native
  useEffect(() => {
    if (isNative) {
      requestNotificationPermission();
    }
  }, [isNative, requestNotificationPermission]);

  return {
    isActive: state.isActive,
    isRinging: state.isRinging,
    settings: state.settings,
    isNative,
    updateSettings,
    triggerAlarm,
    stopAlarm,
    activateAlarm,
    deactivateAlarm,
    testAlarm,
  };
};
