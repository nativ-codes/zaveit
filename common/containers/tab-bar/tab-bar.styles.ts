import { Colors, TAB_BAR_HEIGHT, Units } from '@/common/constants';

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  tabBarStyle: {
    position: "absolute",
    left: Units.s16,
    right: Units.s16,
    height: TAB_BAR_HEIGHT,
    borderRadius: Units.s32,
    borderWidth: Units.s1,
    borderColor: Colors.surface.secondary,
    backgroundColor: Colors.white,
    flexDirection: "row",
    padding: Units.s4,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Units.s32,
  },
  tabBarItemFocused: {
    backgroundColor: Colors.surface.secondary,
  },
});
