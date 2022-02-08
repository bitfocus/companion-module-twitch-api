import TwitchInstance from './'
import tmi from 'tmi.js'

export class Chat {
  constructor(instance: TwitchInstance) {
    this.instance = instance
  }
  private client: tmi.Client | null = null
  private connected = false
  private instance: TwitchInstance
  private joinPartTimeout: NodeJS.Timeout | null = null
  private loading: boolean | null = null
  private loadingTimer: NodeJS.Timeout | null = null

  public readonly destroy = (): void => {
    if (this.client !== null) {
      this.client.disconnect()
      this.client.removeAllListeners()
      if (this.joinPartTimeout) clearTimeout(this.joinPartTimeout)
    }

    if (this.loadingTimer) clearTimeout(this.loadingTimer)
  }

  public readonly init = (): void => {
    if (!this.instance.auth.valid) {
      this.instance.log('debug', 'Chat err: Invalid token')
      return
    } else if (this.client !== null) {
      this.client.disconnect()
      this.client = null
    }

    const options = {
      options: { debug: false },
      connection: {
        reconnect: true,
        secure: true,
        skipUpdatingEmotesets: true,
      },
      identity: {
        username: this.instance.auth.username,
        password: `oauth:${this.instance.auth.oauth}`,
      },
      channels: this.instance.channels.map((channel) => channel.username),
    }

    this.client = new tmi.client(options)
    this.initListeners()
    this.client.connect().catch((err) => {
      this.instance.log('warn', err)
    })
  }

  private readonly initListeners = (): void => {
    console.log('initlistners')
    this.client?.on('message', (channel, _userstate, _message, _self) => {
      const channelData = this.instance.channels.find((data) => data.username === channel.substring(1))

      if (channelData) {
        channelData.chatActivity.total++
        channelData.chatActivity.recent[0]++
      }
    })

    this.client?.on('connected', (address: string, port: number): void => {
      this.instance.log('debug', `Connected ${address}:${port}`)
      this.instance.status(this.instance.STATUS_OK, 'Connected')
      this.connected = true
      this.loadingTimer = setTimeout(() => {
        this.loading = false
      }, 30000)
    })

    this.client?.on('connecting', (address: string, port: number): void => {
      this.instance.log('debug', `Connecting ${address}:${port}`)
      this.instance.status(this.instance.STATUS_WARNING, 'Connecting')
    })

    this.client?.on('disconnected', (): void => {
      this.instance.log('warn', `Disconnected`)
      this.connected = false
    })

    this.client?.on('emoteonly', (channel, enabled) => {
      const channelData = this.instance.channels.find((data) => data.username === channel.substring(1))

      if (channelData) {
        channelData.chatModes.emote = enabled
        this.instance.checkFeedbacks('chatStatus')
      }
    })

    this.client?.on('followersonly', (channel, enabled, length) => {
      this.instance.log('debug', `FollowersOnly: ${channel} - ${enabled} ${length}`)
      const channelData = this.instance.channels.find((data) => data.username === channel.substring(1))

      if (channelData) {
        channelData.chatModes.followers = enabled ? length.toString() : false
        this.instance.checkFeedbacks('chatStatus')
      }
    })

    this.client?.on('r9kbeta', (channel, enabled) => {
      this.instance.log('debug', `Unique: ${channel} - ${enabled}`)
      const channelData = this.instance.channels.find((data) => data.username === channel.substring(1))

      if (channelData) {
        channelData.chatModes.unique = enabled
        this.instance.checkFeedbacks('chatStatus')
      }
    })

    this.client?.on('slowmode', (channel, enabled, length) => {
      this.instance.log('debug', `SlowMode: ${channel} - ${enabled} ${length}`)
      const channelData = this.instance.channels.find((data) => data.username === channel.substring(1))

      if (channelData) {
        channelData.chatModes.slow = enabled ? length + '' : false
        this.instance.checkFeedbacks('chatStatus')
      }
    })

    this.client?.on('subscribers', (channel, enabled) => {
      this.instance.log('debug', `SubsOnly: ${channel} - ${enabled}`)
      const channelData = this.instance.channels.find((data) => data.username === channel.substring(1))

      if (channelData) {
        channelData.chatModes.sub = enabled
        this.instance.checkFeedbacks('chatStatus')
      }
    })

    this.client?.on('roomstate', (channel, state) => {
      const channelData = this.instance.channels.find((data) => data.username === channel.substring(1))

      if (channelData) {
        this.instance.log('debug', `Userstate: ${channel} - ${JSON.stringify(state)}`)
        if (state['emote-only'] !== undefined) channelData.chatModes.emote = state['emote-only'] || false
        if (
          state['followers-only'] !== undefined &&
          (typeof state['followers-only'] === 'boolean' || state['followers-only'] !== '-1')
        )
          channelData.chatModes.followers = state['followers-only']
        if (state.slow !== undefined) channelData.chatModes.slow = state.slow || false
        if (state['subs-only'] !== undefined) channelData.chatModes.sub = state['subs-only'] || false
        if (state.r9k !== undefined) channelData.chatModes.unique = state.r9k || false
        if (!channelData.id && state['room-id']) channelData.id = state['room-id']

        this.instance.checkFeedbacks('chatStatus')
      }
    })
  }

  public readonly message = (channel: string, message: string) => {
    if (this.client && this.connected) {
      this.client.say(channel, message)
    }
  }

  public readonly clearChat = (channel: string): void => {
    if (this.client && this.connected) {
      this.client.clear(channel)
    }
  }

  public readonly chatMode = (selection: string, mode: string, value?: any) => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (channel && this.client && this.connected) {
      if (mode === 'emote')
        channel.chatModes.emote ? this.client.emoteonlyoff(selection) : this.client.emoteonly(selection)
      if (mode === 'followers')
        channel.chatModes.followers || value == '0'
          ? this.client.followersonlyoff(selection)
          : this.client.followersonly(selection, value)
      if (mode === 'slow')
        channel.chatModes.slow || value == '0' ? this.client.slowoff(selection) : this.client.slow(selection, value)
      if (mode === 'sub')
        channel.chatModes.sub ? this.client.subscribersoff(selection) : this.client.subscribers(selection)
      if (mode === 'unique')
        channel.chatModes.unique ? this.client.r9kbetaoff(selection) : this.client.r9kbeta(selection)
    }
  }

  public readonly update = (): void => {
    if (this.loading) return
    if (this.loading === null) this.loading = true
    if (!this.client || !this.connected) {
      this.init()
    }

    // Check channels
    const updateList: { type: 'join' | 'part'; channel: string }[] = []
    const updateChannel = (): void => {
      const update = updateList.pop()

      if (!update) return

      if (this.connected) {
        this.client?.[update.type](update.channel).catch((_err: any) => {
          return
        })
        this.instance.log('debug', `${update.type === 'join' ? 'Joining ' : 'Parting '}${update.channel}`)
      }

      this.joinPartTimeout = setTimeout(() => {
        updateChannel()
      }, 2500)
    }

    const currentChannels = this.client?.getChannels() || []

    this.instance.channels.forEach((channel) => {
      if (!currentChannels.includes('#' + channel.username))
        updateList.push({ type: 'join', channel: channel.username.toLowerCase() })
    })

    currentChannels.forEach((channel) => {
      if (!this.instance.channels.map((channel) => channel.username).includes(channel.substring(1)))
        updateList.push({ type: 'part', channel })
    })

    updateChannel()
  }
}
