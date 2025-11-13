import type TwitchInstance from '../index'
import { type APIError } from '../api'

type startARaidSuccess = {
  data: {
    created_at: string
    is_mature: boolean
  }[]
}

export const startARaid = async (instance: TwitchInstance, targetUsername: string): Promise<void> => {
  if (!instance.auth.userID) return

  if (!instance.auth.scopes.includes('channel:manage:raids')) {
    instance.log('info', 'Unable to start a raid, missing the Raids permission')
    return
  }

  const target = await instance.API.getUsers(instance, { type: 'login', channels: targetUsername })

  if (!target[0]?.id) {
    instance.log('warn', `Unable to raid ${targetUsername}. user not found`)
    return
  }

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'

  return fetch(`https://api.twitch.tv/helix/raids?from_broadcaster_id=${instance.auth.userID}&to_broadcaster_id=${target[0].id}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | startARaidSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        instance.log('info', `Started a raid on ${target[0].display_name || target[0].login}`)
      } else {
        // Error
        instance.log('warn', `Failed to Start A Raid: ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err: any) => {
      instance.log('warn', err?.response?.body)
    })
}
