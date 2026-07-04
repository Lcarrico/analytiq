# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r8s1_uas.spec.js >> artifact provenance panel lists the UAS stage chain
- Location: tests/ui/r8s1_uas.spec.js:17:5

# Error details

```
Error: browserContext.newPage: Target page, context or browser has been closed
Browser logs:

<launching> /sessions/blissful-funny-knuth/tmp/chromium --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --ash-no-nudges --disable-domain-reliability --disable-print-preview --disk-cache-size=33554432 --no-default-browser-check --no-pings --single-process --font-render-hinting=none --disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process --enable-features=SharedArrayBuffer --ignore-gpu-blocklist --in-process-gpu --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --allow-running-insecure-content --disable-setuid-sandbox --disable-site-isolation-trials --disable-web-security --headless='shell' --no-sandbox --no-zygote --user-data-dir=/sessions/blissful-funny-knuth/tmp/playwright_chromiumdev_profile-Tri8ME --remote-debugging-pipe --no-startup-window
<launched> pid=203
```