# iOS App Icon Generation Guide

To generate all required iOS app icons from the main 1024x1024 icon, you need to create the following sizes:

## Required iOS App Icons

| Size | Usage |
|------|-------|
| 1024x1024 | App Store |
| 180x180 | iPhone @3x |
| 167x167 | iPad Pro @2x |
| 152x152 | iPad @2x |
| 120x120 | iPhone @2x |
| 87x87 | Settings @3x |
| 80x80 | Spotlight @2x |
| 76x76 | iPad @1x |
| 60x60 | iPhone @1x |
| 58x58 | Settings @2x |
| 40x40 | Spotlight @1x |
| 29x29 | Settings @1x |
| 20x20 | Notification @1x |

## After exporting to GitHub

1. Use the main icon at `public/app-icon-1024.png`
2. Generate all sizes using a tool like:
   - [App Icon Generator](https://appicon.co/)
   - [MakeAppIcon](https://makeappicon.com/)
   - Or use the `@capacitor/assets` package

3. Place generated icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

## Using Capacitor Assets (recommended)

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --ios
```

This will automatically generate all required icon sizes from your source icon.

## Launch Screen / Splash Screen

For the splash screen, create:
- 2732x2732 (universal splash)
- Or use Capacitor's SplashScreen plugin with a single image

Place in `ios/App/App/Assets.xcassets/Splash.imageset/`
