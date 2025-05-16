import type TwitchInstance from '../index'
import { type APIError } from '../api'

export const deleteChatMessages = async (instance: TwitchInstance, selection: string): Promise<void> => {
	if (!instance.auth.scopes.includes('moderator:manage:chat_messages')) {
		instance.log('info', 'Unable to delete chat messages, missing Chat Moderation permissions')
		return
	}

	const channel = instance.channels.find((x) => x.username === selection)
	if (!channel || !channel.id) return

	const requestOptions = instance.API.defaultOptions()
	requestOptions.method = 'DELETE'

	return fetch(`https://api.twitch.tv/helix/moderation/chat?broadcaster_id=${channel.id}&moderator_id=${instance.auth.userID}`, requestOptions)
		.then((res) => {
			instance.API.updateRatelimits(res.headers)
			return res.text() as Promise<APIError | ''>
		})
		.then((body) => {
			if (body === '') {
				// Success
				instance.log(`info`, `Cleared chat on channel: ${channel.displayName || channel.username}`)
			} else {
				// Error
				instance.log('warn', `Failed to clear chat: ${JSON.stringify(body, null, 2)}`)
			}
		})
		.catch((err) => {
			instance.log('warn', err)
		})
}
