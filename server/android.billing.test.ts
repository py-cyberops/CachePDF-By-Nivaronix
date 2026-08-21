import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CachePDF Android Play Billing bridge", () => {
  const source = readFileSync(
    path.resolve(process.cwd(), "android/app/src/main/java/com/nivaronix/cachepdf/CachePdfProPlugin.java"),
    "utf8",
  );

  it("loads product details and launches the first purchase in the same user action", () => {
    expect(source).toContain("loadProduct((details) -> launchPurchase(call, details), call::reject)");
    expect(source).toContain("private void launchPurchase(PluginCall call, ProductDetails details)");
    expect(source).not.toContain("if (productDetails == null) { queryProduct(call); return; }");
  });

  it("surfaces unavailable billing and product-offer states instead of leaving plugin calls unresolved", () => {
    expect(source).toContain("Google Play Billing is unavailable:");
    expect(source).toContain("CachePDF Pro does not currently have an available purchase offer.");
    expect(source).toContain("Google Play purchases are unavailable:");
  });

  it("shares one initial Billing connection across concurrent plugin calls", () => {
    expect(source).toContain("private boolean connecting;");
    expect(source).toContain("private final List<Runnable> pendingConnectionActions");
    expect(source).toContain("if (connecting) return;");
    expect(source).toContain("for (Runnable action : actions) action.run();");
  });
});
