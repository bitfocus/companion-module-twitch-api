exports.getFeedbacks = function () {
	const feedbacks = {};

	feedbacks.adCountdown = {
		label: 'Ad Countdown',
		description: 'Ad duration countdown',
		options: [
			{
				type: 'dropdown',
				label: 'duration',
				id: 'duration',
				default: 30,
				choices: this.AD_DURATIONS.map(duration => ({ id: duration, label: duration }))
			}
		]
	};

	feedbacks.channelStatus = {
		label: 'Channel Status',
		description: 'Indicates if a channel is live',
		options: [
			{
				type: 'dropdown',
				label: 'Channel',
				id: 'channel',
				default: '',
				choices: this.channelList.map(channel => ({ id: channel, label: channel }))
			},
			{
				type: 'colorpicker',
				label: 'Text color',
				id: 'color',
				default: this.rgb(0, 255, 0)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bgcolor',
				default: this.rgb(0, 0, 0)
			},
		]
	};

	feedbacks.chatStatus = {
		label: 'Chat Status',
		description: 'Indicates status of different chat modes',
		options: [
			{
				type: 'dropdown',
				label: 'Mode',
				id: 'mode',
				default: '',
				choices: this.CHAT_MODES.map(mode => ({ id: mode, label: mode }))
			},
			{
				type: 'textinput',
				label: 'Mode value',
				id: 'value',
				default: '',
			},
			{
				type: 'colorpicker',
				label: 'Text color',
				id: 'color',
				default: this.rgb(0, 255, 0)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bgcolor',
				default: this.rgb(0, 0, 0)
			},
		]
	};

	feedbacks.statusDisplay = {
		label: 'Status Display',
		description: 'Updates display cycle button',
	};


	return feedbacks;
};

exports.executeFeedback = function (feedback, bank) {
	const opt = feedback.options;

	if (feedback.type === 'adCountdown') {
		let countdown = feedback.options.duration;
		if (this.ad.active && this.ad.duration === feedback.options.duration) {
			countdown = this.ad.remaining;
		}

		return { text: `${bank.text}\\n${countdown}` }
	}
	else if (feedback.type === 'channelStatus') {
		const channel = this.channelStatus[opt.channel];
		if (channel && channel.live) {
			const getText = () => {
				if (this.statusType === 0) {
					return `${bank.text}\\nLive`;
				}
				else if (this.statusType === 1) {
					return `${bank.text}\\n${channel.uptime}`;
				}
				else if (this.statusType === 2) {
					return `${bank.text}\\n${channel.viewers}`;
				}
				return bank.text;
			};

			const liveStatus = {
				color: opt.color,
				bgcolor: opt.bgcolor,
				text: getText()
			};

			return liveStatus;
		}
	}
	else if (feedback.type === 'chatStatus') {
		const chatMode = opt.mode.toLowerCase();
		const chatStatus = this.chat[chatMode];

		if (chatMode === 'followers') {
			if (chatStatus > 0) {
				return { bgcolor: opt.bgcolor, color: opt.color }
			}
		}
		else if (chatStatus === true || (chatStatus > 0 && chatStatus == opt.value)) {
			return { bgcolor: opt.bgcolor, color: opt.color }
		}
	}
	else if (feedback.type === 'statusDisplay') {
		return { text: `${bank.text}\\n${this.STATUS_TYPES[this.statusType]}` };
	}
};
