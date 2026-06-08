package com.lands.game;

import android.os.Bundle;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

// Runs the WebView edge-to-edge: hides the status bar and navigation bar so
// the board isn't squeezed by grey system-bar strips on phones (the game is a
// fixed-orientation, fullscreen experience — there's no chrome to preserve
// space for). Leaving them visible is also what was causing in-game overlap:
// setDecorFitsSystemWindows(false) makes the WebView draw full-screen (so
// window.innerHeight reports the *entire* screen height), but if the bars
// stay drawn on top, the visible area is smaller than that — the board gets
// sized for more room than it actually has.
//
// Targeting SDK 35+ makes Android enforce edge-to-edge layout itself, where
// the legacy View.SYSTEM_UI_FLAG_* immersive flags are deprecated.
// WindowCompat/WindowInsetsController is the modern replacement — but Capacitor's
// BridgeActivity hands focus to its WebView right after onCreate, which resets
// the hidden state, so the hide has to be re-applied whenever the window
// regains focus (the standard pattern for immersive mode actually sticking).
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
