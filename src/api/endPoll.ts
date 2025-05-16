import type TwitchInstance from '../index'
import { type APIError } from '../api'

type Poll = {
  id: string
  broadcaster_id: string
  broadcaster_name: string
  broadcaster_login: string
  title: string
  choices: PollChoice[]
  bits_voting_enabled: false
  bits_per_vote: 0
  channel_points_voting_enabled: boolean
  channel_points_per_vote: number
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'ARCHIVED' | 'MODERATED' | 'INVALID'
  duration: number
  started_at: string
  ended_at: string | null
}

type PollChoice = {
  id: string
  title: string
  votes: number
  channel_points_votes: number
  bits_votes: 0
}

type EndPollSuccess = {
  data: Poll[]
}

export const endPoll = async (instance: TwitchInstance, status: 'TERMINATED' | 'ARCHIVED'): Promise<void> => {
	if (!instance.auth.scopes.includes('channel:manage:polls')) {
		instance.log('info', 'Unable to end poll, missing Polls & Predictions permissions')
		return
	}

	await instance.API.getPolls(instance)

	const channel = instance.channels.find((x) => x.id === instance.auth.userID)
	if (!channel || !channel.id) return

	if (!channel.polls?.[0]?.id) {
		instance.log('warn', `Unable to end poll, no poll found`)
		return
	}

	if (channel.polls[0].status !== 'ACTIVE') {
		instance.log('warn', `Unable to end poll, no poll is active`)
		return
	}

	const requestOptions = instance.API.defaultOptions()
	requestOptions.method = 'PATCH'
	requestOptions.body = JSON.stringify({
		broadcaster_id: channel.id,
		id: channel.polls[0].id,
		status,
	})

	fetch(`https://api.twitch.tv/helix/polls`, requestOptions)
		.then((res) => {
			instance.API.updateRatelimits(res.headers)
			return res.json() as Promise<APIError | EndPollSuccess>
		})
		.then((body) => {
			if ('data' in body) {
				// Success
				instance.log('info', `Ended poll ${body.data[0].title}`)
			} else {
				// Error
				instance.log('warn', `Failed to end Poll: ${JSON.stringify(body)}`)
			}
		})
		.catch((err) => {
			instance.log('warn', err.response.body)
		})
}
