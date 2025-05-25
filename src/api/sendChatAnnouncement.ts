import type TwitchInstance from '../index'
import { type APIError } from '../api'

type SendChatAnnouncementOptions = {
  selection: string
  message: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'primary'
}

type SendChatAnnouncementSuccess = ''

export const sendChatAnnouncement = async (instance: TwitchInstance, options: SendChatAnnouncementOptions): Promise<void> => {
  if (!instance.auth.scopes.includes('moderator:manage:announcements')) {
    instance.log('info', 'Unable to send chat announcement, missing moderator:manage:announcements scope')
    return
  }

  const channel = instance.channels.find((x) => x.username === options.selection)

  if (!channel || !channel.id) return

  const requestOptions = instance.API.defaultOptions()
  requestOptions.method = 'POST'
  requestOptions.body = JSON.stringify({
    message: options.message,
    color: options.color,
  })

  return fetch(`https://api.twitch.tv/helix/chat/announcements?broadcaster_id=${channel.id}&moderator_id=${instance.auth.userID}`, requestOptions)
    .then(async (res) => {
      instance.API.updateRatelimits(res.headers)
      return res.json() as Promise<APIError | SendChatAnnouncementSuccess>
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
