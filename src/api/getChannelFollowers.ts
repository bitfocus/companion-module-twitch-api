import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

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

const log = createModuleLogger('API')

export const getChannelFollowers = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()

  return Promise.allSettled(
    instance.channels
      .filter((channel) => channel.id !== '')
      .map(async (channel) => {
        return fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${channel.id}${channel.mod ? `&user_id=${instance.auth.userID}` : ''}`, requestOptions)
          .then(async (res) => {
            instance.API.updateRatelimits(res.headers)
            return res.json() as Promise<APIError | GetChannelFollowersSuccess>
          })
          .then((body) => {
            if ('data' in body) {
              // Success
              channel.followersTotal = body.total
            } else {
              // Error
              log.warn(`Failed to Get Channel Followers: ${JSON.stringify(body)}`)
            }
          })
          .catch((err: any) => {
            if (err?.response?.body) log.warn(err?.response?.body)
          })
      }),
  ).then(() => {})
}
