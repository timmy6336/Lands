package com.lands.game;

import android.os.Bundle;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

// Runs the WebView edge-to-edge: hides the status bar and navigation bar so
// the board isn't squeezed by grey system-bar strips on phones (the game is a
// fixed-orientation, fullscreen experience — there's no chrome to preserve
// space for).
//
// Targeting SDK 35+ makes Android enforce edge-to-edge layout itself, where
// the legacy View.SYSTEM_UI_FLAG_* immersive flags are deprecated and can
// produce inconsistent insets (the WebView and the system disagreeing about
// available height, clipping content). WindowCompat/WindowInsetsController is
// the modern replacement that cooperates with that enforcement correctly.
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
