const got = require('got');
const { chatInit } = require('./chat');

const clientID = 'kd4gxqpioyau8myzwo34krgijivec9';

// Get username, id, and scopes for API requests
const validateToken = function (token) {
	const options = {
		headers: {
			Authorization: 'OAuth ' + token,
			'Client-ID': clientID
		},
		json: true
	};

	return got.get('https://id.twitch.tv/oauth2/validate', options);
};

/**
 * Set OAuth token from token server or implicit token from config
 * Validate token and set user details required for Chat/API requests
 */
exports.initUser = function () {
	const setUser = res => {
		this.user = res.body;
	};

	// Connect to chat if token contains appropraite scope
	const chat = () => {
		if (this.user.scopes.includes('chat:read')) {
			chatInit.bind(this)();
		}
	};

	// Use provided implicit token for API requests
	const implicitToken = () => {
		this.token = this.config.token;

		validateToken(this.token)
			.then(setUser)
			.then(chat)
			.catch(err => {
				this.log('warn', err.body ? JSON.stringify(err.body) : err);
			});

		this.status(0);
	};

	// Exchange code with token server for an OAuth token
	const authToken = () => {
		const baseURL = this.config.customServerURL === '' ? 'https://api-companion.dist.dev/token/' : this.config.customServerURL;
		const url = baseURL + '?id=' + this.config.token;
		const options = {
			json: true
		};

		got.get(url, options)
			.then(res => {
				this.token = res.body;
				this.status(0);

				return validateToken(this.token);
			})
			.then(setUser)
			.then(chat)
			.catch(err => {
				this.status(2);
				this.log('warn', err.body ? JSON.stringify(err.body) : err);
			});
	};

	if (!this.config.token) {
		this.status(2);
		this.log('warn', 'Missing token');
	}
	else if (!this.config.tokenServer) {
		implicitToken();
	}
	else {
		authToken();
	}

};

/**
 * Request stream status of channels specified in config
 * No OAuth scopes required
 */
exports.getStatus = function () {
	if (!this.config.token || this.channelList.length === 0) {
		return;
	}

	// Set each channel status to offline 
	this.channelList.forEach(channel => {
		this.channelStatus[channel] = {
			live: false,
			viewers: 0,
			uptime: 0
		};
	});

	// Split requests into batches of 100 to be within API limits
	let requests = [];
	let requestsComplete = 0;
	for (let i = 0; i < this.channelList.length; i += 100) {
		requests.push(this.channelList.slice(i, i + 100));
	}

	const request = channels => {
		const url = 'https://api.twitch.tv/helix/streams?first=100&user_login=' + channels.join('&user_login=');
		const options = {
			headers: {
				Authorization: 'Bearer ' + this.token,
				'Client-ID': clientID
			},
			json: true
		};

		got.get(url, options)
			.then(res => {
				const getUptime = (started) => {
					const diff = new Date() - new Date(started);
					let min = Math.floor(diff / 60000) % 60;
					let hour = Math.floor(diff / 60000 / 60);

					if (min < 10) min = '0' + min;
					if (hour < 10) hour = '0' + hour;

					return `${hour}:${min}`;
				};

				res.body.data.forEach(stream => {
					this.channelStatus[stream.user_name.toLowerCase()] = {
						live: true,
						viewers: stream.viewer_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
						uptime: getUptime(stream.started_at)
					};
				});

				// Update feedbacks when all requests are complete
				requestsComplete++;
				if (requestsComplete === requests.length) {
					this.checkFeedbacks('channelStatus');
				}
			})
			.catch(err => {
				this.log('warn', err.body ? JSON.stringify(err.body) : err);
			});
	};

	requests.forEach(request);
};

/**
 * Start running a commercial on channel
 * Requires channel_commercial scope
 * TODO: Endpoint is currently only available in v5, which is deprecated. Update to Helix when available
 * TODO: Impelement correct error response logging when Twitch resolve the known issue with this endpoint deviating from docs
 */
exports.adStart = function (duration) {
	if (!this.user.user_id || !this.token || this.ad.active) {
		return;
	}

	const url = `https://api.twitch.tv/kraken/channels/${this.user.user_id}/commercial`;
	const options = {
		headers: {
			Accept: 'application/vnd.twitchtv.v5+json',
			Authorization: 'OAuth ' + this.token,
			'Client-ID': clientID
		},
		body: {
			length: duration
		},
		json: true
	};

	got.post(url, options)
		.then(res => {
			if (res.statusCode === 200) {
				this.ad.active = true;
				this.ad.duration = duration;
				this.ad.remaining = 29;
				this.checkFeedbacks('adCountdown');

				const decrementCountdown = () => {
					this.ad.remaining--;
					if (this.ad.remaining < 0) {
						clearInterval(this.ad.interval);
						this.ad.active = false;
					}
					this.checkFeedbacks('adCountdown');
				};

				this.ad.interval = setInterval(decrementCountdown, 1000);
			}
		})
		.catch(err => {
			this.log('warn', err.body ? JSON.stringify(err.body) : err);
		});
};

/**
 * Create a marker during a live stream
 * Requires user:read:broadcast scope
 */
exports.createMarker = function () {
	if (!this.user.user_id || !this.token) {
		return;
	}

	const markerID = `companion-${Date.now()}-${this.markerCount}`;

	const options = {
		headers: {
			Authorization: 'Bearer ' + this.token,
			'Client-ID': clientID
		},
		body: {
			user_id: this.user.user_id,
			description: markerID
		},
		json: true
	};

	got.post('https://api.twitch.tv/helix/streams/markers', options)
		.then(res => {
			this.log('info', 'Created marker: ' + markerID);
			this.markerCount++;
		})
		.catch(err => {
			if (err.statusCode && err.statusCode === 404) {
				this.log('warn', 'Cannot create marker while stream is offline');
			} else {
				this.log('warn', err.body ? JSON.stringify(err.body) : err);
			}
		});

};

/**
 * Generic Twitch API request using token provided to module instance
 */
exports.request = function (action) {
	if (!this.token || !action.url) {
		return;
	}

	const prefix = action.url.toLowerCase().includes('helix') ? 'Bearer ' : 'OAuth ';

	const options = {
		url: action.url,
		method: action.method,
		headers: {
			Authorization: prefix + this.token,
			'Client-ID': clientID
		},
		body: action.body || null,
		json: true
	};

	// Set the v5 header for Kraken endpoints
	if (prefix === 'OAuh ') {
		options.headers.Accept = 'application/vnd.twitchtv.v5+json';
	}

	got(options)
		.then(res => {
			this.log('info', JSON.stringify(res.body));
		})
		.catch(err => {
			this.log('warn', err.body ? JSON.stringify(err.body) : err);
		});
};
