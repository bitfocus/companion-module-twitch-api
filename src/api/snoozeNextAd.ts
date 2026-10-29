import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

type SnoozeNextAdSuccess = {
  data: {
    snooze_count: number
    snooze_refresh_at: string | number
    next_ad_at: string | number
  }[]
}

const log = createModuleLogger('API')

export const snoozeNextAd = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'

  return fetch(`https://api.twitch.tv/helix/channels/ads/schedule/snooze?broadcaster_id=${instance.auth.userID}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | SnoozeNextAdSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        log.debug(`Successfully snoozed ad - ${JSON.stringify(body)}`)
      } else {
        // Error
        log.warn(`Failed to Snooze next Ad: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      log.warn(`snoozeNextAd err: ${err.message}`)
    })
}
