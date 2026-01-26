import { useState, useCallback, useRef, useEffect } from 'react';

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

// Frequency patterns for different tones
const TONE_FREQUENCIES: Record<AlarmTone, { freq: number; pattern: number[] }> = {
  beep: { freq: 880, pattern: [200, 100] },
  chime: { freq: 659, pattern: [400, 200] },
  alert: { freq: 1047, pattern: [100, 50] },
  gentle: { freq: 440, pattern: [600, 400] },
};

export const useAlarm = (initialSettings?: Partial<AlarmSettings>) => {
  const [state, setState] = useState<AlarmState>({
    isActive: false,
    isRinging: false,
    settings: { ...DEFAULT_SETTINGS, ...initialSettings },
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateSettings = useCallback((newSettings: Partial<AlarmSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const createAlarmSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const toneConfig = TONE_FREQUENCIES[state.settings.tone];

    // Create oscillator for alarm
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

  const triggerAlarm = useCallback(() => {
    if (state.isRinging) return;

    setState(prev => ({ ...prev, isRinging: true }));

    const { settings } = state;

    if (settings.sound) {
      const { gainNode, ctx, toneConfig } = createAlarmSound();

      // Create beeping pattern
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
        
        // Vibration
        if (settings.vibrate && navigator.vibrate && beepOn) {
          navigator.vibrate(toneConfig.pattern[0]);
        }
      }, TONE_FREQUENCIES[settings.tone].pattern[0] + TONE_FREQUENCIES[settings.tone].pattern[1]);
    } else if (settings.vibrate) {
      // Vibrate only mode
      intervalRef.current = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate([300, 200]);
        }
      }, 500);
    }
  }, [state.isRinging, state.settings, createAlarmSound]);

  const stopAlarm = useCallback(() => {
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

    setState(prev => ({ ...prev, isRinging: false }));
  }, []);

  const activateAlarm = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
  }, []);

  const deactivateAlarm = useCallback(() => {
    stopAlarm();
    setState(prev => ({ ...prev, isActive: false, isRinging: false }));
  }, [stopAlarm]);

  // Test alarm sound
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

  return {
    isActive: state.isActive,
    isRinging: state.isRinging,
    settings: state.settings,
    updateSettings,
    triggerAlarm,
    stopAlarm,
    activateAlarm,
    deactivateAlarm,
    testAlarm,
  };
};
