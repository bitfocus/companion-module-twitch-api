import { createModuleLogger } from '@companion-module/base'
import type TwitchInstance from '../index.js'
import { type APIError } from '../api.js'

type SendChatAnnouncementOptions = {
  selection: string
  message: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'primary'
}

type SendChatAnnouncementSuccess = ''

const log = createModuleLogger('API')

export const sendChatAnnouncement = async (instance: TwitchInstance, options: SendChatAnnouncementOptions): Promise<void> => {
  if (!instance.auth.scopes.includes('moderator:manage:announcements')) {
    log.info('Unable to send chat announcement, missing moderator:manage:announcements scope')
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
        log.warn(`Failed to modify channel information: ${JSON.stringify(body, null, 2)}`)
      }
    })
    .catch((err) => {
      log.warn(`modifyChannelInformation err: ${err.message}`)
    })
}
