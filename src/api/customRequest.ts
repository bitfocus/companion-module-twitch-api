import type TwitchInstance from '../index'

export const customRequest = async (instance: TwitchInstance, method: 'get' | 'put' | 'post', url: string, body: string): Promise<void> => {
  if (!instance.auth.valid) return

  const options = {
    method,
    body: body || undefined,
    headers: {
      'Client-Id': instance.auth.clientID,
      Authorization: `Bearer ${instance.auth.accessToken}`,
    },
  }

  return fetch(url, options)
    .then((res) => {
      instance.log('info', JSON.stringify(res.body))
    })
    .catch((err) => {
      instance.log('warn', err.response.body ? JSON.stringify(err.response.body) : err.message)
    })
}
