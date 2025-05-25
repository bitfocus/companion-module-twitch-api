import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetAdScheduleSuccess = {
  data: {
    next_ad_at: string | number
    last_ad_at: string | number
    duration: number
    preroll_free_time: number
    snooze_count: number
    snooze_refresh_at: string | number
  }[]
}

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

          instance.variables.set({
            ad_next: data.next_ad_at,
            ad_last: data.last_ad_at,
            ad_duration: data.duration,
            ad_preroll_free_time: data.preroll_free_time,
            ad_snooze_count: data.snooze_count,
            ad_snooze_refresh: data.snooze_refresh_at,
          })
        }
      } else {
        // Error
        instance.log('warn', `Failed to get Ad Schedule: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', `getAdSchedule err: ${err.message}`)
    })
}
