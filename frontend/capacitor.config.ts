import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.romcom.diseasegenemap',
  appName: 'diseaseGene',
  server: {
    url: 'https://final-disease-gene.vercel.app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      // How long the splash stays visible before we manually hide it from the app.
      launchShowDuration: 0,
      launchAutoHide: false,
      // Smooth fade-out once the web view + first screen are ready.
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#00f5d4',
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: '#050507',
      useDialog: false,
    },
  },
};

export default config;
