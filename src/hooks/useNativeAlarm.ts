import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/* ---------------------------------------------------
   SIMPLE TEST FUNCTION (USE THIS FIRST)
--------------------------------------------------- */
export async function testAlarmSound() {
  // Request permission
  await LocalNotifications.requestPermissions();

  // Create HIGH priority channel (Android requirement)
  await LocalNotifications.createChannel({
    id: 'alarm_channel',
    name: 'Travel Alarm',
    description: 'Destination alarm',
    importance: 5, // MAX
    sound: 'beep',
    vibration: true,
  });

  // Schedule alarm
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
   HOOK (USE AFTER TEST WORKS)
--------------------------------------------------- */

export const useNativeAlarm = () => {
  const [isActive, setIsActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const setupAndroidAlarm = async () => {
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
  };

  const triggerAlarm = async (destination: string) => {
    if (isRinging) return;
    setIsRinging(true);

    if (isNative) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: '🚨 WAKE UP!',
            body: `You are near ${destination}`,
            channelId: 'alarm_channel',
            sound: 'beep',
            ongoing: true,
            autoCancel: false,
            schedule: { at: new Date() },
          },
        ],
      });

      if (navigator.vibrate) {
        navigator.vibrate([1000, 300, 1000, 300, 1000]);
      }
    }
  };

  const stopAlarm = async () => {
    setIsRinging(false);

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    if (isNative) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications,
        });
      }
    }
  };

  useEffect(() => {
    setupAndroidAlarm();
  }, []);

  return {
    isActive,
    isRinging,
    setIsActive,
    triggerAlarm,
    stopAlarm,
  };
};
npx cap open android