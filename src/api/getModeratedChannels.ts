import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetModeratedChannelsSuccess = {
  data: {
    broadcaster_id: string
    broadcaster_login: string
    broadcaster_name: string
  }[]
  pagination?: {
    cursor?: string
  }
}

export const getModeratedChannels = async (instance: TwitchInstance): Promise<void> => {
  if (!instance.auth.scopes.includes('user:read:moderated_channels')) return

  return new Promise((resolve) => {
    const getModChannels = (cursor?: string) => {
      const requestOptions = instance.API.defaultOptions()
      const url = `https://api.twitch.tv/helix/moderation/channels?user_id=${instance.auth.userID}&first=100${cursor ? `&after=${cursor}` : ''}`

      fetch(url, requestOptions)
        .then((res) => {
          instance.API.updateRatelimits(res.headers)
          return res.json() as Promise<APIError | GetModeratedChannelsSuccess>
        })
        .then((body) => {
          if ('data' in body) {
            // Success
            body.data.forEach((modChannel) => {
              const channel = instance.channels.find((x) => x.id === modChannel.broadcaster_id)
              if (channel) channel.mod = true
            })

            if (body.pagination?.cursor) {
              getModChannels(body.pagination.cursor)
            } else {
              resolve()
            }
          } else {
            // Error
            instance.log('warn', `Failed to get Moderated Channels: ${JSON.stringify(body)}`)
            return resolve()
          }
        })
        .catch((err) => {
          instance.log('warn', `getModeratedChannels err: ${err.message}`)
          return resolve()
        })
    }

    getModChannels()
  })
}
