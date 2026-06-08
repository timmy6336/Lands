package com.lands.game;

import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

// Runs the WebView edge-to-edge: hides the status bar and navigation bar so
// the board isn't squeezed by grey system-bar strips on phones (the game is a
// fixed-orientation, fullscreen experience — there's no chrome to preserve
// space for). "Immersive sticky" keeps the bars hidden but lets the player
// briefly reveal them with a swipe from the edge without exiting the app.
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }
}
