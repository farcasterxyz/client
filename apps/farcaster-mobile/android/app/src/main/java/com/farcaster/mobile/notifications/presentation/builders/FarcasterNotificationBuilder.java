package com.farcaster.mobile.notifications.presentation.builders;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.util.Log;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.core.app.Person;
import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;
import androidx.core.graphics.drawable.IconCompat;

import com.farcaster.mobile.R;

import org.json.JSONObject;

import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.interfaces.INotificationContent;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder;
import expo.modules.notifications.service.NotificationsService;
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore;
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord;

public class FarcasterNotificationBuilder {
    private Context mContext;
    private expo.modules.notifications.notifications.model.Notification mNotification;
    private SharedPreferencesNotificationCategoriesStore mStore;
    private ExpoNotificationBuilder expoBuilder;

    public FarcasterNotificationBuilder(
      Context context,
      @NonNull expo.modules.notifications.notifications.model.Notification notification,
      @NonNull SharedPreferencesNotificationCategoriesStore store
    ) {
        mContext = context;
        mNotification = notification;
        mStore = store;
        expoBuilder = new ExpoNotificationBuilder(context, notification, store);
    }

    private Bitmap getBitmapFromURL(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();
            Bitmap myBitmap = BitmapFactory.decodeStream(input);
            return myBitmap;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    private static Bitmap getCircleBitmap(Bitmap bitmap) {
        Bitmap output;
        Rect srcRect, dstRect;
        float r;
        final int width = bitmap.getWidth();
        final int height = bitmap.getHeight();

        if (width > height){
            output = Bitmap.createBitmap(height, height, Bitmap.Config.ARGB_8888);
            int left = (width - height) / 2;
            int right = left + height;
            srcRect = new Rect(left, 0, right, height);
            dstRect = new Rect(0, 0, height, height);
            r = height / 2;
        } else{
            output = Bitmap.createBitmap(width, width, Bitmap.Config.ARGB_8888);
            int top = (height - width)/2;
            int bottom = top + width;
            srcRect = new Rect(0, top, width, bottom);
            dstRect = new Rect(0, 0, width, width);
            r = width / 2;
        }

        Canvas canvas = new Canvas(output);

        final int color = 0xff424242;
        final Paint paint = new Paint();

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        paint.setColor(color);
        canvas.drawCircle(r, r, r, paint);
        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(bitmap, srcRect, dstRect, paint);

        bitmap.recycle();

        return output;
    }

    private NotificationCompat.Builder createBuilder() {
        NotificationCompat.Builder builder = expoBuilder.createBuilder();

        // Wire the tap to expo-notifications' notification-response intent (same
        // as stock ExpoNotificationBuilder.build()): the response reaches JS
        // listeners so the app can navigate to the right screen, and expo
        // foregrounds the app without FLAG_ACTIVITY_CLEAR_TASK. The previous
        // manual launcher intent here used CLEAR_TASK, which destroyed the
        // activity stack on every notification tap: the whole React root
        // remounted, navigation state was lost (user landed on Home), and the
        // tap payload never reached JS. expoBuilder.createBuilder() does not set
        // a content intent itself (that happens in expo's suspend build()), so
        // we must set it here.
        NotificationAction defaultTapAction = new NotificationAction(
            NotificationResponse.DEFAULT_ACTION_IDENTIFIER, null, true);
        builder.setContentIntent(
            NotificationsService.Companion.createNotificationResponseIntent(
                mContext, mNotification, defaultTapAction));
        builder.setAutoCancel(true);

        // This is needed for small notification icons to be rendered
        builder.setSmallIcon(getIcon());

        INotificationContent content = mNotification.getNotificationRequest().getContent();

        // This is needed to be able to actually set the title and body of a push
        builder.setContentTitle(content.getTitle()).setContentText(content.getText());

        String categoryIdentifier = content.getCategoryId();
        if (categoryIdentifier != null) {
            addActionsToBuilder(builder, categoryIdentifier);
        }

        if (content.getBadgeCount() != null) {
            builder.setNumber(content.getBadgeCount().intValue());
        }

        try {
            JSONObject body = content.getBody();
            if (body != null) {
                String imageUrl = body.getString("imageUrl");
                if (imageUrl != null) {
                    String conversationId = body.getString("conversationId");
                    Bitmap bitmap = getBitmapFromURL(imageUrl);
                    Person user = new Person.Builder()
                            .setIcon(IconCompat.createWithBitmap(getCircleBitmap(bitmap)))
                            .setName(content.getTitle())
                            .build();
                    builder.setStyle(new NotificationCompat.MessagingStyle(user)
                            .addMessage(content.getText(), (new Date()).getTime(), user)
                    );
                }
            }
        } catch (Exception e) {}

        return builder;
    }

    private void addActionsToBuilder(NotificationCompat.Builder builder, @NonNull String categoryIdentifier) {
        List<NotificationAction> actions = Collections.emptyList();
        try {
            NotificationCategory category = mStore.getNotificationCategory(categoryIdentifier);
            if (category != null) {
                actions = category.getActions();
            }
        } catch (ClassNotFoundException | IOException e) {
            Log.e("expo-notifications", String.format("Could not read category with identifier: %s. %s", categoryIdentifier, e.getMessage()));
            e.printStackTrace();
        }
        for (NotificationAction action : actions) {
            if (action instanceof TextInputNotificationAction) {
                builder.addAction(buildTextInputAction((TextInputNotificationAction) action));
            } else {
                builder.addAction(buildButtonAction(action));
            }
        }
    }

    public Notification build() {
        return createBuilder().build();
    }

    private int getIcon() {
      try {
        return mContext.getPackageManager().getApplicationInfo(
          mContext.getPackageName(),
          PackageManager.GET_META_DATA
        ).metaData.getInt("expo.modules.notifications.default_notification_icon");
      } catch (PackageManager.NameNotFoundException e) {
        return mContext.getApplicationInfo().icon;
      }
    }

    private NotificationCompat.Action buildButtonAction(@NonNull NotificationAction action) {
        PendingIntent intent = NotificationsService.Companion.createNotificationResponseIntent(mContext, mNotification, action);
        return new NotificationCompat.Action.Builder(getIcon(), action.getTitle(), intent).build();
    }

    private NotificationCompat.Action buildTextInputAction(@NonNull TextInputNotificationAction action) {
        PendingIntent intent = NotificationsService.Companion.createNotificationResponseIntent(mContext, mNotification, action);
        RemoteInput remoteInput = new RemoteInput.Builder(NotificationsService.USER_TEXT_RESPONSE_KEY)
                .setLabel(action.getPlaceholder())
                .build();

        return new NotificationCompat.Action.Builder(getIcon(), action.getTitle(), intent).addRemoteInput(remoteInput).build();
    }

    public FarcasterNotificationBuilder setAllowedBehavior(NotificationBehaviorRecord behavior) {
      expoBuilder.setAllowedBehavior(behavior);
      return this;
    }
}
