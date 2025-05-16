import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetChatSettingsSuccess = {
  data: [
    {
      broadcaster_id: string
      emote_mode: boolean
      follower_mode: boolean
      follower_mode_duration: null | number
      moderator_id: string
      non_moderator_chat_delay: boolean
      non_moderator_chat_delay_duration: null | number
      slow_mode: boolean
      slow_mode_wait_time: null | number
      subscriber_mode: boolean
      unique_chat_mode: boolean
    },
  ]
}

export const getChatSettings = async (instance: TwitchInstance): Promise<void> => {
		const requestOptions = instance.API.defaultOptions()

		return Promise.allSettled(
			instance.channels
				.filter((channel) => channel.id !== '')
				.map((channel) => {
					return fetch(`https://api.twitch.tv/helix/chat/settings?broadcaster_id=${channel.id}&moderator_id=${instance.auth.userID}`, requestOptions)
						.then((res) => {
							instance.API.updateRatelimits(res.headers)
							return res.json() as Promise<APIError | GetChatSettingsSuccess>
						})
						.then((body) => {
							if ('data' in body) {
								// Success
								const data = body.data[0]

								channel.chatModes = {
									emote: data.emote_mode,
									followers: data.follower_mode,
									followersLength: data.follower_mode_duration ? data.follower_mode_duration : 0,
									slow: data.slow_mode,
									slowLength: data.slow_mode_wait_time || 0,
									sub: data.subscriber_mode,
									unique: data.unique_chat_mode,
									chatDelay: data.non_moderator_chat_delay ? (data.non_moderator_chat_delay_duration || 0).toString() : data.non_moderator_chat_delay,
								}

								return
							} else {
								// Error
								instance.log('warn', `Failed to Get Chat Settings: ${JSON.stringify(body)}`)
								return
							}
						})
						.catch((err: any) => {
							if (err?.response?.body) instance.log('warn', err.response.body)
						})
				}),
		).then(() => {})
	}
