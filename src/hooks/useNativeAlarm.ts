import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type AlarmTone = 'beep' | 'chime' | 'alert' | 'gentle';

export interface AlarmSettings {
  vibrate: boolean;
  sound: boolean;
  tone: AlarmTone;
  volume: number;
}

const DEFAULT_SETTINGS: AlarmSettings = {
  vibrate: true,
  sound: true,
  tone: 'beep',
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

// Frequency patterns for different tones (web fallback)
const TONE_FREQUENCIES: Record<AlarmTone, { freq: number; pattern: number[] }> = {
  beep: { freq: 880, pattern: [200, 100] },
  chime: { freq: 659, pattern: [400, 200] },
  alert: { freq: 1047, pattern: [100, 50] },
  gentle: { freq: 440, pattern: [600, 400] },
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
    sound: 'beep',
    vibration: true,
  });

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: '🚨 TEST ALARM',
        body: 'If you hear sound, alarm works!',
        channelId: 'alarm_channel',
        sound: 'beep',
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
      sound: 'beep',
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

    oscillator.type = settings.tone === 'gentle' ? 'sine' : 'square';
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

    // Native: use local notifications for sound
    if (isNative && settings.sound) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: '🚨 WAKE UP!',
            body: `You are near ${destName}`,
            channelId: 'alarm_channel',
            sound: 'beep',
            ongoing: true,
            autoCancel: false,
            schedule: { at: new Date() },
          },
        ],
      });
    }

    // Web fallback: use Web Audio API
    if (!isNative && settings.sound) {
      const { gainNode, ctx, toneConfig } = createAlarmSound();

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
    }

    // Vibration
    if (settings.vibrate && navigator.vibrate) {
      navigator.vibrate([1000, 300, 1000, 300, 1000]);
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
    if (isNative) {
      await testAlarmSound();
    } else {
      // Web fallback test
      if (settings.sound) {
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
    }
  }, [isNative, settings]);

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
