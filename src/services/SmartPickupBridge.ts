import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { DriverSettings, PermissionStatus, TripOffer } from '../types/trip';

const { SmartPickupBridge } = NativeModules;
const eventEmitter = SmartPickupBridge ? new NativeEventEmitter(SmartPickupBridge) : null;

export const SmartPickupService = {
  checkPermissions: async (): Promise<PermissionStatus> => {
    if (Platform.OS === 'android' && SmartPickupBridge) {
      return await SmartPickupBridge.checkPermissions();
    }
    return {
      overlayGranted: false,
      accessibilityGranted: false,
      isCoPilotActive: true,
    };
  },

  openAccessibilitySettings: () => {
    if (Platform.OS === 'android' && SmartPickupBridge) {
      SmartPickupBridge.openAccessibilitySettings();
    }
  },

  openOverlaySettings: () => {
    if (Platform.OS === 'android' && SmartPickupBridge) {
      SmartPickupBridge.openOverlaySettings();
    }
  },

  updateSettings: (settings: Partial<DriverSettings>) => {
    if (Platform.OS === 'android' && SmartPickupBridge) {
      SmartPickupBridge.updateSettings(settings);
    }
  },

  simulateTrip: (
    platform: string,
    fare: number,
    distanceKm: number,
    durationMin: number
  ) => {
    if (Platform.OS === 'android' && SmartPickupBridge) {
      SmartPickupBridge.simulateTrip(platform, fare, distanceKm, durationMin);
    }
  },

  hideOverlay: () => {
    if (Platform.OS === 'android' && SmartPickupBridge) {
      SmartPickupBridge.hideOverlay();
    }
  },

  subscribeToTrips: (callback: (trip: TripOffer) => void) => {
    if (!eventEmitter) return { remove: () => {} };
    const subscription = eventEmitter.addListener('onTripDetected', (event: any) => {
      callback(event as TripOffer);
    });
    return subscription;
  },
};
