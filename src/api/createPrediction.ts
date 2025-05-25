import type TwitchInstance from '../index'
import { type APIError } from '../api'

type PredictionOptions = {
  title: string
  outcomes: string[]
  duration: number
}

type CreatePredictionSuccess = {
  data: {
    id: string
    broadcaster_id: string
    broadcaster_name: string
    broadcaster_login: string
    title: string
    winning_outcome_id: null | string
    outcomes:
      | {
          id: string
          title: string
          users: number
          channel_points: number
          top_predictors: null
          color: string
        }[]
      | null
    prediction_window: number
    status: 'ACTIVE' | 'CANCELED' | 'LOCKED' | 'RESOLVED'
    created_at: string
    ended_at: null | string
    locked_at: null | string
  }[]
}

export const createPrediction = async (instance: TwitchInstance, options: PredictionOptions): Promise<void> => {
  if (!instance.auth.scopes.includes('channel:manage:predictions')) {
    instance.log('info', 'Unable to Create Prediction, missing Polls & Predictions permissions')
    return
  }

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'
  requestOptions.body = JSON.stringify({
    broadcaster_id: instance.auth.userID,
    title: options.title,
    outcomes: options.outcomes.map((outcome) => ({ title: outcome })),
    prediction_window: options.duration,
  })

  return fetch('https://api.twitch.tv/helix/predictions', requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | CreatePredictionSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const prediction = body.data[0]
        instance.log('info', `Prediction ${options.title} created with prediction ID: ${prediction.id}`)
      } else {
        // Error
        instance.log('warn', `Failed to create Prediction: ${JSON.stringify(body)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', `Create Prediction Error: ${err}`)
    })
}
