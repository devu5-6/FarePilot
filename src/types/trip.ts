export type PlatformType = 'Uber Driver' | 'Rapido' | 'Ola' | 'Zomato' | 'Swiggy' | 'Delivery/Ride';

export type TripGradeType = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

export interface TripOffer {
  id: string;
  platform: PlatformType;
  fare: number;
  totalKm: number;
  durationMin: number;
  ratePerKm: number;
  ratePerHour: number;
  grade: TripGradeType;
  gradeColor: string;
  timestamp: number;
}

export interface DriverSettings {
  minRatePerKm: number;
  minRatePerHour: number;
  autoDismissSeconds: number;
  isCoPilotActive: boolean;
}

export interface PermissionStatus {
  overlayGranted: boolean;
  accessibilityGranted: boolean;
  isCoPilotActive: boolean;
}
