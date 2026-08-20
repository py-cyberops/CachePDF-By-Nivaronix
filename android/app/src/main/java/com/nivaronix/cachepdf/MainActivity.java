package com.nivaronix.cachepdf;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle savedInstanceState) { registerPlugin(NativeDocumentPlugin.class); registerPlugin(CachePdfProPlugin.class); super.onCreate(savedInstanceState); }
}
