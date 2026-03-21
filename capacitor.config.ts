
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.church.mgmt',
  appName: 'ChurchManager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
