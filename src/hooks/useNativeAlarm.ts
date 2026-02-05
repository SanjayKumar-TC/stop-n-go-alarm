import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type AlarmTone = 'gentle' | 'melody' | 'waves';

export interface AlarmSettings {
  vibrate: boolean;
  sound: boolean;
  tone: AlarmTone;
  volume: number;
}

const DEFAULT_SETTINGS: AlarmSettings = {
  vibrate: true,
  sound: true,
  tone: 'gentle',
  volume: 0.7,
};

const SETTINGS_STORAGE_KEY = 'alarm_settings';

const loadSettings = (): AlarmSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load alarm settings:', e);
  }
  return DEFAULT_SETTINGS;
};

// Pleasant, smooth tone configurations with longer sustained ringing
const TONE_FREQUENCIES: Record<AlarmTone, { freq: number; pattern: number[]; waveType: OscillatorType }> = {
  gentle: { freq: 396, pattern: [2000, 800], waveType: 'sine' },
  melody: { freq: 528, pattern: [2500, 600], waveType: 'sine' },
  waves: { freq: 432, pattern: [3000, 1000], waveType: 'sine' },
};

/* ---------------------------------------------------
   SIMPLE TEST FUNCTION (USE THIS FIRST)
--------------------------------------------------- */
export async function testAlarmSound() {
  await LocalNotifications.requestPermissions();

  await LocalNotifications.createChannel({
    id: 'alarm_channel',
    name: 'Travel Alarm',
    description: 'Destination alarm',
    importance: 5,
    sound: 'gentle_chime',
    vibration: true,
  });

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: '🔔 TEST ALARM',
        body: 'If you hear sound, alarm works!',
        channelId: 'alarm_channel',
        sound: 'gentle_chime',
        schedule: { at: new Date(Date.now() + 1000) },
      },
    ],
  });
}

/* ---------------------------------------------------
   HOOK
--------------------------------------------------- */
export const useNativeAlarm = () => {
  const [isActive, setIsActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [settings, setSettings] = useState<AlarmSettings>(loadSettings);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const setupAndroidAlarm = useCallback(async () => {
    if (!isNative) return;

    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.createChannel({
      id: 'alarm_channel',
      name: 'Travel Alarm',
      importance: 5,
      sound: 'gentle_chime',
      vibration: true,
    });
  }, [isNative]);

  const updateSettings = useCallback((newSettings: Partial<AlarmSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const createAlarmSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const toneConfig = TONE_FREQUENCIES[settings.tone];

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = TONE_FREQUENCIES[settings.tone].waveType;
    oscillator.frequency.value = toneConfig.freq;
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;

    oscillator.start();

    return { oscillator, gainNode, ctx, toneConfig };
  }, [settings.tone]);

  const triggerAlarm = useCallback(async (destination?: string) => {
    if (isRinging) return;
    setIsRinging(true);

    const destName = destination || 'your destination';

    // Native: use repeating local notifications for continuous alarm
    if (isNative && settings.sound) {
      // Schedule initial notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: '🔔 Arriving Soon!',
            body: `You are near ${destName}`,
            channelId: 'alarm_channel',
            sound: 'gentle_chime',
            ongoing: true,
            autoCancel: false,
            schedule: { at: new Date() },
          },
        ],
      });

      // Keep ringing by scheduling repeated notifications every 3 seconds
      intervalRef.current = setInterval(async () => {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: '🔔 Wake Up!',
              body: `Approaching ${destName}`,
              channelId: 'alarm_channel',
              sound: 'gentle_chime',
              ongoing: true,
              autoCancel: false,
              schedule: { at: new Date() },
            },
          ],
        });

        // Continuous vibration pattern
        if (settings.vibrate && navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 500]);
        }
      }, 3000);
    }

    // Web fallback: use Web Audio API with continuous looping
    if (!isNative && settings.sound) {
      const { gainNode, ctx, toneConfig } = createAlarmSound();

      let soundOn = true;
      const cycleDuration = toneConfig.pattern[0] + toneConfig.pattern[1];
      
      intervalRef.current = setInterval(() => {
        if (gainNode && ctx) {
          const now = ctx.currentTime;
          // Smooth fade for calmer but persistent sound
          if (soundOn) {
            gainNode.gain.linearRampToValueAtTime(settings.volume, now + 0.15);
          } else {
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.15); // Don't go fully silent
          }
          soundOn = !soundOn;
        }
        
        if (settings.vibrate && navigator.vibrate && soundOn) {
          navigator.vibrate(toneConfig.pattern[0]);
        }
      }, cycleDuration);
    }

    // Continuous vibration pattern that repeats
    if (settings.vibrate && navigator.vibrate) {
      // Start immediate vibration, then interval will maintain it
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }
  }, [isRinging, isNative, settings, createAlarmSound]);

  const stopAlarm = useCallback(async () => {
    setIsRinging(false);

    // Stop web audio
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    // Cancel native notifications
    if (isNative) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications,
        });
      }
    }
  }, [isNative]);

  const activateAlarm = useCallback(() => {
    setIsActive(true);
  }, []);

  const deactivateAlarm = useCallback(() => {
    stopAlarm();
    setIsActive(false);
    setIsRinging(false);
  }, [stopAlarm]);

  const testAlarm = useCallback(async () => {
    // If already ringing, stop it (toggle behavior for testing)
    if (isRinging) {
      stopAlarm();
      return;
    }

    if (isNative) {
      await testAlarmSound();
    } else {
      // Web: trigger actual continuous alarm for testing
      // This will ring until stopped, just like the real alarm
      triggerAlarm('Test Destination');
    }
  }, [isNative, isRinging, stopAlarm, triggerAlarm]);

  useEffect(() => {
    setupAndroidAlarm();
  }, [setupAndroidAlarm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAlarm]);

  return {
    isActive,
    isRinging,
    settings,
    setIsActive,
    updateSettings,
    triggerAlarm,
    stopAlarm,
    activateAlarm,
    deactivateAlarm,
    testAlarm,
  };
};
