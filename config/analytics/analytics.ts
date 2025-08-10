import { MixpanelProperties } from 'mixpanel-react-native';
import { mixpanelInstance } from './mixpanel';

enum EventTypeEnum {
	zaved_post = 'zaved_post',
	logged_in = 'logged_in',
	remove_account = 'remove_account'
}

const sendEvent = (eventType: EventTypeEnum, data?: MixpanelProperties) => {
	mixpanelInstance.track(eventType, data);
};

export default {
	events: EventTypeEnum,
	sendEvent
};
