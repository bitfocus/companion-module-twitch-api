import type TwitchInstance from '../index'
import { type APIError } from '../api'

type UpdateChatSettingsSuccess = {
  data: {
    broadcaster_id: string
    moderator_id: string
    slow_mode: boolean
    slow_mode_wait_time: number
    follower_mode: boolean
    follower_mode_duration: null | number
    subscriber_mode: boolean
    emote_mode: boolean
    unique_chat_mode: boolean
    non_moderator_chat_delay: boolean
    non_moderator_chat_delay_duration: null | number
  }[]
}

export const updateChatSettings = async (instance: TwitchInstance, selection: string, mode: string, state: any): Promise<void> => {
  if (!instance.auth.scopes.includes('moderator:manage:chat_settings')) {
    instance.log('debug', 'Unable to update Chat Settings, missing moderator:manage:chat_settings scope')
    return
  }

  const channel = instance.channels.find((x) => x.username === selection)

  if (!channel) return

  const requestOptions = instance.API.defaultOptions()
  requestOptions.body = JSON.stringify({
    [mode]: state,
  })

  if (mode === 'slow_mode_wait_time') {
    if (state === 0) {
      requestOptions.body = JSON.stringify({ slow_mode: false })
    } else if (state.toString() == channel.chatModes.slowLength) {
      requestOptions.body = JSON.stringify({
        slow_mode: !channel.chatModes.slow,
      })
    } else {
      let waitTime = state
      if (state < 3) waitTime = 3
      if (state > 120) waitTime = 120

      requestOptions.body = JSON.stringify({
        slow_mode: true,
        slow_mode_wait_time: waitTime,
      })
    }
  }

  if (mode === 'follower_mode_duration') {
    if (state === '0' || state === '') {
      requestOptions.body = JSON.stringify({ follower_mode: false })
    } else if (state === channel.chatModes.followersLength.toString()) {
      requestOptions.body = JSON.stringify({
        follower_mode: !channel.chatModes.followers,
      })
    } else {
      let duration = state
      if (state < 0) duration = 0
      if (state > 129600) duration = 129600

      requestOptions.body = JSON.stringify({
        follower_mode: true,
        follower_mode_duration: duration,
      })
    }
  }

  return fetch(`https://api.twitch.tv/helix/chat/settings?broadcaster_id=${channel.id}&moderator_id=${instance.auth.userID}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | UpdateChatSettingsSuccess>
    })
    .then((body) => {
      if ('data' in body) {
        // Success
        const data = body.data[0]
        channel.chatModes = {
          emote: data.emote_mode,
          followers: data.follower_mode,
          followersLength: data.follower_mode_duration ? data.follower_mode_duration : 0,
          slow: data.slow_mode,
          slowLength: data.slow_mode_wait_time,
          sub: data.subscriber_mode,
          unique: data.unique_chat_mode,
          chatDelay: data.non_moderator_chat_delay ? data.non_moderator_chat_delay_duration?.toString() : data.non_moderator_chat_delay,
        }

        instance.checkFeedbacks('chatStatus')
        instance.variables.updateVariables()
      } else {
        // Error
        instance.log('warn', `Failed to update Chat Settings: ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err) => {
      instance.log('warn', `updateChatSettings err: ${err.message} - ${err.response.body}`)
    })
}
