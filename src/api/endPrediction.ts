import type TwitchInstance from '../index'
import { type APIError } from '../api'

type EndPredictionSuccess = {
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
			top_predictors: null
			color: string
		}[] | null
		prediction_window: number
		status: 'ACTIVE' | 'CANCELED' | 'LOCKED' | 'RESOLVED'
		created_at: string
		ended_at: null | string
		locked_at: null | string
	}[]
}

export const endPrediction = async (instance: TwitchInstance, status: 'RESOLVED' | 'CANCELED' | 'LOCKED', outcome?: string): Promise<void> => {
		if (!instance.auth.scopes.includes('channel:manage:predictions')) {
			instance.log('info', 'Unabled to end Prediction, missing Polls & Predictions permissions')
			return
		}

		const channel = instance.channels.find((x) => x.id === instance.auth.userID)
		if (!channel || !channel.id) return

		await instance.API.getPredictions(instance)

		const prediction = channel.predictions?.[0]

		if (!prediction) {
			instance.log('warn', `Unable to end prediction, no prediction found`)
			return
		}

		if (prediction.status !== 'ACTIVE' && prediction.status !== 'LOCKED') {
			instance.log('warn', `Unable to end prediction, no prediction is active or locked`)
			return
		}

		let outcomeID = ''
		if (status === 'RESOLVED') {
			const winningOutcome = prediction.outcomes.find((x) => x.title === outcome)
			if (!winningOutcome) {
				instance.log('warn', `Unable to end prediction as resolved, unable to find matching outcome`)
				return
			}

			outcomeID = winningOutcome.id
		}

		const requestOptions = instance.API.defaultOptions()
		requestOptions.method = 'PATCH'
		requestOptions.body = JSON.stringify({
			broadcaster_id: channel.id,
			id: prediction.id,
			status,
			winning_outcome_id: status === 'RESOLVED' ? outcomeID : undefined,
		})

		return fetch(`https://api.twitch.tv/helix/predictions`, requestOptions)
			.then((res) => {
				instance.API.updateRatelimits(res.headers)
				return res.json() as Promise<APIError | EndPredictionSuccess>
			})
			.then((body) => {
				if ('data' in body) {
					// Success
					instance.log(`info`, `Prediction status changed`)
				} else {
					// Error
					instance.log('warn', `Failed to end Prediction: ${JSON.stringify(body)}`)
				}
			})
			.catch((err) => {
				instance.log('warn', err.response.body)
			})
	}
