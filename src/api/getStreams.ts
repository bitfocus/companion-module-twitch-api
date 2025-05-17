import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetStreamsSuccess = {
  data: {
    id: string
    user_id: string
    user_login: string
    user_name: string
    game_id: string
    game_name: string
    type: string
    title: string
    tags: string[]
    viewer_count: number
    started_at: string
    language: string
    thumbnail_url: string
    tag_ids: []
    is_mature: boolean
  }[]
  pagination?: {
    cursor?: string
  }
}

export const getStreams = async (instance: TwitchInstance): Promise<void> => {
		const requestOptions = instance.API.defaultOptions()

		const channels = instance.channels.filter((channel) => channel.id !== '').map((channel) => channel.id)
		if (channels.length === 0) return

		return fetch(`https://api.twitch.tv/helix/streams?user_id=${channels.join('&user_id=')}`, requestOptions)
			.then((res) => {
				instance.API.updateRatelimits(res.headers)
				return res.json() as Promise<APIError | GetStreamsSuccess>
			})
			.then((body) => {
				if ('data' in body) {
					// Success
					instance.channels.forEach((channel) => {
						const stream = body.data.find((stream: any) => stream.user_id === channel.id)

						if (stream) {
							channel.live = new Date(stream.started_at)
							channel.categoryName = stream.game_name
							channel.categoryID = stream.game_id
							channel.title = stream.title
							channel.viewers = stream.viewer_count
						} else {
							channel.live = false
							channel.categoryName = ''
							channel.categoryID = ''
							channel.title = ''
							channel.viewers = 0
						}
					})
				} else {
					// Error
					instance.log('debug', `Error getting streams: ${JSON.stringify(body, null, 2)}`)
				}

				instance.checkFeedbacks('channelStatus')
			})
			.catch((err: Error) => {
				instance.log('warn', `getStreams err: ${err.message}`)
			})
	}
