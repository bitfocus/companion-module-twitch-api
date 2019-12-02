const open = require('open');
const { adStart, createMarker, request } = require('./api');
const { chatClear, chatMessage, toggleChatMode } = require('./chat');

exports.getActions = function () {
	return {
		adStart: {
			label: 'Start a channel commercial',
			options: [
				{
					type: 'dropdown',
					label: 'Duration',
					id: 'duration',
					default: 30,
					choices: this.AD_DURATIONS.map(duration => ({ id: duration, label: duration }))
				}
			]
		},

		chatClear: {
			label: 'Clear chat',
		},

		chatMessage: {
			label: 'Send a message to chat',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: this.channelList.map(channel => ({ id: channel, label: channel }))
				},
				{
					type: 'textinput',
					label: 'Message',
					id: 'message',
					default: '',
				}
			]
		},

		chatModeEmote: {
			label: 'Toggle emote only mode'
		},

		chatModeFollowers: {
			label: 'Toggle followers only mode',
			options: [
				{
					type: 'textinput',
					label: 'Follow length',
					id: 'length',
					default: '10m'
				}
			]
		},

		chatModeSlow: {
			label: 'Toggle slow mode',
			options: [
				{
					type: 'textinput',
					label: 'Slow mode length',
					id: 'length',
					default: 30,
					regex: this.REGEX_NUMBER
				}
			]
		},

		chatModeSub: {
			label: 'Toggle sub only mode'
		},

		chatModeUnique: {
			label: 'Toggle unique chat (r9k) mode'
		},

		marker: {
			label: 'Create stream marker'
		},

		request: {
			label: 'Twitch API Request',
			options: [
				{
					type: 'textinput',
					label: 'URL',
					id: 'url',
					default: '',
				},
				{
					type: 'dropdown',
					label: 'Method',
					id: 'method',
					default: 'get',
					choices: [
						{ id: 'get', label: 'GET' },
						{ id: 'put', label: 'PUT' },
						{ id: 'post', label: 'POST' },
					]
				},
				{
					type: 'textinput',
					label: 'Body',
					id: 'body',
					default: '',
				},
			]
		},

		statusDisplay: {
			label: 'Cycle between status display types',
		},

		streamOpen: {
			label: 'Open channel in default browser',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					default: this.channelList[0],
					choices: this.channelList.map(channel => ({ id: channel, label: channel }))
				}
			]
		},
	};
};

exports.executeAction = function (action) {
	if (action.action === 'adStart') {
		adStart.bind(this)(action.options.duration);
	}
	else if (action.action === 'chatClear') {
		chatClear.bind(this)();
	}
	else if (action.action === 'chatMessage') {
		chatMessage.bind(this)(action.options);
	}
	else if (action.action === 'chatModeEmote') {
		toggleChatMode.bind(this)('Emote');
	}
	else if (action.action === 'chatModeFollowers') {
		toggleChatMode.bind(this)('Followers', action.options);
	}
	else if (action.action === 'chatModeSlow') {
		toggleChatMode.bind(this)('Slow', action.options);
	}
	else if (action.action === 'chatModeSub') {
		toggleChatMode.bind(this)('Sub');
	}
	else if (action.action === 'chatModeUnique') {
		toggleChatMode.bind(this)('Unique');
	}
	else if (action.action === 'marker') {
		createMarker.bind(this)();
	}
	else if (action.action === 'request') {
		request.bind(this)(action.options);
	}
	else if (action.action === 'statusDisplay') {
		this.statusType = this.statusType === this.STATUS_TYPES.length - 1 ? 0 : this.statusType + 1;
		this.checkFeedbacks('statusDisplay');
		this.checkFeedbacks('channelStatus');
	}
	else if (action.action === 'streamOpen') {
		open(`https://twitch.tv/${action.options.channel}`);
	}
};
