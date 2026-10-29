import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

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

type GetPollsSuccess = {
  data: Poll[]
}

const log = createModuleLogger('API')

export const getPolls = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()

  return fetch(`https://api.twitch.tv/helix/polls?broadcaster_id=${instance.auth.userID}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | GetPollsSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const channel = instance.channels.find((x) => x.id === instance.auth.userID)

        if (channel && body.data) {
          channel.polls = body.data.map((poll) => ({
            id: poll.id,
            title: poll.title,
            choices: poll.choices.map((choice: any) => {
              return {
                title: choice.title,
                votes: choice.votes,
                pointsVotes: choice.channel_points_votes,
                bitsVotes: choice.bits_votes,
              }
            }),
            pointsVoting: poll.channel_points_voting_enabled,
            pointsPerVote: poll.channel_points_per_vote,
            bitsVoting: poll.bits_voting_enabled,
            bitsPerVote: poll.bits_per_vote,
            duration: poll.duration,
            status: poll.status,
            started: poll.started_at,
            ended: poll.ended_at,
          }))
        }
      } else {
        // Error
        log.warn(`Failed to get Poll: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      log.warn(`getPolls err: ${err.message}`)
      log.warn(`getPolls err res: ${err}`)
    })
}
