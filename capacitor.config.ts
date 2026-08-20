import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nivaronix.cachepdf',
  appName: 'CachePDF by Nivaronix',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    App: { disableBackButtonHandler: false },
  },
};

export default config;
