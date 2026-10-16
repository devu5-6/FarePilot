package com.anonymous.smartpickupapp

import kotlin.math.max
import kotlin.math.roundToInt

object TripProfitabilityEngine {

    fun evaluate(
        platform: Platform,
        fare: Double,
        pickupKm: Double,
        dropKm: Double,
        durationMin: Double
    ): TripOffer {
        val totalKm = max(0.5, pickupKm + dropKm)
        val ratePerKm = (fare / totalKm * 100.0).roundToInt() / 100.0
        
        val effectiveDurationMin = if (durationMin > 0) durationMin else (totalKm * 3.0) // approx 20 km/h city average
        val ratePerHour = ((fare / (effectiveDurationMin / 60.0)) * 10.0).roundToInt() / 10.0

        val targetKm = DriverPreferences.minRatePerKm
        val targetHr = DriverPreferences.minRatePerHour

        val grade = when {
            ratePerKm >= targetKm * 1.25 && ratePerHour >= targetHr * 1.2 -> TripGrade.EXCELLENT
            ratePerKm >= targetKm && ratePerHour >= targetHr -> TripGrade.GOOD
            ratePerKm >= targetKm * 0.8 || ratePerHour >= targetHr * 0.8 -> TripGrade.AVERAGE
            else -> TripGrade.POOR
        }

        return TripOffer(
            platform = platform,
            fare = fare,
            pickupKm = pickupKm,
            dropKm = dropKm,
            totalKm = (totalKm * 10.0).roundToInt() / 10.0,
            durationMin = effectiveDurationMin,
            ratePerKm = ratePerKm,
            ratePerHour = ratePerHour,
            grade = grade
        )
    }
}
