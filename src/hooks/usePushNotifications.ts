import { useState, useCallback, useEffect } from 'react';

export interface NotificationPermission {
  status: 'granted' | 'denied' | 'default';
  isSupported: boolean;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>({
    status: 'default',
    isSupported: false,
  });

  useEffect(() => {
    const isSupported = 'Notification' in window;
    setPermission({
      status: isSupported ? (Notification.permission as NotificationPermission['status']) : 'denied',
      isSupported,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission({
        status: result as NotificationPermission['status'],
        isSupported: true,
      });
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions & { vibrate?: number[]; renotify?: boolean }): boolean => {
    if (!('Notification' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      // Use extended options for mobile support
      const notificationOptions: NotificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options,
      };

      const notification = new Notification(title, notificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, []);

  const showAlarmNotification = useCallback((destinationName: string) => {
    return showNotification('🔔 Wake Up!', {
      body: `You've arrived at ${destinationName}. Time to get off!`,
      tag: 'travel-alarm',
    });
  }, [showNotification]);

  const showArrivalConfirmation = useCallback((destinationName: string) => {
    return showNotification('👋 Hope you made it!', {
      body: `We hope you didn't miss your stop at ${destinationName}. Have a great day!`,
      tag: 'travel-alarm-confirmation',
    });
  }, [showNotification]);

  const showTrackingStarted = useCallback((destinationName: string, alertRadius: number) => {
    const radiusText = alertRadius < 1000 ? `${alertRadius}m` : `${(alertRadius / 1000).toFixed(1)}km`;
    return showNotification('🗺️ Tracking Started', {
      body: `We'll alert you when you're within ${radiusText} of ${destinationName}`,
      tag: 'travel-alarm-tracking',
    });
  }, [showNotification]);

  return {
    permission,
    requestPermission,
    showNotification,
    showAlarmNotification,
    showArrivalConfirmation,
    showTrackingStarted,
  };
};
