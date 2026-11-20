const { withAndroidManifest } = require('@expo/config-plugins');

// orientation: "portrait" makes Android imply a *required* android.hardware.screen.portrait,
// which Play uses to hide the app from tablets/desktop/XR. Declaring it optional keeps the lock
// but drops the install restriction.
const FEATURE = 'android.hardware.screen.portrait';

module.exports = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const features = (manifest['uses-feature'] ??= []);
    if (!features.some((f) => f.$['android:name'] === FEATURE)) {
      features.push({ $: { 'android:name': FEATURE, 'android:required': 'false' } });
    }
    return cfg;
  });
