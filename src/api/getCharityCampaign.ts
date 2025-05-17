import type TwitchInstance from '../index'
import { type APIError } from '../api'

type CharityCampaignSuccess = {
  data: [
    {
      id: string
      broadcaster_id: string
      broadcaster_login: string
      broadcaster_name: string
      charity_name: string
      charity_description: string
      charity_logo: string
      charity_website: string
      current_amount: {
        value: number
        decimal_places: number
        currency: string
      }
      target_amount: {
        value: number
        decimal_places: number
        currency: string
      }
    },
  ]
}

export const getCharityCampaign = async (instance: TwitchInstance): Promise<void> => {
		if (!instance.auth.scopes.includes('channel:read:charity')) {
			instance.log('debug', 'Unable to get Charity Campaign, missing Charity Campaign permissions')
			return
		}

		const requestOptions = instance.API.defaultOptions()

		return fetch(`https://api.twitch.tv/helix/charity/campaigns?broadcaster_id=${instance.auth.userID}`, requestOptions)
			.then((res) => {
				instance.API.updateRatelimits(res.headers)
				return res.json() as Promise<APIError | CharityCampaignSuccess>
			})
			.then((body) => {
				if ('data' in body) {
					// Success
					const channel = instance.channels.find((x) => x.id === instance.auth.userID)
					if (channel && body.data.length > 0) {
						const data = body.data[0]

						channel.charity = {
							name: data.charity_name,
							description: data.charity_description,
							logo: data.charity_logo,
							website: data.charity_website,
							current: {
								value: data.current_amount.value,
								decimal: data.current_amount.decimal_places,
								currency: data.current_amount.currency,
							},
							target: {
								value: data.target_amount.value,
								decimal: data.target_amount.decimal_places,
								currency: data.target_amount.currency,
							},
						}
					}
				} else {
					// Error
					instance.log('debug', `Unable to get Charity Campaign ${JSON.stringify(body)}`)
				}
			})
			.catch((err) => {
				instance.log('warn', `getCharityCampaign err: ${err.message}`)
			})
	}
