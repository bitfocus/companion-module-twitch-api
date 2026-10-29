import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'

const log = createModuleLogger('API')

export const customRequest = async (instance: TwitchInstance, method: 'get' | 'put' | 'post' | 'patch' | 'delete', url: string, body: string): Promise<void> => {
  if (!instance.auth.valid) return

  const options = {
    method: method.toUpperCase(),
    body: body || undefined,
    headers: {
      'Client-Id': instance.auth.clientID,
      Authorization: `Bearer ${instance.auth.accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  return fetch(url, options)
    .then(async (res) => {
      if (res.body) {
        try {
          const body = await res.json()
          log.info(JSON.stringify(body))
        } catch (e) {
          const body = await res.text()
          log.warn(`Custom Request err: ${JSON.stringify(e)}`)
          log.info(JSON.stringify(body))
        }
      }
    })
    .catch((err) => {
      log.warn(err.message)
    })
}
