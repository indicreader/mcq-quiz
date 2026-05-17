package com.mcqprep.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import android.content.res.Configuration;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onResume() {
        super.onResume();
        injectDynamicColors();
    }

    private void injectDynamicColors() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && bridge != null && bridge.getWebView() != null) {
            try {
                int primary = getResources().getColor(android.R.color.system_accent1_500, getTheme());
                int primaryContainer = getResources().getColor(android.R.color.system_accent1_100, getTheme());
                int onPrimaryContainer = getResources().getColor(android.R.color.system_accent1_900, getTheme());
                int secondary = getResources().getColor(android.R.color.system_accent2_500, getTheme());
                
                String hexPrimary = String.format("#%06X", (0xFFFFFF & primary));
                String hexPrimaryContainer = String.format("#%06X", (0xFFFFFF & primaryContainer));
                String hexOnPrimaryContainer = String.format("#%06X", (0xFFFFFF & onPrimaryContainer));
                String hexSecondary = String.format("#%06X", (0xFFFFFF & secondary));

                String js = "document.documentElement.style.setProperty('--m3-primary', '" + hexPrimary + "');" +
                            "document.documentElement.style.setProperty('--m3-primary-container', '" + hexPrimaryContainer + "');" +
                            "document.documentElement.style.setProperty('--m3-on-primary-container', '" + hexOnPrimaryContainer + "');" +
                            "document.documentElement.style.setProperty('--m3-secondary', '" + hexSecondary + "');";
                
                bridge.getWebView().evaluateJavascript(js, null);
            } catch (Exception e) {}
        }
    }
}
