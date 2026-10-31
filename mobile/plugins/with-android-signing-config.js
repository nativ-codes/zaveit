const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidSigningConfig(config) {
  return withAppBuildGradle(config, (config) => {
    const ANDROID_SIGNING_CONFIGS = `
        signingConfigs {
            debug {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
            release {
                storeFile file('${config.extra.UPLOAD_STORE_FILE}')
                storePassword '${config.extra.UPLOAD_STORE_PASSWORD}'
                keyAlias '${config.extra.UPLOAD_KEY_ALIAS}'
                keyPassword '${config.extra.UPLOAD_KEY_PASSWORD}'
            }
        }
    `;

    config.modResults.contents = config.modResults.contents.replace(
      /(?<=.*?)^\s*signingConfigs {.*?(?=\s*buildTypes)/ms,
      ANDROID_SIGNING_CONFIGS
    );
    config.modResults.contents = config.modResults.contents.replace(
      /buildTypes\s*\{([\s\S]*?)release\s*\{([\s\S]*?)signingConfig signingConfigs\.debug/,
      `buildTypes {$1release {$2signingConfig signingConfigs.release`
    );

    return config;
  });
};
