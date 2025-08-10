import { Mixpanel } from "mixpanel-react-native";
import DeviceInfo from "react-native-device-info";

const trackAutomaticEvents = false;

const mixpanelInstance = new Mixpanel(
  process.env.EXPO_PUBLIC_MIXPANEL_PROJECT_KEY as string,
  trackAutomaticEvents
);
mixpanelInstance.init();
mixpanelInstance.setServerURL("https://api-eu.mixpanel.com");
mixpanelInstance.identify(DeviceInfo.getDeviceId());

export { mixpanelInstance };
