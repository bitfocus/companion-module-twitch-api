import type TwitchInstance from '../index'

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
          instance.log('info', JSON.stringify(body))
        } catch (e) {
          const body = await res.text()
          instance.log('warn', `Custom Request err: ${JSON.stringify(e)}`)
          instance.log('info', JSON.stringify(body))
        }
      }
    })
    .catch((err) => {
      instance.log('warn', err.message)
    })
}
