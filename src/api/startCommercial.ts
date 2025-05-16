import type TwitchInstance from '../index'
import { type APIError } from '../api'

type startCommercialSuccess = {
  data: {
    length: number
    message: string
    retry_after: number
  }[]
}

export const startCommercial = async (instance: TwitchInstance, length: string): Promise<void> => {
  if (!instance.auth.userID) return 

  if (!instance.auth.scopes.includes('channel:edit:commercial')) {
    instance.log('info', 'Unable to start a commercial, missing the Ads permission')
    return
  }

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'

  return fetch(`https://api.twitch.tv/helix/channels/commercial?broadcaster_id=${instance.auth.userID}&length=${length}`, requestOptions)
    .then((res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | startCommercialSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        instance.log('info', `Started a Commerciasl`)
      } else {
        // Error
        instance.log('warn', `Failed to Start A Raid: ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err: any) => {
      instance.log('warn', err.response.body)
    })
}
