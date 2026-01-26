import { useState, useCallback, useRef, useEffect } from 'react';

export interface AlarmState {
  isActive: boolean;
  isRinging: boolean;
}

export const useAlarm = () => {
  const [state, setState] = useState<AlarmState>({
    isActive: false,
    isRinging: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const createAlarmSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create oscillator for alarm beep
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880; // A5 note
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;

    oscillator.start();

    return { oscillator, gainNode, ctx };
  }, []);

  const triggerAlarm = useCallback(() => {
    if (state.isRinging) return;

    setState(prev => ({ ...prev, isRinging: true }));

    const { gainNode, ctx } = createAlarmSound();

    // Create beeping pattern
    let beepOn = true;
    intervalRef.current = setInterval(() => {
      if (gainNode && ctx) {
        const now = ctx.currentTime;
        if (beepOn) {
          gainNode.gain.setValueAtTime(0.5, now);
          // Also try vibration
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        } else {
          gainNode.gain.setValueAtTime(0, now);
        }
        beepOn = !beepOn;
      }
    }, 300);
  }, [state.isRinging, createAlarmSound]);

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
    setState({ isActive: false, isRinging: false });
  }, [stopAlarm]);

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
    ...state,
    triggerAlarm,
    stopAlarm,
    activateAlarm,
    deactivateAlarm,
  };
};
