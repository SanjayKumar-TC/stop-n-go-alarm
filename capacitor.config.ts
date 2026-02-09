import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stopngo.alarm',
  appName: 'Travel Alarm',
  webDir: 'dist',
  bundledWebRuntime: false,

  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'gentle_chime',
    },
    BackgroundGeolocation: {
      // background tracking enabled
    },
  },

  android: {
    allowMixedContent: true,
  },

  ios: {
    contentInset: 'automatic',
  },
};

export default config;
