import { Tabs } from "expo-router";
import React from "react";


import { SCREEN_OPTIONS } from "@/common/constants";
import TabBar from "@/common/containers/tab-bar/tab-bar";

export default function TabLayout() {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS} tabBar={TabBar}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
