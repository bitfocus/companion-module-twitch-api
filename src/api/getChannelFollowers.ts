import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetChannelFollowersSuccess = {
  total: number
  data: {
    user_id: string
    user_login: string
    user_name: string
    followed_at: string
  }[]
  pagination?: {
    cursor?: string
  }
}

export const getChannelFollowers = (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()

  return Promise.allSettled(
    instance.channels
      .filter((channel) => channel.id !== '')
      .map((channel) => {
        return fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${channel.id}${channel.mod ? `&user_id=${instance.auth.userID}` : ''}`, requestOptions)
          .then((res) => {
            instance.API.updateRatelimits(res.headers)
            return res.json() as Promise<APIError | GetChannelFollowersSuccess>
          })
          .then((body) => {
            if ('data' in body) {
              // Success
              channel.followersTotal = body.total
            } else {
              // Error
              instance.log('warn', `Failed to Get Channel Followers: ${JSON.stringify(body)}`)
            }
          })
          .catch((err: any) => {
            if (err?.response?.body) instance.log('warn', err.response.body)
          })
      }),
  ).then(() => {})
}
