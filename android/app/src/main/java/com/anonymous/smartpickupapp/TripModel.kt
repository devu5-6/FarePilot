package com.anonymous.smartpickupapp

enum class Platform(val displayName: String, val packageName: String) {
    UBER("Uber Driver", "com.ubercab.driver"),
    RAPIDO("Rapido", "com.rapido.pilot"),
    OLA("Ola", "com.olacabs.driver"),
    ZOMATO("Zomato", "com.zomato.delivery"),
    SWIGGY("Swiggy", "in.swiggy.deliverypartner"),
    OTHER("Delivery/Ride", "unknown")
}

enum class TripGrade(val label: String, val colorHex: String) {
    EXCELLENT("EXCELLENT", "#10B981"), // Emerald green
    GOOD("GOOD", "#06B6D4"),           // Cyan
    AVERAGE("AVERAGE", "#F59E0B"),     // Amber
    POOR("POOR", "#EF4444")            // Red
}

data class TripOffer(
    val id: String = System.currentTimeMillis().toString(),
    val platform: Platform,
    val fare: Double,
    val pickupKm: Double,
    val dropKm: Double,
    val totalKm: Double,
    val durationMin: Double,
    val ratePerKm: Double,
    val ratePerHour: Double,
    val grade: TripGrade,
    val timestamp: Long = System.currentTimeMillis()
)

object DriverPreferences {
    var minRatePerKm: Double = 18.0
    var minRatePerHour: Double = 280.0
    var autoDismissSeconds: Int = 8
    var isCoPilotActive: Boolean = true
    var enabledPlatforms = mutableSetOf(
        Platform.UBER,
        Platform.RAPIDO,
        Platform.OLA
    )
}
