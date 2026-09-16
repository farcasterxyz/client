package com.farcaster.mobile.spaces

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.farcaster.mobile.MainActivity
import com.farcaster.mobile.R

class SpaceForegroundService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val title = intent?.getStringExtra(EXTRA_TITLE)?.takeIf { it.isNotBlank() } ?: DEFAULT_TITLE
        val subtitle =
            intent?.getStringExtra(EXTRA_SUBTITLE)?.takeIf { it.isNotBlank() } ?: DEFAULT_SUBTITLE
        val enableMicrophone = intent?.getBooleanExtra(EXTRA_ENABLE_MICROPHONE, false) ?: false

        ensureNotificationChannel()
        val notification = buildNotification(title, subtitle)
        startSpaceForeground(notification, enableMicrophone)
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        stopSelf()
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    private fun buildNotification(title: String, subtitle: String): Notification {
        val launchIntent =
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
        val pendingIntent =
            PendingIntent.getActivity(
                this,
                REQUEST_CODE_OPEN_APP,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.notification_icon)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        val notificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel =
            NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = CHANNEL_DESCRIPTION
                setSound(null, null)
                enableVibration(false)
            }
        notificationManager.createNotificationChannel(channel)
    }

    private fun startSpaceForeground(notification: Notification, enableMicrophone: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            var serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            if (enableMicrophone && hasRecordAudioPermission()) {
                serviceType = serviceType or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            }
            startForeground(NOTIFICATION_ID, notification, serviceType)
            return
        }
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun hasRecordAudioPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
    }

    companion object {
        const val EXTRA_TITLE = "space_title"
        const val EXTRA_SUBTITLE = "space_subtitle"
        const val EXTRA_ENABLE_MICROPHONE = "space_enable_microphone"

        private const val CHANNEL_ID = "spaces_playback"
        private const val CHANNEL_NAME = "Spaces audio"
        private const val CHANNEL_DESCRIPTION = "Keeps live Space audio playing in background"
        private const val DEFAULT_TITLE = "Space is playing"
        private const val DEFAULT_SUBTITLE = "Listening in background"
        private const val REQUEST_CODE_OPEN_APP = 21_001
        private const val NOTIFICATION_ID = 21_002
    }
}
