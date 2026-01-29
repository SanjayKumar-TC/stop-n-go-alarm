import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4ab7b6df450d40ada7bb7f4ddfd86f49',
  appName: 'Travel Alarm',
  webDir: 'dist',
  server: {
    url: 'https://4ab7b6df-450d-40ad-a7bb-7f4ddfd86f49.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav',
    },
    BackgroundGeolocation: {
      // Background location permissions
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
