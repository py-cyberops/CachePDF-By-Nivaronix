# CachePDF Android Device Validation

**Validated release:** `d1590e88`  
**Device:** Redmi 10 Prime  
**System:** MIUI Global 14.0.8 (`14.0.8.0(TKUINXM)`) on Android 13  
**Test basis:** User-operated physical-device validation after installing the Capacitor debug APK.

## Confirmed Outcomes

| Area | Result | Evidence / notes |
|---|---|---|
| Debug APK installation | Pass | The application installed and launched on the physical device. |
| Launcher icon | Pass | The user confirmed the corrected CachePDF icon. |
| Offline CachePDF/Nivaronix asset packaging | Pass | The repaired app operated with the bundled asset mapping; the user confirmed the final app behavior as working. |
| PDF export | Pass | Device retest confirmed saved outputs work after the binary-safe export repair. |
| ZIP export | Pass | The device retest confirmed the ZIP export flow works after repair. |
| Image export | Pass | The device retest confirmed image output works after repair. |
| TXT export | Pass | The device retest confirmed text output works after repair. |
| Export stability | Pass | The app no longer force-closes during the confirmed export retest. |
| Source preservation | Pass by design | Exports are written to a user-chosen destination through Android's Storage Access Framework; the selected source is never overwritten by CachePDF. |

## Build Evidence

The corrected project passed TypeScript validation, static web build, Capacitor Android synchronization, and Gradle `assembleDebug` compilation. The debug APK was generated successfully. The Android build requires JDK 21 and an installed Android API 36 SDK platform.

## Known Limitations

This validation covers a single physical Android 13 / MIUI device and the debug APK distribution path. Google Play Billing requires separate Play Console internal-test verification with the configured `cachepdf_pro` one-time product. OCR language-resource behavior remains dependent on the required language data being available locally after its first installation.

## Final Verdict

> **GO WITH KNOWN LIMITATIONS**

The private, accountless, on-device workbench model has been preserved: **Open → Work locally → Export → Leave**. Core repaired export and branding behavior is confirmed on the named physical device. Play internal-testing, purchase restoration, and broader Android-device compatibility testing remain required before a Google Play production rollout.
