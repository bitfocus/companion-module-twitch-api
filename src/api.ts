import TwitchInstance from './'
import got from 'got-cjs'

export const adStart = (instance: TwitchInstance, length: string): Promise<void> => {
  const options = {
    headers: {
      'Client-ID': instance.auth.clientID || '',
      Authorization: 'Bearer ' + instance.auth.oauth,
    },
  }

  if (!instance.auth.userID) return Promise.resolve()

  return got
    .post(
      `https://api.twitch.tv/helix/channels/commercial?broadcaster_id=${instance.auth.userID}&length=${length}`,
      options
    )
    .then((res) => {
      instance.log('debug', res.body)
    })
    .catch((err: any) => {
      instance.log('warn', err.response.body)
    })
}

export const createMarker = (instance: TwitchInstance, selection: string): Promise<void> => {
  const channel = instance.channels.find((x) => x.username === selection)

  if (!channel || !channel.id) return Promise.resolve()

  const markerID = `companion-${instance.auth.username}-${Date.now()}`

  const options = {
    headers: {
      'Client-ID': instance.auth.clientID || '',
      Authorization: 'Bearer ' + instance.auth.oauth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: channel.id,
      description: markerID,
    }),
  }

  return got
    .post('https://api.twitch.tv/helix/streams/markers', options)
    .then((res) => {
      instance.log('info', `Created marker: ${markerID} - ${res.body}`)
    })
    .catch((err) => {
      instance.log('warn', err.response.body)
    })
}

export const exchangeToken = (instance: TwitchInstance): Promise<string> => {
  const baseURL =
    instance.config.customServerURL === '' ? 'https://api-companion.dist.dev/token/' : instance.config.customServerURL
  const url = baseURL + '?id=' + instance.config.token

  return got.get(url).then((res) => {
    instance.log('debug', `Got token: ${res.body}`)
    return res.body
  })
}

export const getStreamData = (instance: TwitchInstance): void => {
  const getChatters = (): void => {
    instance.channels.forEach((channel) => {
      got
        .get(`https://tmi.twitch.tv/group/user/${channel.username}/chatters`)
        .then((res) => {
          let data: any = res.body

          try {
            data = JSON.parse(data)
          } catch (e) {
            return Promise.reject(e)
          }

          if (data && data.chatter_count) channel.chatters = data.chatter_count
          return
        })
        .catch((e: Error) => {
          instance.log('warn', e.message)
        })
    })
  }

  const getStreams = (): void => {
    if (!instance.auth.valid) return

    const options = {
      headers: {
        'Client-ID': instance.auth.clientID || '',
        Authorization: 'Bearer ' + instance.auth.oauth,
      },
    }

    const channels = instance.channels.map((channel) => channel.username)

    got
      .get(`https://api.twitch.tv/helix/streams?user_login=${channels.join('&user_login=')}`, options)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data)
        } catch (e) {
          return Promise.reject(e)
        }

        instance.channels.forEach((channel) => {
          const stream = data.data.find((stream: any) => stream.user_login === channel.username)

          if (stream) {
            channel.live = new Date(stream.started_at)
            channel.category = stream.game_name
            channel.title = stream.title
            channel.viewers = stream.viewer_count
          } else {
            channel.live = false
            channel.category = ''
            channel.title = ''
            channel.viewers = 0
          }
        })

        instance.checkFeedbacks('channelStatus')

        return
      })
      .catch((err: Error) => {
        instance.log('warn', err.message)
      })
  }

  if (instance.channels.length > 0) {
    getChatters()
    getStreams()
  }
}

export const request = (instance: TwitchInstance, method: 'get' | 'put' | 'post', url: string, body: string): void => {
  if (!instance.auth.valid) return

  const options = {
    headers: {
      'Client-ID': instance.auth.clientID || '',
      Authorization: 'Bearer ' + instance.auth.oauth,
      'Content-Type': 'application/json',
    },
    body: body || undefined,
  }

  got[method](url, options)
    .then((res) => {
      instance.log('info', JSON.stringify(res.body))
    })
    .catch((err) => {
      instance.log('warn', err.response.body ? JSON.stringify(err.body) : err.message)
    })
}

export const validateToken = (instance: TwitchInstance): Promise<any> => {
  const options = {
    headers: {
      Authorization: 'OAuth ' + instance.auth.oauth,
    },
  }

  return got.get('https://id.twitch.tv/oauth2/validate', options).then((res) => {
    instance.log('debug', `Validated token: ${res.body}`)
    return JSON.parse(res.body)
  })
}
