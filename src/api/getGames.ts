import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetGamesSuccess = {
  data: {
    id: string
    name: string
    box_art_url: string
    igdb_id: string
  }[]
}

type GetGamesOptions = {
  type: 'id' | 'name'
  values: string | string[]
}

export const getGames = async (instance: TwitchInstance, options: GetGamesOptions): Promise<GetGamesSuccess['data']> => {
  const requestOptions = instance.API.defaultOptions()
  const params = Array.isArray(options.values) ? options.values.join(`&${options.type}=`) : options.values

  return fetch(`https://api.twitch.tv/helix/games?${options.type}=${params}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | GetGamesSuccess>
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
      instance.log('warn', `getGame err: ${err.message}`)
      return []
    })
}
