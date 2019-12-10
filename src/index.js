const instance_skel = require('../../../instance_skel');
const { executeAction, getActions } = require('./actions');
const { getStatus, initUser } = require('./api');
const { getChannelList, getChannelStatus, getConfigFields } = require('./config');
const { executeFeedback, getFeedbacks } = require('./feedback');
const { initPresets } = require('./presets');

/**
 * Companion instance class for Twitch API and Chat
 */
class TwitchInstance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)

		this.AD_DURATIONS = [30, 60, 90, 120, 150, 180];
		this.CHAT_MODES = ['Emote', 'Followers', 'Slow', 'Sub', 'Unique'];
		this.STATUS_TYPES = ['Live', 'Uptime', 'Viewers', 'None'];
		this.STATUS_POLL_INTERVAL = 20000;

		this.ad = {
			active: false,
			duration: 0,
			remaining: 0,
			interval: null
		};
		this.channelList = getChannelList(config.channels);
		this.channelStatus = getChannelStatus(this.channelList);
		this.chat = {
			emote: false,
			followers: false,
			slow: false,
			sub: false,
			unique: false,
		};
		this.markerCount = 0;
		this.statusType = 0;
		this.token = '';
		this.user = {};
	}

	// Called when instance is created
	init() {
		this.actions();
		this.init_user();
		this.init_channelStatus();
		this.init_feedbacks();
		this.status(this.STATUS_UNKNOWN);
		this.checkFeedbacks('adCountdown');
		initPresets.bind(this)();
	}

	// Process configuration change
	updateConfig(config) {
		this.config = config
		this.channelList = getChannelList(config.channels);
		this.channelStatus = getChannelStatus(this.channelList);

		this.actions();
		this.init_user();
		this.init_channelStatus();
		this.init_feedbacks();
		initPresets.bind(this)();
	}

	// Set fields for instance configuration in the web
	config_fields() {
		return getConfigFields();
	}

	// Clean up timers, intervals, and chat connection on destruction.
	destroy() {
		if (this.getTokenInterval) {
			clearInterval(this.getStatusInterval);
		}

		if (this.getTokenInterval) {
			clearInterval(this.getTokenInterval);
		}

		if (this.chatClient) {
			this.chatClient.disconnect();
		}

		this.debug('destroy', this.id);
	}

	// Set available actions
	actions() {
		this.system.emit('instance_actions', this.id, getActions.bind(this)());
	}

	// Execute an action
	action(action) {
		executeAction.bind(this)(action);
	}

	/**
	 * Set OAuth token and get user details for API requests and chat connection
	 * When using the token server check for token updates once per hour to ensure token is valid
	 */
	init_user() {
		initUser.bind(this)();
		if (this.getTokenInterval) {
			clearInterval(this.getTokenInterval);
		}

		if (this.config.tokenServer) {
			this.getTokenInterval = setInterval(initUser.bind(this), 1000 * 60 * 60);
		}
	}

	/**
	 * Start an interval to periodically check specified channel stream status
	 * API polling is limited by Twitch's API caching
	 */
	init_channelStatus() {
		if (this.channelStatusInterval) {
			clearInterval(this.getStatusInterval);
		}

		this.channelStatusInterval = setInterval(() => {
			getStatus.bind(this)();
		}, this.STATUS_POLL_INTERVAL);
	}

	// Set available feedback choices
	init_feedbacks() {
		const feedbacks = getFeedbacks.bind(this)();
		this.setFeedbackDefinitions(feedbacks);
		this.checkFeedbacks('statusDisplay');
	}

	// Execute feedback
	feedback(feedback, bank) {
		return executeFeedback.bind(this)(feedback, bank);
	}
};

module.exports = TwitchInstance;
