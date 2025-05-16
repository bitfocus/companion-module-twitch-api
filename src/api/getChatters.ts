import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetChattersSuccess = {
  data: {
    user_id: string
    user_login: string
    user_name: string
  }[]
  pagination?: {
    cursor?: string
  }
  total: number
}

export const getChatters = (instance: TwitchInstance): Promise<void> => {
		const chattersLoop = (channel: (typeof instance.channels)[number]): Promise<void> => {
			const requestOptions = instance.API.defaultOptions()

			return new Promise((resolve) => {
				const chattersRequest = (cursor?: string) => {
					const url = `https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${channel.id}&moderator_id=${instance.auth.userID}&first=1000${cursor ? `&after=${cursor}` : ''}`

					fetch(url, requestOptions)
						.then((res) => {
							instance.API.updateRatelimits(res.headers)
							return res.json() as Promise<APIError | GetChattersSuccess>
						})
						.then((body) => {
							if ('data' in body) {
								// Success
								channel.chatters.push(...body.data)

								if (body.pagination?.cursor) {
									chattersRequest(body.pagination.cursor)
								} else {
									resolve()
								}
							} else {
								resolve()
							}
						})
						.catch((err: any) => {
							if (err?.response?.body) instance.log('warn', err.response.body)
						})
				}

				chattersRequest()
			})
		}

		return Promise.allSettled(
			instance.channels
				.filter((channel) => channel.id !== '' && (channel.mod || channel.id === instance.auth.userID))
				.map((channel) => {
					return chattersLoop(channel)
				}),
		).then(() => {})
	}
