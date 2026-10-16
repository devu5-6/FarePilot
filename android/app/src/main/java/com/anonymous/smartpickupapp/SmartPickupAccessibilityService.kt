package com.anonymous.smartpickupapp

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.util.regex.Pattern

class SmartPickupAccessibilityService : AccessibilityService() {

    companion object {
        const val TAG = "SmartPickupA11y"
        var isRunning: Boolean = false
        var lastOfferHash: String = ""
        var lastOfferTime: Long = 0
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
        Log.d(TAG, "Smart Pickup Accessibility Service connected and monitoring")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!DriverPreferences.isCoPilotActive) return
        val packageName = event?.packageName?.toString() ?: return

        val platform = when {
            packageName.contains("ubercab.driver") -> Platform.UBER
            packageName.contains("rapido") -> Platform.RAPIDO
            packageName.contains("olacabs") -> Platform.OLA
            packageName.contains("zomato") -> Platform.ZOMATO
            packageName.contains("swiggy") -> Platform.SWIGGY
            else -> return
        }

        if (!DriverPreferences.enabledPlatforms.contains(platform)) return

        val rootNode = rootInActiveWindow ?: return
        val textList = mutableListOf<String>()
        collectAllText(rootNode, textList)

        parseAndProcessRideData(platform, textList)
    }

    private fun collectAllText(node: AccessibilityNodeInfo?, outList: MutableList<String>) {
        if (node == null) return
        node.text?.let {
            val textStr = it.toString().trim()
            if (textStr.isNotEmpty()) outList.add(textStr)
        }
        for (i in 0 until node.childCount) {
            collectAllText(node.getChild(i), outList)
        }
    }

    private fun parseAndProcessRideData(platform: Platform, texts: List<String>) {
        val joined = texts.joinToString(" ")
        
        var fare: Double? = null
        var distanceKm: Double? = null
        var durationMin: Double? = null

        // 1. Parse Fare: ₹123, Rs. 123, or 123 fare
        val farePattern = Pattern.compile("(?:[₹]|Rs\\.?|INR)\\s*([0-9]+(?:\\.[0-9]+)?)", Pattern.CASE_INSENSITIVE)
        val fareMatcher = farePattern.matcher(joined)
        if (fareMatcher.find()) {
            fare = fareMatcher.group(1)?.toDoubleOrNull()
        }

        // 2. Parse Distance: 4.8 km or 4.8km
        val distPattern = Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*(?:km|kms)", Pattern.CASE_INSENSITIVE)
        val distMatcher = distPattern.matcher(joined)
        if (distMatcher.find()) {
            distanceKm = distMatcher.group(1)?.toDoubleOrNull()
        }

        // 3. Parse Duration: 15 min or 15 mins
        val durPattern = Pattern.compile("([0-9]+)\\s*(?:min|mins|minutes)", Pattern.CASE_INSENSITIVE)
        val durMatcher = durPattern.matcher(joined)
        if (durMatcher.find()) {
            durationMin = durMatcher.group(1)?.toDoubleOrNull()
        }

        if (fare != null && distanceKm != null && fare > 0 && distanceKm > 0) {
            val offerKey = "${platform.name}_${fare}_${distanceKm}"
            val now = System.currentTimeMillis()

            // Prevent spamming the overlay for the same job within 6 seconds
            if (offerKey == lastOfferHash && (now - lastOfferTime) < 6000) {
                return
            }

            lastOfferHash = offerKey
            lastOfferTime = now

            val evaluated = TripProfitabilityEngine.evaluate(
                platform = platform,
                fare = fare,
                pickupKm = 0.0,
                dropKm = distanceKm,
                durationMin = durationMin ?: (distanceKm * 3.0)
            )

            Log.i(TAG, "Smart Pickup Detected Offer: ₹$fare for $distanceKm km (${evaluated.grade})")

            // Show floating HUD overlay
            FloatingOverlayService.show(applicationContext, evaluated)

            // Send event to React Native UI
            SmartPickupBridgeModule.notifyTrip(evaluated)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Smart Pickup Accessibility Service interrupted")
    }

    override fun onDestroy() {
        isRunning = false
        super.onDestroy()
    }
}
