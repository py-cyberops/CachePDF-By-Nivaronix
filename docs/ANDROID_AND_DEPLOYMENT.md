# CachePDF Web + Android Release Guide

## Product boundary

CachePDF by Nivaronix follows **Open → Work locally → Export → Leave**. Supported PDF and OCR work runs in the browser or Android WebView. The app does not use a CachePDF account, document database, cloud document storage, or server-side PDF processing.

## Web: Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | None / static site |
| Build command | `pnpm install --frozen-lockfile && pnpm build:pages` |
| Output directory | `dist/public` |
| Production branch | `main` |
| Custom domain | `cachepdf.nivaronix.com` |

In Cloudflare Pages, attach `cachepdf.nivaronix.com` to the project and follow the DNS record Cloudflare presents. Keep SSL/TLS in **Full (strict)** when the origin path requires it. `_redirects` supplies SPA fallback while prerendered HTML remains available for public SEO routes. `_headers` supplies static-host security headers; review the Content Security Policy whenever a required worker or public integration changes.

## Android package and native integrations

| Item | Value |
|---|---|
| App label | CachePDF — Private PDF Tools |
| Application ID | `com.nivaronix.cachepdf` |
| Runtime | Capacitor 8 + Android WebView |
| Minimum SDK | 24 |
| Target / compile SDK | 36 |
| Version | `1.0.0` / code `1` |
| Pro product ID | `cachepdf_pro` |

Android uses the Storage Access Framework (`ACTION_OPEN_DOCUMENT`) and `content://` URIs for PDFs, JPEG, PNG, and WebP. The manifest accepts the same formats for **Open with CachePDF**. CachePDF does **not** request `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, or `MANAGE_EXTERNAL_STORAGE`; the user grants document access in the system picker. Generated output is held in app-scoped storage and shared through FileProvider/Android Sharesheet when the user explicitly exports. Source documents are read-only input and are never overwritten.

The bundled web shell includes application JavaScript, styles, PDF worker assets, and icons. Tesseract’s English language data is not guaranteed to be bundled by the current web-worker configuration. Before language data is first available, UI copy must remain accurate: **OCR engine: local; language data: download required.** After a successful language-resource load, the Android WebView cache may allow offline reuse, but this needs physical-device verification before making an unconditional offline OCR claim.

## Debug APK

```bash
pnpm install --frozen-lockfile
pnpm build:pages
pnpm exec cap sync android
cd android
./gradlew assembleDebug
# android/app/build/outputs/apk/debug/app-debug.apk
```

Install on a USB-debuggable device with `adb install -r app/build/outputs/apk/debug/app-debug.apk`.

## Signed Google Play AAB

Create a signing key that Nivaronix controls; do not commit it.

```bash
keytool -genkeypair -v -keystore cachepdf-release.jks -alias cachepdf -keyalg RSA -keysize 4096 -validity 10000
```

Place the key outside source control, then create `android/keystore.properties` locally:

```properties
storeFile=/absolute/path/to/cachepdf-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=cachepdf
keyPassword=YOUR_KEY_PASSWORD
```

The file and common keystore extensions are ignored by Git. Build the signed AAB:

```bash
pnpm build:pages
pnpm exec cap sync android
cd android
./gradlew bundleRelease
# android/app/build/outputs/bundle/release/app-release.aab
```

## Google Play Console: CachePDF Pro

Create a managed one-time product with ID `cachepdf_pro`. Configure the base price in Play Console (recommended launch target: **US$14.99**, with Play managing localized display pricing). The Android Billing bridge queries product details rather than hardcoding price, launches the Google Play purchase flow, checks purchased state, restores entitlement from the Play account, and acknowledges a completed non-consumable purchase. It does not send filename, PDF bytes, OCR text, metadata, signature content, or document history to billing.

Use internal testing first. Add license testers, upload the signed AAB, create and activate the product, then verify buy, cancel, pending, acknowledgement, restore after reinstall, and feature gating on a physical Play-enabled device. The current implementation is accountless and client-side; Nivaronix may add server-side purchase verification later only if the fraud/risk model warrants the added infrastructure.

## Required physical-device validation

Before a Play production rollout, test launch, branded icon/splash, Open With, picker, merge, split, reorder, rotate, extract, delete, conversion, watermark, page numbers, OCR, searchable OCR, metadata cleanup, compression, signatures, ZIP/TXT/PDF/image export, Android Sharesheet, themes, back navigation, offline shell, memory preflight, cancellation, and all Pro purchase states. Record exact device and Android version results. Do not declare OCR fully offline until the language-data flow is verified on that device.

## Known Android constraints

PDF.js/Tesseract processing is memory-intensive in an Android WebView. CachePDF’s existing large-file preflight should remain enabled; very large or image-heavy files may require more available device memory than desktop browsers. An Android physical device is required for final validation of SAF/intent/share behavior and Play Billing; sandbox compilation alone cannot prove those flows.
