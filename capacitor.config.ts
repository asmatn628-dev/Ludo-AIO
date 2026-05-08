import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ludo.universe',
  appName: 'Ludo Universe',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
