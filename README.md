# 🚗 Smart Pickup — Intelligent Co-Pilot for Drivers

A modern, high-performance ride & delivery evaluation companion app built with **React Native / Expo** and native **Android Services**. 

Reverse-engineered and inspired by GigPe, **Smart Pickup** features a sleek, obsidian dark-mode interface with glassmorphic accents, customizable profitability targets, and real-time floating heads-up display (HUD).

---

## ⚡ Core Features

- **Automated Screen & Ride Interception**: Monitors incoming ride cards from **Uber Driver**, **Rapido Pilot**, **Ola Driver**, **Zomato**, and **Swiggy**.
- **Real-Time Profitability Engine**:
  - Calculates exact **₹ / km** ($\frac{\text{Fare}}{\text{Pickup + Drop Distance}}$).
  - Calculates estimated **₹ / hour** ($\frac{\text{Fare}}{\text{Duration / 60}}$).
  - Grades trips into **EXCELLENT**, **GOOD**, **AVERAGE**, and **POOR** based on driver-configured thresholds.
- **Floating HUD Overlay**:
  - Translucent glassmorphic card overlaid directly over driver screens via Android's `WindowManager`.
  - Draggable anywhere on screen.
  - Color-coded glowing border and badge.
  - Configurable auto-dismiss timer.
- **Customizable Targets**:
  - Adjust target ₹/km (e.g. ₹18/km).
  - Adjust target ₹/hr (e.g. ₹280/hr).
- **In-App Simulator**:
  - Test the floating HUD on your phone with single-tap mock orders without needing active customer pings.
- **Daily Shift Analytics**:
  - Track total evaluated rides, high-margin rides, and average ₹/km.

---

## 🛠️ Architecture

```
Smart Pickup/
├── App.tsx                              # Sleek React Native Dashboard & Settings UI
├── src/
│   ├── types/trip.ts                   # Data models and interfaces
│   └── services/SmartPickupBridge.ts   # Native bridge interface
└── android/app/src/main/
    ├── AndroidManifest.xml             # Permissions & service declarations
    ├── res/xml/
    │   └── accessibility_service_config.xml
    └── java/com/anonymous/smartpickupapp/
        ├── TripModel.kt                # Platform, TripOffer, TripGrade & DriverPreferences
        ├── TripProfitabilityEngine.kt  # Math & scoring algorithm
        ├── SmartPickupAccessibilityService.kt # Screen node parser
        ├── FloatingOverlayService.kt   # Native draggable HUD WindowManager overlay
        ├── SmartPickupForegroundService.kt    # Background persistence & notification
        ├── SmartPickupBridgeModule.kt  # React Native Turbo/NativeModule bridge
        └── SmartPickupPackage.kt       # React Package registration
```

---

## 🚀 Running the App

### 1. Start Metro / Development Server
```powershell
npm start
```

### 2. Run Directly on Connected Android Device
Make sure your phone is connected via USB with USB debugging enabled:
```powershell
npx expo run:android
```
*(Or `npm run android`)*

---

## 📱 Permissions Required on Android
1. **Display Over Other Apps**: Allows Smart Pickup to draw the floating HUD over Uber/Rapido.
2. **Accessibility Service**: Allows reading the incoming ride details (fare & distance) from driver screens.
