import type TwitchInstance from '../index'
import { type APIError } from '../api'

type Clip = {
  id: string
  edit_url: string
}

export type ClipVODOptions = {
  channel: string
  vodID: string
  title: string
  offset: number
  duration: number
}

type CreateClipSuccess = {
  data: Clip[]
}

export const createClipVOD = async (instance: TwitchInstance, options: ClipVODOptions): Promise<void> => {
  if (!instance.auth.scopes.includes('clips:edit')) {
    instance.log('info', 'Unable to Create Clip from VOD, missing Create Clips permissions')
    return
  }

  const channel = instance.channels.find((x) => x.username === options.channel)
  if (!channel || !channel.id) return

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'

  const url = `https://api.twitch.tv/helix/videos/clips?broadcaster_id=${channel.id}&editor_id=${instance.auth.userID}&title=${options.title}&vod_id=${options.vodID}&vod_offset=${options.offset}${options.duration ? `&duration=${options.duration}` : ''}`

  return fetch(url, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | CreateClipSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const clip = body.data[0]
        instance.log('info', `Created Clip ${clip.id} - URL: https://clips.twitch.tv/${clip.id} - Edit URL: ${clip.edit_url}`)

        instance.API.clip = {
          id: clip.id,
          url: `https://clips.twitch.tv/${clip.id}`,
          edit_url: clip.edit_url,
        }

        instance.variables.set({
          clip_id: clip.id,
          clip_url: `https://clips.twitch.tv/${clip.id}`,
          clip_edit_url: clip.edit_url,
        })
      } else {
        // Error
        instance.log('warn', `Failed to create clip: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', err?.response?.body)
    })
}
