import type TwitchInstance from '../index'
import { type APIError } from '../api'


type SnoozeNextAdSuccess = {
  data: {
		snooze_count: number
		snooze_refresh_at: string | number
		next_ad_at: string | number
	}[]
}

export const snoozeNextAd = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()
	requestOptions.method = 'POST'

  return fetch(`https://api.twitch.tv/helix/channels/ads/schedule/snooze?broadcaster_id=${instance.auth.userID}`, requestOptions)
    .then((res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | SnoozeNextAdSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
				instance.log('debug', `Successfully snoozed ad - ${JSON.stringify(body)}`)
      } else {
        // Error
        instance.log('warn', `Failed to Snooze next Ad: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', `snoozeNextAd err: ${err.message}`)
    })
}
