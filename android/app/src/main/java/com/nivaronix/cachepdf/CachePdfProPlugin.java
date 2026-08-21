package com.nivaronix.cachepdf;

import android.app.Activity;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "CachePdfPro")
public class CachePdfProPlugin extends Plugin implements PurchasesUpdatedListener {
  private static final String PRODUCT_ID = "cachepdf_pro";
  private BillingClient billingClient;
  private ProductDetails productDetails;
  private PluginCall pendingPurchase;

  private interface ProductSuccess { void accept(ProductDetails details); }
  private interface ProductFailure { void reject(String message); }

  @Override public void load() {
    billingClient = BillingClient.newBuilder(getContext()).setListener(this).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).enableAutoServiceReconnection().build();
  }

  @PluginMethod public void getStatus(PluginCall call) { connect(call, () -> queryPurchases(call)); }
  @PluginMethod public void getProduct(PluginCall call) { connect(call, () -> queryProduct(call)); }
  @PluginMethod public void purchase(PluginCall call) { connect(call, () -> beginPurchase(call)); }
  @PluginMethod public void restore(PluginCall call) { connect(call, () -> queryPurchases(call)); }

  private void connect(PluginCall call, Runnable ready) {
    if (billingClient.isReady()) { ready.run(); return; }
    billingClient.startConnection(new BillingClientStateListener() { public void onBillingSetupFinished(BillingResult result) { if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) ready.run(); else call.reject("Google Play Billing is unavailable: " + result.getDebugMessage()); } public void onBillingServiceDisconnected() { } });
  }

  private void loadProduct(ProductSuccess success, ProductFailure failure) {
    List<QueryProductDetailsParams.Product> products = new ArrayList<>();
    products.add(QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT_ID).setProductType(BillingClient.ProductType.INAPP).build());
    billingClient.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(products).build(), (result, details) -> {
      if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || details.getProductDetailsList().isEmpty()) { failure.reject("CachePDF Pro is unavailable from Google Play."); return; }
      ProductDetails candidate = details.getProductDetailsList().get(0);
      if (candidate.getOneTimePurchaseOfferDetailsList() == null || candidate.getOneTimePurchaseOfferDetailsList().isEmpty()) { failure.reject("CachePDF Pro does not currently have an available purchase offer."); return; }
      productDetails = candidate;
      success.accept(candidate);
    });
  }

  private void queryProduct(PluginCall call) {
    loadProduct((details) -> { JSObject output = new JSObject(); output.put("productId", PRODUCT_ID); output.put("title", details.getTitle()); output.put("price", details.getOneTimePurchaseOfferDetailsList().get(0).getFormattedPrice()); call.resolve(output); }, call::reject);
  }
  private void beginPurchase(PluginCall call) {
    if (productDetails == null) {
      loadProduct((details) -> launchPurchase(call, details), call::reject);
      return;
    }
    launchPurchase(call, productDetails);
  }
  private void launchPurchase(PluginCall call, ProductDetails details) { pendingPurchase = call; Activity activity = getActivity(); BillingFlowParams.ProductDetailsParams line = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details).setOfferToken(details.getOneTimePurchaseOfferDetailsList().get(0).getOfferToken()).build(); BillingResult result = billingClient.launchBillingFlow(activity, BillingFlowParams.newBuilder().setProductDetailsParamsList(java.util.Collections.singletonList(line)).build()); if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { pendingPurchase = null; call.reject(result.getDebugMessage()); } }
  private void queryPurchases(PluginCall call) { billingClient.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> { if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { call.reject("Google Play purchases are unavailable: " + result.getDebugMessage()); return; } boolean entitled = false; for (Purchase purchase : purchases) if (purchase.getProducts().contains(PRODUCT_ID) && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) { entitled = true; acknowledge(purchase); } JSObject output = new JSObject(); output.put("entitled", entitled); output.put("productId", PRODUCT_ID); call.resolve(output); }); }
  private void acknowledge(Purchase purchase) { if (!purchase.isAcknowledged()) billingClient.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.getPurchaseToken()).build(), ignored -> { }); }
  @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) { PluginCall call = pendingPurchase; pendingPurchase = null; if (call == null) return; if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) { call.resolve(new JSObject().put("state", "cancelled")); return; } if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) { call.reject(result.getDebugMessage()); return; } for (Purchase purchase : purchases) if (purchase.getProducts().contains(PRODUCT_ID) && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) { acknowledge(purchase); call.resolve(new JSObject().put("state", "purchased").put("entitled", true)); return; } call.resolve(new JSObject().put("state", "pending").put("entitled", false)); }
}
