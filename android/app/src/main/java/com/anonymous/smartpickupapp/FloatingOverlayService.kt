package com.anonymous.smartpickupapp

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

class FloatingOverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private val handler = Handler(Looper.getMainLooper())
    private var dismissRunnable: Runnable? = null

    companion object {
        const val ACTION_SHOW_OFFER = "com.smartpickup.ACTION_SHOW_OFFER"
        const val ACTION_HIDE_OFFER = "com.smartpickup.ACTION_HIDE_OFFER"

        var currentOffer: TripOffer? = null

        fun show(context: Context, offer: TripOffer) {
            currentOffer = offer
            val intent = Intent(context, FloatingOverlayService::class.java).apply {
                action = ACTION_SHOW_OFFER
            }
            context.startService(intent)
        }

        fun hide(context: Context) {
            val intent = Intent(context, FloatingOverlayService::class.java).apply {
                action = ACTION_HIDE_OFFER
            }
            context.startService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW_OFFER -> {
                currentOffer?.let { showOverlay(it) }
            }
            ACTION_HIDE_OFFER -> {
                removeOverlay()
            }
        }
        return START_NOT_STICKY
    }

    private fun showOverlay(offer: TripOffer) {
        removeOverlay()

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 120
        }

        val card = buildOverlayCard(offer, params)
        overlayView = card
        windowManager?.addView(card, params)

        // Schedule auto dismiss
        dismissRunnable?.let { handler.removeCallbacks(it) }
        dismissRunnable = Runnable { removeOverlay() }
        handler.postDelayed(dismissRunnable!!, (DriverPreferences.autoDismissSeconds * 1000).toLong())
    }

    private fun buildOverlayCard(offer: TripOffer, params: WindowManager.LayoutParams): View {
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).toInt()

        // Root container with dark glassmorphic styling
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(12), dp(16), dp(14))

            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#181B26")) // Rich obsidian dark
                cornerRadius = dp(20).toFloat()
                setStroke(dp(2), Color.parseColor(offer.grade.colorHex)) // Glowing grade accent border
            }
            background = bg
            elevation = dp(16).toFloat()
        }

        // Header Row: Platform Badge + Grade Pill + Dismiss (X)
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val platformBadge = TextView(this).apply {
            text = offer.platform.displayName.uppercase()
            setTextColor(Color.WHITE)
            textSize = 12f
            paint.isFakeBoldText = true
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val gradePill = TextView(this).apply {
            text = offer.grade.label
            setTextColor(Color.parseColor(offer.grade.colorHex))
            textSize = 11f
            paint.isFakeBoldText = true
            setPadding(dp(8), dp(3), dp(8), dp(3))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#22" + offer.grade.colorHex.removePrefix("#")))
                cornerRadius = dp(12).toFloat()
            }
        }

        val closeBtn = TextView(this).apply {
            text = "✕"
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 14f
            setPadding(dp(10), dp(0), dp(0), dp(0))
            setOnClickListener { removeOverlay() }
        }

        headerRow.addView(platformBadge)
        headerRow.addView(gradePill)
        headerRow.addView(closeBtn)
        root.addView(headerRow)

        // Main Metrics Row: Big ₹/km and Big ₹/hr
        val metricsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(10), 0, dp(8))
        }

        val kmContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val kmValue = TextView(this).apply {
            text = "₹${offer.ratePerKm}"
            setTextColor(Color.parseColor(offer.grade.colorHex))
            textSize = 22f
            paint.isFakeBoldText = true
        }

        val kmLabel = TextView(this).apply {
            text = "per km"
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 11f
        }
        kmContainer.addView(kmValue)
        kmContainer.addView(kmLabel)

        val divider = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(dp(1), dp(32)).apply {
                setMargins(dp(12), 0, dp(12), 0)
            }
            setBackgroundColor(Color.parseColor("#334155"))
        }

        val hrContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val hrValue = TextView(this).apply {
            text = "₹${offer.ratePerHour.toInt()}"
            setTextColor(Color.WHITE)
            textSize = 22f
            paint.isFakeBoldText = true
        }

        val hrLabel = TextView(this).apply {
            text = "per hour"
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 11f
        }
        hrContainer.addView(hrValue)
        hrContainer.addView(hrLabel)

        metricsRow.addView(kmContainer)
        metricsRow.addView(divider)
        metricsRow.addView(hrContainer)
        root.addView(metricsRow)

        // Footer: Total Fare + Distance + Duration
        val footerRow = TextView(this).apply {
            text = "Fare: ₹${offer.fare.toInt()} • ${offer.totalKm} km • ${offer.durationMin.toInt()} min"
            setTextColor(Color.parseColor("#E2E8F0"))
            textSize = 12f
            setPadding(0, dp(4), 0, 0)
        }
        root.addView(footerRow)

        // Drag handler to allow the driver to position the overlay anywhere
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        root.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    // Reset auto dismiss timer on touch
                    dismissRunnable?.let { handler.removeCallbacks(it) }
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(root, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    // Reschedule auto-dismiss on release
                    dismissRunnable?.let { handler.removeCallbacks(it) }
                    handler.postDelayed(dismissRunnable!!, (DriverPreferences.autoDismissSeconds * 1000).toLong())
                    true
                }
                else -> false
            }
        }

        return root
    }

    private fun removeOverlay() {
        dismissRunnable?.let { handler.removeCallbacks(it) }
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (_: Exception) {}
            overlayView = null
        }
    }

    override fun onDestroy() {
        removeOverlay()
        super.onDestroy()
    }
}
