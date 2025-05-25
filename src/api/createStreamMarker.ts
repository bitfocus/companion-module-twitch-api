import type TwitchInstance from '../index'
import { type APIError } from '../api'

type CreateStreamMarkerSuccess = {
  data: StreamMarker[]
}

type StreamMarker = {
  id: number
  created_at: string
  description: string
  position_seconds: number
}

export const createStreamMarker = async (instance: TwitchInstance, selection: string): Promise<void> => {
  if (!instance.auth.scopes.includes('channel:manage:broadcast')) {
    instance.log('info', 'Unable to create Stream Marker, missing Stream Marker permissions')
    return
  }

  const channel = instance.channels.find((x) => x.username === selection)

  if (!channel || !channel.id) return

  const markerID = `companion-${instance.auth.login}-${Date.now()}`

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'
  requestOptions.body = JSON.stringify({
    user_id: channel.id,
    description: markerID,
  })

  return fetch('https://api.twitch.tv/helix/streams/markers', requestOptions)
    .then((res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | CreateStreamMarkerSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        instance.log('info', `Created marker: ${markerID} - ${JSON.stringify(body)}`)
      } else {
        // Error
        instance.log('warn', `Failed to create Stream marker: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', err.response.body)
    })
}
