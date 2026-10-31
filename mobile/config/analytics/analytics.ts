import { MixpanelProperties } from 'mixpanel-react-native';
import { getIsAnalyticsEnabled } from '../storage/preferences';
import { mixpanelInstance } from './mixpanel';

enum EventTypeEnum {
	zaved_post = 'zaved_post',
	logged_in = 'logged_in',
	remove_account = 'remove_account',
	analytics_enabled = 'analytics_enabled'
}

const sendEvent = (eventType: EventTypeEnum, data?: MixpanelProperties) => {
	const isAnalyticsEnabled = getIsAnalyticsEnabled();
	isAnalyticsEnabled && mixpanelInstance.track(eventType, data);
};

export default {
	events: EventTypeEnum,
	sendEvent
};
