import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

type Clip = {
  id: string
  edit_url: string
}

export type ClipOptions = {
  channel: string
  title?: string
  duration?: number
}

type CreateClipSuccess = {
  data: Clip[]
}

const log = createModuleLogger('API')

export const createClip = async (instance: TwitchInstance, options: ClipOptions): Promise<void> => {
  if (!instance.auth.scopes.includes('clips:edit')) {
    log.info('Unable to Create Clip, missing Create Clips permissions')
    return
  }

  const channel = instance.channels.find((x) => x.username === options.channel)
  if (!channel || !channel.id) return

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'

  const url = `https://api.twitch.tv/helix/clips?broadcaster_id=${channel.id}${options.title ? `&title=${options.title}` : ''}${options.duration ? `&duration=${options.duration}` : ''}`

  return fetch(url, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | CreateClipSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const clip = body.data[0]
        log.info(`Created Clip ${clip.id} - URL: https://clips.twitch.tv/${clip.id} - Edit URL: ${clip.edit_url}`)

        instance.API.clip = {
          id: clip.id,
          url: `https://clips.twitch.tv/${clip.id}`,
          edit_url: clip.edit_url,
        }

        instance.variables.updateVariables()
      } else {
        // Error
        log.warn(`Failed to create clip: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      log.warn(err?.response?.body)
    })
}
