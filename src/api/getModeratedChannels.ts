import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

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

const log = createModuleLogger('API')

export const getModeratedChannels = async (instance: TwitchInstance): Promise<void> => {
  if (!instance.auth.scopes.includes('user:read:moderated_channels')) return

  return new Promise((resolve) => {
    const getModChannels = (cursor?: string) => {
      const requestOptions = instance.API.defaultOptions()
      const url = `https://api.twitch.tv/helix/moderation/channels?user_id=${instance.auth.userID}&first=100${cursor ? `&after=${cursor}` : ''}`

      fetch(url, requestOptions)
        .then(async (res) => {
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
            log.warn(`Failed to get Moderated Channels: ${JSON.stringify(body)}`)
            return resolve()
          }
        })
        .catch((err) => {
          log.warn(`getModeratedChannels err: ${err.message}`)
          return resolve()
        })
    }

    getModChannels()
  })
}
