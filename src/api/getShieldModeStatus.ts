import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetShieldModeStatusSuccess = {
  data: {
    is_active: boolean
    moderator_id: string
    moderator_name: string
    moderator_login: string
    last_activated_at: string
  }[]
}

export const getShieldModeStatus = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()

	console.log('getShieldModeStatus')

  return Promise.allSettled(
    instance.channels
      .filter((channel) => channel.mod)
      .map((channel) => {
        return fetch(`https://api.twitch.tv/helix/moderation/shield_mode?broadcaster_id=${channel.id}&moderator_id=${instance.auth.userID}`, requestOptions)
          .then((res) => {
            instance.API.updateRatelimits(res.headers)
            return res.json() as Promise<APIError | GetShieldModeStatusSuccess>
          })
          .then((body) => {
            if ('data' in body) {
              // Success
              channel.shieldMode = body.data[0].is_active
            } else {
              // Error
              instance.log('warn', `Failed to Get Shield Mode Status: ${JSON.stringify(body)}`)
            }
          })
          .catch((err) => {
            instance.log('warn', `getShieldModeStatus err: ${err.message}`)
          })
      }),
  ).then(() => {})
}
