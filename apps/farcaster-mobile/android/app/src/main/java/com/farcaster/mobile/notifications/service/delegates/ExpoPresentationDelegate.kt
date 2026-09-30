package com.farcaster.mobile.notifications.service.delegates

import android.annotation.SuppressLint
import android.content.Context
import android.media.RingtoneManager
import android.net.Uri
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import com.farcaster.mobile.notifications.presentation.builders.FarcasterNotificationBuilder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

open class ExpoPresentationDelegate(
    private val appContext: Context,
    private val notificationManager: NotificationManagerCompat = NotificationManagerCompat.from(appContext)
) : expo.modules.notifications.service.delegates.ExpoPresentationDelegate(appContext, notificationManager) {

    /**
     * Callback called to present the system UI for a notification.
     *
     * If the notification behavior is set to not show any alert,
     * we (may) play a sound, but then bail out early. You cannot
     * set badge count without showing a notification.
     */
    @SuppressLint("MissingPermission")
    override fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?) {
        if (behavior?.shouldPresentAlert == false) {
            if (behavior.shouldPlaySound) {
                val sound = notification.notificationRequest.trigger.getNotificationChannel()?.let {
                  notificationManager.getNotificationChannel(it)?.sound
                } ?: Settings.System.DEFAULT_NOTIFICATION_URI
                RingtoneManager.getRingtone(appContext, sound).play()
            }
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            val systemNotification = buildSystemNotification(notification, behavior)

            NotificationManagerCompat.from(appContext).notify(
                notification.notificationRequest.identifier,
                getNotifyId(notification.notificationRequest),
                systemNotification
            )
        }
    }

    private suspend fun buildSystemNotification(
        notification: Notification,
        behavior: NotificationBehaviorRecord?
    ): android.app.Notification =
        FarcasterNotificationBuilder(
            appContext,
            notification,
            SharedPreferencesNotificationCategoriesStore(appContext)
        )
        .setAllowedBehavior(behavior)
        .build()
}
