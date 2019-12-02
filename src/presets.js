
exports.initPresets = function () {
	var presets = [];

	const bankOptions = (text, size = 'auto') => ({
		style: 'text',
		text: text,
		size: size,
		color: this.rgb(255, 255, 255),
		bgcolor: this.rgb(0, 0, 0)
	});

	const chatModeFeedback = (mode, value = '') => ({
		type: 'chatStatus',
		options: {
			mode: mode,
			value: value,
			color: this.rgb(0, 0, 0),
			bgcolor: this.rgb(0, 255, 0)
		}
	});

	this.AD_DURATIONS.forEach(duration => {
		presets.push({
			category: 'Functions',
			label: 'Ad ' + duration,
			bank: bankOptions('Ad', '18'),
			actions: [{
				action: 'adStart',
				options: {
					duration: duration
				}
			}],
			feedbacks: [{
				type: 'adCountdown',
				options: {
					duration: duration
				}
			}]
		});
	});

	presets.push({
		category: 'Functions',
		label: 'Stream Marker',
		bank: bankOptions('Marker', '18'),
		actions: [{
			action: 'marker'
		}]
	});

	presets.push({
		category: 'Chat',
		label: 'Clear',
		bank: bankOptions('Clear', '18'),
		actions: [{
			action: 'chatClear'
		}]
	});

	presets.push({
		category: 'Chat',
		label: 'Emote Mode',
		bank: bankOptions('Emote\\nOnly', '18'),
		actions: [{
			action: 'chatModeEmote'
		}],
		feedbacks: [chatModeFeedback('Emote')]
	});

	const followersLength = ['10m', '30m', '1h', '1d', '1w', '1mo'];

	followersLength.forEach(length => {
		presets.push({
			category: 'Chat',
			label: 'Followers Mode',
			bank: bankOptions(`Followers\\n${length}`, '14'),
			actions: [{
				action: 'chatModeFollowers',
				options: {
					length: length
				}
			}],
			feedbacks: [chatModeFeedback('Followers')]
		});
	});

	const slowLength = [30, 60, 120];

	slowLength.forEach(length => {
		presets.push({
			category: 'Chat',
			label: 'Slow Mode',
			bank: bankOptions(`Slow\\n${length}`, '18'),
			actions: [{
				action: 'chatModeSlow',
				options: {
					length: length
				}
			}],
			feedbacks: [chatModeFeedback('Slow', length)]
		});
	});

	presets.push({
		category: 'Chat',
		label: 'Sub Mode',
		bank: bankOptions('Sub', '18'),
		actions: [{
			action: 'chatModeSub'
		}],
		feedbacks: [chatModeFeedback('Sub')]
	});

	presets.push({
		category: 'Chat',
		label: 'Unique Mode',
		bank: bankOptions('Unique', '18'),
		actions: [{
			action: 'chatModeUnique'
		}],
		feedbacks: [chatModeFeedback('Unique')]
	});

	presets.push({
		category: 'Stream Stauts',
		label: 'Display Mode',
		bank: bankOptions('Display', '18'),
		actions: [{
			action: 'statusDisplay'
		}],
		feedbacks: [{
			type: 'statusDisplay'
		}]
	});

	this.channelList.forEach(channel => {
		presets.push({
			category: 'Stream Stauts',
			label: `${channel} Status`,
			bank: bankOptions(`${channel}`, '18'),
			actions: [{
				action: 'streamOpen',
				options: {
					channel: channel
				}
			}],
			feedbacks: [{
				type: 'channelStatus',
				options: {
					channel: channel,
					color: this.rgb(0, 255, 0),
					bgcolor: this.rgb(0, 0, 0)
				}
			}]
		});
	});


	this.setPresetDefinitions(presets);
};
