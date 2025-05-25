import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetUsersOptions = {
	type: 'login' | 'id'
	channels: string | string[]
}

type GetUsersSuccess = {
  data: User[]
}

type User = {
  id: string
  login: string
  display_name: string
  type: 'admin' | 'global_mod' | 'staff' | ''
  broadcaster_type: 'affiliate' | 'partner' | ''
  description: string
  profile_image_url: string
  offline_image_url: string
  view_count: number // DEPRECATED
  email?: string
  created_at: string
}

export const getUsers = async (instance: TwitchInstance, options: GetUsersOptions): Promise<User[]> => {
  const users = Array.isArray(options.channels) ? options.channels.join(`&${options.type}=`) : options.channels
  const requestOptions = instance.API.defaultOptions()

  return fetch(`https://api.twitch.tv/helix/users?${options.type}=${users}`, requestOptions)
    .then((res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | GetUsersSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        return body.data
      } else {
        // Error
        instance.log('warn', `Failed to Get Users: ${JSON.stringify(body)}`)
        return []
      }
    })
    .catch((err) => {
      instance.log('warn', `getUsers err: ${err.message}`)
      return []
    })
}
