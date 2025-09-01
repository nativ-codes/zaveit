import { Mixpanel } from "mixpanel-react-native";
import { getUserId } from "../storage/auth";

const trackAutomaticEvents = false;

const mixpanelInstance = new Mixpanel(
  process.env.EXPO_PUBLIC_MIXPANEL_PROJECT_KEY as string,
  trackAutomaticEvents
);
mixpanelInstance.init();
mixpanelInstance.setServerURL("https://api-eu.mixpanel.com");

function setMixpanelUserId() {
  const userId = getUserId();

  mixpanelInstance?.identify(userId);
}

export { mixpanelInstance, setMixpanelUserId };
