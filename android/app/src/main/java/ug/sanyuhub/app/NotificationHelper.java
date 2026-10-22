package ug.sanyuhub.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

public class NotificationHelper {

    public static final String CHANNEL_ID_ANNOUNCEMENTS = "sanyuhub_announcements";
    public static final String EXTRA_TARGET_URL = "TARGET_URL";
    private static int notificationIdCounter = 1000;

    /**
     * Initializes Android 8.0+ (Oreo) notification channels.
     */
    public static void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "SanyuHub Announcements";
            String description = "Notifications for new movies, series, live TV events, and platform updates.";
            int importance = NotificationManager.IMPORTANCE_DEFAULT;

            NotificationChannel channel = new NotificationChannel(CHANNEL_ID_ANNOUNCEMENTS, name, importance);
            channel.setDescription(description);

            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * Checks whether notification permission is granted on the device.
     */
    public static boolean isNotificationPermissionGranted(Context context) {
        if (Build.VERSION.SDK_INT >= 33) {
            return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    /**
     * Opens system notification settings for the application.
     */
    public static void openNotificationSettings(Context context) {
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName());
            } else {
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", context.getPackageName(), null));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception ignored) {
        }
    }

    /**
     * Validates if a target URL is a safe internal SanyuHub route.
     */
    public static boolean isValidSanyuHubUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        String cleanUrl = url.trim();
        if (cleanUrl.startsWith("/")) {
            return true;
        }
        try {
            Uri uri = Uri.parse(cleanUrl);
            String host = uri.getHost();
            if (host != null) {
                String lowerHost = host.toLowerCase();
                return lowerHost.contains("sanyuhub") || lowerHost.contains("onrender.com") || lowerHost.contains("localhost");
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    /**
     * Displays a system notification if permissions permit.
     */
    public static void showNotification(Context context, String title, String message, String targetUrl) {
        if (!isNotificationPermissionGranted(context)) {
            return;
        }

        createNotificationChannels(context);

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        if (isValidSanyuHubUrl(targetUrl)) {
            intent.putExtra(EXTRA_TARGET_URL, targetUrl);
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        int currentId = ++notificationIdCounter;
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                currentId,
                intent,
                flags
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID_ANNOUNCEMENTS)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title != null && !title.isEmpty() ? title : "SanyuHub")
                .setContentText(message != null ? message : "")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message != null ? message : ""))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        try {
            notificationManager.notify(currentId, builder.build());
        } catch (SecurityException ignored) {
        }
    }
}
