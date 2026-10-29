import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

type GetCreatorGoalsSuccess = {
  data: {
    id: string
    broadcaster_id: number
    broadcaster_name: string
    broadcaster_login: string
    type: string
    description: string
    current_amount: number
    target_amount: number
    created_at: string
  }[]
}

const log = createModuleLogger('API')

export const getCreatorGoals = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()

  return fetch(`https://api.twitch.tv/helix/goals?broadcaster_id=${instance.auth.userID}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | GetCreatorGoalsSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const data = body.data
        const channel = instance.channels.find((x) => x.id === instance.auth.userID)

        if (channel) {
          channel.goals = data.map((goal: any) => {
            return {
              type: goal.type,
              description: goal.description,
              current: goal.current_amount,
              target: goal.target_amount,
            }
          })
        }
      } else {
        // Error
        log.debug(`getCreatorGoals: Err getting data ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err) => {
      log.warn(`getCreatorGoals err: ${err?.body || err.message}`)
    })
}
