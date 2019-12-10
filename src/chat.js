const tmi = require('tmi.js');

const listeners = function () {
	this.chatClient.on('connected', () => {
		this.log('debug', 'Chat connected');
	});

	this.chatClient.on('disconnected', () => {
		this.log('debug', 'Chat disconnected');
	});

	this.chatClient.on('reconnect', () => {
		this.log('debug', 'Chat reconnect');
	});

	// Roomstate on load contains all states, updates only contain the field updated
	this.chatClient.on('roomstate', (channel, state) => {
		this.chat = {
			emote: state['emote-only'] !== undefined ? state['emote-only'] : this.chat.emote,
			followers: state['followers-only'] !== undefined ? state['followers-only'] : this.chat.followers,
<<<<<<< HEAD
			slow: state.slow !== undefined ? state.slow  : this.chat.slow,
=======
			slow: state.slow !== undefined ? state.slow : this.chat.slow,
>>>>>>> aa1fbc2a9539727a0529e82da82ccd4f213186bf
			sub: state['subs-only'] !== undefined ? state['subs-only'] : this.chat.sub,
			unique: state.r9k !== undefined ? state.r9k : this.chat.unique
		};

		this.checkFeedbacks('chatStatus');
	});
};

// Start chat connection
exports.chatInit = function () {
	const options = {
		identity: {
			username: this.user.login,
			password: this.token
		},
		channels: [
			this.user.login
		]
	};

	this.chatClient = new tmi.client(options);

	listeners.bind(this)();

	this.chatClient.connect();
};

// Clear chat
<<<<<<< HEAD
exports.chatClear = function() {
=======
exports.chatClear = function () {
>>>>>>> aa1fbc2a9539727a0529e82da82ccd4f213186bf
	if (!this.chatClient || this.chatClient.readyState() !== 'OPEN') {
		return;
	}

	this.chatClient.clear(this.user.login);
};

// Send chat message to specified channel
<<<<<<< HEAD
exports.chatMessage = function(options) {
=======
exports.chatMessage = function (options) {
>>>>>>> aa1fbc2a9539727a0529e82da82ccd4f213186bf
	if (!this.chatClient || this.chatClient.readyState() !== 'OPEN' || !options.message || !options.channel) {
		return;
	}

	this.chatClient.say(options.channel, options.message);
};

// Change channel modes
<<<<<<< HEAD
exports.toggleChatMode = function(mode, options) {
=======
exports.toggleChatMode = function (mode, options) {
>>>>>>> aa1fbc2a9539727a0529e82da82ccd4f213186bf
	const channel = this.user.login;
	if (!this.chatClient || this.chatClient.readyState() !== 'OPEN') {
		return;
	}

	if (mode === 'Emote') {
		if (this.chat.emote) {
			this.chatClient.emoteonlyoff(channel);
		} else {
			this.chatClient.emoteonly(channel);
		}
	}
	else if (mode === 'Followers') {
<<<<<<< HEAD
		if (this.chat.followers !== false) {
=======
		if (this.chat.followers !== '-1') {
>>>>>>> aa1fbc2a9539727a0529e82da82ccd4f213186bf
			this.chatClient.followersonlyoff(channel);
		} else {
			this.chatClient.followersonly(channel, options.length);
		}
	}
	else if (mode === 'Slow') {
		if (this.chat.slow !== false && this.chat.slow == options.length) {
			this.chatClient.slowoff(channel);
		} else {
			this.chatClient.slow(channel, options.length);
		}
	}
	else if (mode === 'Sub') {
		if (this.chat.sub) {
			this.chatClient.subscribersoff(channel);
		} else {
			this.chatClient.subscribers(channel);
		}
	}
	else if (mode === 'Unique') {
		if (this.chat.unique) {
			this.chatClient.r9kbetaoff(channel);
		} else {
			this.chatClient.r9kbeta(channel);
		}
	}
};
