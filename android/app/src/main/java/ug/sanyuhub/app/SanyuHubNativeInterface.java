package ug.sanyuhub.app;

import android.webkit.JavascriptInterface;

public class SanyuHubNativeInterface {

    private final MainActivity activity;

    public SanyuHubNativeInterface(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public boolean isAndroidApp() {
        return true;
    }

    @JavascriptInterface
    public boolean isNotificationPermissionGranted() {
        return NotificationHelper.isNotificationPermissionGranted(activity);
    }

    @JavascriptInterface
    public void requestNotificationPermission() {
        activity.requestNotificationPermissionFromJs();
    }

    @JavascriptInterface
    public void openNotificationSettings() {
        NotificationHelper.openNotificationSettings(activity);
    }

    @JavascriptInterface
    public void postNotification(String title, String message, String targetUrl) {
        NotificationHelper.showNotification(activity, title, message, targetUrl);
    }
}
