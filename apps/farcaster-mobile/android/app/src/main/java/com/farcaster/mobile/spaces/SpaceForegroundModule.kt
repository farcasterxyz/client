package com.farcaster.mobile.spaces

import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SpaceForegroundModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "SpaceForeground"

    @ReactMethod
    fun start(title: String?, subtitle: String?, enableMicrophone: Boolean) {
        val serviceIntent =
            Intent(reactContext, SpaceForegroundService::class.java).apply {
                putExtra(SpaceForegroundService.EXTRA_TITLE, title)
                putExtra(SpaceForegroundService.EXTRA_SUBTITLE, subtitle)
                putExtra(SpaceForegroundService.EXTRA_ENABLE_MICROPHONE, enableMicrophone)
            }
        ContextCompat.startForegroundService(reactContext, serviceIntent)
    }

    @ReactMethod
    fun stop() {
        val serviceIntent = Intent(reactContext, SpaceForegroundService::class.java)
        reactContext.stopService(serviceIntent)
    }
}
