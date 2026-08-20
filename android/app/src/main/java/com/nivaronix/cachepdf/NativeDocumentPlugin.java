package com.nivaronix.cachepdf;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeDocument")
public class NativeDocumentPlugin extends Plugin {
  private Uri incomingUri;

  @Override
  public void load() {
    Intent intent = getActivity().getIntent();
    if (Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) incomingUri = intent.getData();
  }

  @PluginMethod
  public void pickDocument(PluginCall call) {
    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    intent.setType("*/*");
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/pdf", "image/jpeg", "image/png", "image/webp"});
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    startActivityForResult(call, intent, "handleDocument");
  }

  @ActivityCallback
  private void handleDocument(PluginCall call, ActivityResult result) {
    if (call == null || result.getData() == null || result.getData().getData() == null) { if (call != null) call.reject("No document was selected."); return; }
    Uri uri = result.getData().getData();
    try { getContext().getContentResolver().takePersistableUriPermission(uri, result.getData().getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (SecurityException ignored) { }
    call.resolve(describe(uri));
  }

  @Override
  protected void handleOnNewIntent(Intent intent) {
    super.handleOnNewIntent(intent);
    if (Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) incomingUri = intent.getData();
  }

  @PluginMethod
  public void consumeIncomingDocument(PluginCall call) {
    if (incomingUri == null) { call.resolve(); return; }
    Uri uri = incomingUri; incomingUri = null; call.resolve(describe(uri));
  }

  @PluginMethod
  public void saveExport(PluginCall call) {
    String filename = call.getString("filename");
    String mimeType = call.getString("mimeType", "application/octet-stream");
    String base64 = call.getString("base64");
    if (filename == null || base64 == null) { call.reject("Export filename or content is missing."); return; }
    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType(mimeType);
    intent.putExtra(Intent.EXTRA_TITLE, filename);
    startActivityForResult(call, intent, "writeExport");
  }

  @ActivityCallback
  private void writeExport(PluginCall call, ActivityResult result) {
    if (call == null || result.getData() == null || result.getData().getData() == null) { if (call != null) call.reject("Export location was not selected."); return; }
    try {
      byte[] bytes = Base64.decode(call.getString("base64"), Base64.DEFAULT);
      try (java.io.OutputStream output = getContext().getContentResolver().openOutputStream(result.getData().getData(), "w")) {
        if (output == null) throw new java.io.IOException("Android could not open the selected destination.");
        output.write(bytes);
      }
      call.resolve();
    } catch (Exception error) { call.reject("CachePDF could not write the export.", error); }
  }

  private JSObject describe(Uri uri) {
    String name = "cachepdf-document"; String mimeType = getContext().getContentResolver().getType(uri);
    try (Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null)) { if (cursor != null && cursor.moveToFirst()) { int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME); if (index >= 0) name = cursor.getString(index); } }
    JSObject output = new JSObject(); output.put("uri", uri.toString()); output.put("name", name); output.put("mimeType", mimeType == null ? "application/octet-stream" : mimeType); return output;
  }
}
