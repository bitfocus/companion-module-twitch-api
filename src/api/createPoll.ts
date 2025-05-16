import type TwitchInstance from '../index'
import { type APIError } from '../api'

type PollOptions = {
  title: string
  choices: string[]
  duration: number
  pointsVoting: boolean
  pointsValue: number
}

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

type CreatePollSuccess = {
  data: Poll[]
}

export const createPoll = async (instance: TwitchInstance, options: PollOptions): Promise<void> => {
  if (!instance.auth.scopes.includes('channel:manage:polls')) {
    instance.log('info', 'Unable to Create Poll, missing Polls & Predictions permissions')
    return
  }

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'
  requestOptions.body = JSON.stringify({
    broadcaster_id: instance.auth.userID,
    title: options.title,
    choices: options.choices.map((choice) => ({ title: choice })),
    duration: options.duration,
    channel_points_voting_enabled: options.pointsVoting,
    channel_points_per_vote: options.pointsValue,
  })

  return fetch('https://api.twitch.tv/helix/polls', requestOptions)
    .then((res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | CreatePollSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const poll = body.data[0]
        instance.log('info', `Created poll ${poll.title} with Poll ID: ${poll.id}`)
      } else {
        // Error
        instance.log('warn', `Failed to create Poll: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', err.response.body)
    })
}
