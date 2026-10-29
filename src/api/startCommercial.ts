import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

type startCommercialSuccess = {
  data: {
    length: number
    message: string
    retry_after: number
  }[]
}

const log = createModuleLogger('API')

export const startCommercial = async (instance: TwitchInstance, length: string): Promise<void> => {
  if (!instance.auth.userID) return

  if (!instance.auth.scopes.includes('channel:edit:commercial')) {
    log.info('Unable to start a commercial, missing the Ads permission')
    return
  }

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'

  return fetch(`https://api.twitch.tv/helix/channels/commercial?broadcaster_id=${instance.auth.userID}&length=${length}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | startCommercialSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        log.info(`Started a Commercial`)
      } else {
        // Error
        log.warn(`Failed to Start A Raid: ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err: any) => {
      log.warn(err?.response?.body)
    })
}
