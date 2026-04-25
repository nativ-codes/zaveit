const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Two Podfile changes required for react-native-firebase with useFrameworks: static.
 *
 * 1. $RNFirebaseAsStaticFramework = true
 *    Official RNFB recommendation. Tells RNFB podspecs to declare themselves
 *    as static frameworks, complementing expo-build-properties' forceStaticLinking.
 *    See: https://rnfirebase.io/#altering-cocoapods-to-use-frameworks
 *
 * 2. CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
 *    Safety net for any remaining framework pods (e.g. Firebase SDK pods) that
 *    include React-Core headers non-modularly.
 *
 * Note: the module map ownership fix (preventing "Declaration of RCTBridgeModule
 * must be imported from module RNFBApp.X") is handled by forceStaticLinking in
 * expo-build-properties, which is the proper Expo-maintained solution.
 */
const withFirebaseStaticFrameworks = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes('$RNFirebaseAsStaticFramework')) {
        podfile = podfile.replace(
          /(  use_frameworks! :linkage =>)/,
          `  $RNFirebaseAsStaticFramework = true\n\n$1`
        );
      }

      if (!podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        const snippet = [
          '    installer.pods_project.targets.each do |target|',
          '      target.build_configurations.each do |build_config|',
          "        build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'",
          '      end',
          '    end',
        ].join('\n');

        podfile = podfile.replace(
          /(\s*post_install do \|installer\|)/,
          `$1\n${snippet}`
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      return cfg;
    },
  ]);

module.exports = withFirebaseStaticFrameworks;
