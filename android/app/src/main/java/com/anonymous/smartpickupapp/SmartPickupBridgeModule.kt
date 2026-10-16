package com.anonymous.smartpickupapp

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmartPickupBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "SmartPickupBridge"
        private var activeContext: ReactApplicationContext? = null

        fun notifyTrip(offer: TripOffer) {
            val ctx = activeContext ?: return
            val map = Arguments.createMap().apply {
                putString("id", offer.id)
                putString("platform", offer.platform.displayName)
                putDouble("fare", offer.fare)
                putDouble("totalKm", offer.totalKm)
                putDouble("durationMin", offer.durationMin)
                putDouble("ratePerKm", offer.ratePerKm)
                putDouble("ratePerHour", offer.ratePerHour)
                putString("grade", offer.grade.label)
                putString("gradeColor", offer.grade.colorHex)
                putDouble("timestamp", offer.timestamp.toDouble())
            }

            try {
                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onTripDetected", map)
            } catch (_: Exception) {}
        }
    }

    init {
        activeContext = reactContext
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val overlayGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactContext)
        } else {
            true
        }
        val accessibilityGranted = SmartPickupAccessibilityService.isRunning

        val result = Arguments.createMap().apply {
            putBoolean("overlayGranted", overlayGranted)
            putBoolean("accessibilityGranted", accessibilityGranted)
            putBoolean("isCoPilotActive", DriverPreferences.isCoPilotActive)
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + reactContext.packageName)
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun updateSettings(settings: ReadableMap) {
        if (settings.hasKey("minRatePerKm")) {
            DriverPreferences.minRatePerKm = settings.getDouble("minRatePerKm")
        }
        if (settings.hasKey("minRatePerHour")) {
            DriverPreferences.minRatePerHour = settings.getDouble("minRatePerHour")
        }
        if (settings.hasKey("autoDismissSeconds")) {
            DriverPreferences.autoDismissSeconds = settings.getInt("autoDismissSeconds")
        }
        if (settings.hasKey("isCoPilotActive")) {
            val active = settings.getBoolean("isCoPilotActive")
            DriverPreferences.isCoPilotActive = active
            if (active) {
                SmartPickupForegroundService.start(reactContext)
            } else {
                SmartPickupForegroundService.stop(reactContext)
            }
        }
    }

    @ReactMethod
    fun simulateTrip(platformStr: String, fare: Double, distanceKm: Double, durationMin: Double) {
        val platform = when (platformStr.lowercase()) {
            "uber" -> Platform.UBER
            "rapido" -> Platform.RAPIDO
            "ola" -> Platform.OLA
            "zomato" -> Platform.ZOMATO
            "swiggy" -> Platform.SWIGGY
            else -> Platform.OTHER
        }

        val evaluated = TripProfitabilityEngine.evaluate(
            platform = platform,
            fare = fare,
            pickupKm = 0.0,
            dropKm = distanceKm,
            durationMin = durationMin
        )

        FloatingOverlayService.show(reactContext, evaluated)
        notifyTrip(evaluated)
    }

    @ReactMethod
    fun hideOverlay() {
        FloatingOverlayService.hide(reactContext)
    }

    @ReactMethod
    fun addListener(eventName: String?) {}

    @ReactMethod
    fun removeListeners(count: Int?) {}
}
