import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

type GetAdScheduleSuccess = {
  data: {
    next_ad_at: string
    last_ad_at: string
    duration: string
    preroll_free_time: string
    snooze_count: string
    snooze_refresh_at: string
  }[]
}

const log = createModuleLogger('API')

export const getAdSchedule = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()

  return fetch(`https://api.twitch.tv/helix/channels/ads?broadcaster_id=${instance.auth.userID}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | GetAdScheduleSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const channel = instance.channels.find((x) => x.id === instance.auth.userID)
        if (channel) {
          const data = body.data[0]
          channel.adSchedule = data

          instance.variables.updateVariables()
        }
      } else {
        // Error
        log.warn(`Failed to get Ad Schedule: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      log.warn(`getAdSchedule err: ${err.message}`)
    })
}
