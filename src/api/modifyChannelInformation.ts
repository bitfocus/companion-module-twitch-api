import type TwitchInstance from '../index'
import { type APIError } from '../api'

type ModifyChannelInformationOptions = {
  branded: boolean
  brandedValue: boolean
  ccls: boolean
  debatedSocialIssuesAndPolitics: boolean
  drugsIntoxication: boolean
  gambling: boolean
  game: boolean
  gameValue: string
  profanityVulgarity: boolean
  sexualThemes: boolean
  title: boolean
  titleValue: string
  violentGraphic: boolean
}

type ModifyChannelInformationSuccess = ''

export const modifyChannelInformation = async (instance: TwitchInstance, options: ModifyChannelInformationOptions): Promise<void> => {
  if (!instance.auth.scopes.includes('channel:manage:broadcast')) {
    instance.log('info', 'Unable to modify channel information, missing Stream Info and Markers permissions')
    return
  }

  const body: Record<string, any> = {}

  if (options.branded) {
    body.is_branded_content = options.brandedValue
  }

  if (options.ccls) {
    body.content_classification_labels = [
      { id: 'DebatedSocialIssuesAndPolitics', enabled: options.debatedSocialIssuesAndPolitics },
      { id: 'DrugsIntoxication', enabled: options.drugsIntoxication },
      { id: 'SexualThemes', enabled: options.sexualThemes },
      { id: 'ViolentGraphic', enabled: options.violentGraphic },
      { id: 'Gambling', enabled: options.gambling },
      { id: 'ProfanityVulgarity', enabled: options.profanityVulgarity },
    ]
  }

  if (options.game) {
    const game = await instance.API.getGames(instance, { type: 'name', values: options.gameValue })
    body.game_id = game[0]?.id || ''
  }

  if (options.title) {
    body.title = options.titleValue
  }

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'PATCH'
  requestOptions.body = JSON.stringify(body)

  return fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${instance.auth.userID}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | ModifyChannelInformationSuccess>
    })
    .then((body) => {
      if (body !== '') {
        // Error
        instance.log('warn', `Failed to modify channel information: ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', `modifyChannelInformation err: ${err.message}`)
    })
}
