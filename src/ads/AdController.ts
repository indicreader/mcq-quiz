import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdMobBannerSize, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const AdController = {
  async initialize() {
    if (Capacitor.isNativePlatform()) {
      try {
        await AdMob.initialize({
          requestTrackingAuthorization: true,
          testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
          initializeForTesting: true,
        });
      } catch (e) {
        console.error('AdMob initialization failed', e);
      }
    }
  },

  async showBannerAd() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.showBanner({
        adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner ID
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
      });
    } catch (e) {
      console.error('Failed to show Banner Ad', e);
    }
  },

  async hideBannerAd() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
    } catch (e) {
      console.error('Failed to hide Banner Ad', e);
    }
  },

  async prepareInterstitial() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.prepareInterstitial({
        adId: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial ID
        isTesting: true,
      });
    } catch (e) {
      console.error('Failed to prepare Interstitial Ad', e);
    }
  },

  async showInterstitial() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.showInterstitial();
    } catch (e) {
      console.error('Failed to show Interstitial Ad', e);
    }
  }
};
