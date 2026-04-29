package com.wly.charabook;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
