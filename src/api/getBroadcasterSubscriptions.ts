import type TwitchInstance from '../index'
import { type APIError } from '../api'

type Subscription = {
  broadcaster_id: string
  broadcaster_login: string
  broadcaster_name: string
  gifter_id: string
  gifter_login: string
  gifter_name: string
  is_gift: boolean
  plan_name: string
  tier: string
  user_id: string
  user_name: string
  user_login: string
}

type getBroadcasterSubscriptionsSuccess = {
  data: Subscription[]
  pagination?: {
    cursor?: string
  }
  total: number
  points: number
}

export const getBroadcasterSubscriptions = async (instance: TwitchInstance): Promise<void> => {
  if (!instance.auth.scopes.includes('channel:read:subscriptions')) {
    instance.log('debug', 'Unable to get Subscriptions, missing Subscriptions permissions')
    return
  }

  return new Promise((resolve) => {
    const getSubscriptions = (cursor?: string) => {
      const requestOptions = instance.API.defaultOptions()
      const url = `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${instance.auth.userID}&first=100${cursor ? `&after=${cursor}` : ''}`

      fetch(url, requestOptions)
        .then(async (res) => {
          instance.API.updateRatelimits(res.headers)
          return res.json() as Promise<APIError | getBroadcasterSubscriptionsSuccess>
        })
        .then((body) => {
          if ('data' in body) {
            // Success
            const channel = instance.channels.find((x) => x.id === instance.auth.userID)

            if (channel) {
              channel.subs.push(...body.data)
              channel.subsTotal = body.total
              channel.subPoints = body.points
            }

            if (body.pagination?.cursor) {
              getSubscriptions(body.pagination.cursor)
            } else {
              resolve()
            }
          } else {
            // Error
            instance.log('warn', `Failed to get subscriptions: ${JSON.stringify(body)}`)
            return resolve()
          }
        })
        .catch((err) => {
          instance.log('warn', `getBroadcasterSubscriptions err: ${err.message}`)
          return resolve()
        })
    }

    getSubscriptions()
  })
}
