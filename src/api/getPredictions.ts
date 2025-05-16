import type TwitchInstance from '../index'
import { type APIError } from '../api'

type GetPredictionSuccess = {
  data: {
    id: string
    broadcaster_id: string
    broadcaster_name: string
    broadcaster_login: string
    title: string
    winning_outcome_id: null | string
    outcomes: {
      id: string
      title: string
      users: number
      channel_points: number
      top_predictors:
        | null
        | {
            user_id: string
            user_name: string
            user_login: string
            channel_points_used: number
            channel_points_won: number
          }[]
      color: string
    }[]
    prediction_window: number
    status: 'ACTIVE' | 'CANCELED' | 'LOCKED' | 'RESOLVED'
    created_at: string
    ended_at: null | string
    locked_at: null | string
  }[]
}

export const getPredictions = async (instance: TwitchInstance): Promise<void> => {
  const requestOptions = instance.API.defaultOptions()

  return fetch(`https://api.twitch.tv/helix/predictions?broadcaster_id=${instance.auth.userID}&first=25`, requestOptions)
    .then((res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | GetPredictionSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const channel = instance.channels.find((x) => x.id === instance.auth.userID)

        if (channel && body.data) {
          channel.predictions = body.data.map((prediction) => ({
            id: prediction.id,
            title: prediction.title,
            outcomes: prediction.outcomes.map((choice: any) => {
              return {
                id: choice.id,
                title: choice.title,
                users: choice.users,
                points: choice.points,
                color: choice.color,
              }
            }),
            duration: prediction.prediction_window,
            status: prediction.status,
            started: prediction.created_at,
            ended: prediction.ended_at,
            locked: prediction.locked_at,
          }))
        }
      } else {
        // Error
        instance.log('debug', `Error getting predictions: ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', `getPredictions err: ${err.message}`)
    })
}
