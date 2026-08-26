package com.farcaster.mobile.notifications.service

import android.content.Context
import com.farcaster.mobile.notifications.service.delegates.ExpoPresentationDelegate
import expo.modules.notifications.service.interfaces.PresentationDelegate

/**
 * Subclass of expo.modules.notifications.service.NotificationsService, overrides presentation delegate
 * for our own use
 */
open class NotificationsService : expo.modules.notifications.service.NotificationsService() {
    override fun getPresentationDelegate(context: Context): PresentationDelegate =
        ExpoPresentationDelegate(context)
    //endregion
}
