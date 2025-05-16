import type TwitchInstance from '../index'
import { type APIError } from '../api'

type Channel = {
  broadcaster_id: string
  broadcaster_login: string
  broadcaster_name: string
  broadcaster_language: string
  game_name: string
  game_id: string
  title: string
  delay: number
  tags: string[]
  content_classification_labels: string[]
  is_branded_content: boolean
}

type GetChannelsSuccess = {
  data: Channel[]
}

export const getChannels = async (instance: TwitchInstance, channels: string | string[]): Promise<Channel[]> => {
  const users = Array.isArray(channels) ? channels.join(`&broadcaster_id=`) : channels
  const requestOptions = instance.API.defaultOptions()

  return fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${users}`, requestOptions)
    .then((res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | GetChannelsSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        return body.data
      } else {
        // Error
        instance.log('warn', `Failed to Get Channels: ${JSON.stringify(body)}`)
        return []
      }
    })
    .catch((err) => {
      instance.log('warn', `getChannels err: ${err.message}`)
      return []
    })
}
