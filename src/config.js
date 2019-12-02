// Config fields for the web interface
exports.getConfigFields = () => {
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: `This module supports both using a token server to securely store/refresh tokens, or using local tokens which expire every 4 hours.<br /><br />
        Generate a token for either the <a href="https://companion.dist.dev/" target="_blank">Token Server</a> or 
        <a href="https://companion.dist.dev/?type=implicit" target="_blank">Local Token</a>`
		},
		{
			type: 'checkbox',
			label: 'Token Server',
			id: 'tokenServer',
			width: 2,
			default: true
		},
		{
			type: 'textinput',
			id: 'token',
			label: 'Token',
			width: 10
		},
		{
			type: 'textinput',
			id: 'channels',
			label: 'Channels to monitor - Space separated',
			width: 12
		},
	]
};

// Return an array of channels from an input of space or omma separated string
exports.getChannelList = (channels) => {
	if (!channels) {
		return [];
	}

	return channels
		.replace(/,/g, ' ')
		.split(' ')
		.filter(channel => channel !== '')
		.sort();
};

// Sets the default status for each channel
exports.getChannelStatus = (channels) => {
	const status = {};

	channels.forEach(channel => {
		status[channel] = {
			live: false,
			viewers: 0,
			uptime: 0
		};
	});

	return status;
};
