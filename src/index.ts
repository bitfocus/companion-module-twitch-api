import {
  InstanceBase,
  runEntrypoint,
  CompanionActionDefinitions,
  CompanionFeedbackDefinitions,
  SomeCompanionConfigField,
  CompanionPresetDefinitions,
} from '@companion-module/base'
import { API } from './api'
import { getActions } from './actions'
import { Chat } from './chat'
import { Config, getConfigFields } from './config'
import { getFeedbacks } from './feedback'
import { getPresets } from './presets'
import { Variables } from './variables'

interface Auth {
  token: string | null
  oauth: string | null
  clientID: string | null
  valid: boolean
  scopes: string[]
  username: string
  userID: string
  authRetry: boolean
  authRetryTimer: NodeJS.Timer | null
}

interface Channel {
  displayName: string
  username: string
  id: string
  chatModes: {
    emote: boolean
    followers: boolean | string
    followersLength: number
    slow: boolean
    slowLength: number
    sub: boolean
    unique: boolean
    chatDelay?: boolean | string
  }
  live: Date | false
  viewers: number
  chatters: number
  category: string
  title: string
  chatActivity: {
    recent: number[]
    total: number
  }
  subs: number
  subPoints: 0
  charity?: {
    name: string
    description: string
    logo: string
    website: string
    current: {
      value: number
      decimal: number
      currency: string
    }
    target: {
      value: number
      decimal: number
      currency: string
    }
  }
  goals?: {
    type: 'follower' | 'subscription' | 'subscription_count' | 'new_subscription' | 'new_subscription_count'
    description: string
    current: number
    target: number
  }[]
  poll?: {
    title: string
    choices: {
      title: string
      votes: number
      pointsVotes: number
      bitsVotes: number
    }[]
    pointsVoting: boolean
    pointsPerVote: number
    bitsVoting: boolean
    bitsPerVote: number
    duration: number
    status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'ARCHIVED' | 'MODERATED' | 'INVALID'
    started: string
    ended: string | null
  }
  predictions?: {
    title: string
    outcomes: {
      title: string
      users: number
      points: number
      color: string
    }[]
    duration: number
    status: 'RESOLVED' | 'ACTIVE' | 'CANCELED' | 'LOCKED'
    started: string
    ended: string | null
    locked: string | null
  }
}

/**
 * Companion instance class for Studiocoast vMix
 */
class TwitchInstance extends InstanceBase<Config> {
  constructor(internal: unknown) {
    super(internal)
  }

  public API = new API(this)
  public auth: Auth = {
    token: null,
    oauth: null,
    clientID: null,
    valid: false,
    scopes: [],
    username: '',
    userID: '',
    authRetry: false,
    authRetryTimer: null,
  }
  public channels: Channel[] = []
  public config = {
    tokenServer: true,
    token: '',
    customServerURL: '',
    channels: '',
  }
  public connected = false
  public data = {}
  public updateStateInterval: NodeJS.Timer | null = null
  public selectedChannel = ''

  public readonly chat = new Chat(this)
  public readonly variables = new Variables(this)

  /**
   * @description triggered on instance being enabled
   */
  public async init(config: Config): Promise<void> {
    this.config = config
    this.updateInstance()
    this.updateStateInterval = setInterval(() => this.updateState(), 1000)
    this.log(
      'info',
      'Twitch is deprecating Chat commands in early 2023, so to ensure the auth token has the permissions to control the same functions through the API instead please go to https://twitchauth.companion.dist.dev/ and connect with the newly listed scopes'
    )
  }

  /**d
   * @returns config options
   * @description generates the config options available for this instance
   */
  public getConfigFields(): SomeCompanionConfigField[] {
    return getConfigFields()
  }

  /**
   * @param config new configuration data
   * @description triggered every time the config for this instance is saved
   */
  public async configUpdated(config: Config): Promise<void> {
    this.config = config
    if (config.token !== this.auth.token) {
      this.auth.token = config.token
      this.updateOAuthToken()
    }
    this.updateInstance()
  }

  public async updateOAuthToken(): Promise<void> {
    if (this.config.token === '') {
      return
    }

    // Prevent requesting OAuth tokens too frequently
    if (this.auth.authRetry || this.auth.token === '') Promise.resolve()
    this.auth.authRetry = true
    this.auth.authRetryTimer = setTimeout(() => {
      this.auth.authRetry = false
      this.updateOAuthToken()
    }, 900000)

    try {
      this.auth.oauth = (this.config.tokenServer ? await this.API.exchangeToken() : this.config.token).replace(
        /['"]+/g,
        ''
      )
      const validatedToken = await this.API.validateToken()
      if (validatedToken === null) return Promise.reject('unable to update OAuth token')
      this.auth.clientID = validatedToken.client_id
      this.auth.username = validatedToken.login
      this.auth.userID = validatedToken.user_id
      this.auth.valid = true
      this.auth.scopes = validatedToken.scopes
      this.API.pollData()

      Promise.resolve()
    } catch (e: any) {
      Promise.reject(e)
    }
  }

  /**
   * @description close connections and stop timers/intervals
   */
  public async destroy(): Promise<void> {
    this.chat.destroy()
    if (this.updateStateInterval !== null) clearInterval(this.updateStateInterval)
    if (this.auth.authRetryTimer !== null) clearTimeout(this.auth.authRetryTimer)

    this.log('debug', `Instance destroyed: ${this.id}`)
  }

  /**
   * @description sets channels, token, actions, and feedbacks available for this instance
   */
  private async updateInstance(): Promise<void> {
    this.channels = this.config.channels
      .replace(/,/g, ' ')
      .split(' ')
      .filter((channel) => channel !== '')
      .map((channel) => {
        let username = channel.toLowerCase()
        let displayName = channel

        if (channel.includes(':')) {
          username = channel.split(':')[0].toLowerCase()
          displayName = channel.split(':')[1]
        }

        const channelData: Channel = {
          displayName: displayName,
          username: username,
          id: '',
          chatModes: {
            emote: false,
            followers: false,
            followersLength: 0,
            slow: false,
            slowLength: 30,
            sub: false,
            unique: false,
          },
          live: false,
          viewers: 0,
          chatters: 0,
          category: '',
          title: '',
          chatActivity: {
            recent: [],
            total: 0,
          },
          subs: 0,
          subPoints: 0,
          goals: [],
        }

        for (let i = 0; i < 60; i++) {
          channelData.chatActivity.recent.push(0)
        }

        return channelData
      })

    this.channels.sort((a, b) => {
      return a.username < b.username ? -1 : 1
    })

    if (this.config.token === '') return

    await this.updateOAuthToken()
    await this.chat.update()

    // Cast actions and feedbacks from VMix types to Companion types
    const actions = getActions(this) as CompanionActionDefinitions
    const feedbacks = getFeedbacks(this) as unknown as CompanionFeedbackDefinitions
    const presets = getPresets(this) as unknown as CompanionPresetDefinitions

    this.setActionDefinitions(actions)
    this.setFeedbackDefinitions(feedbacks)
    this.setPresetDefinitions(presets)
    this.variables.updateVariables()
  }

  private updateState(): void {
    const minute = new Date().getSeconds() === 0

    if (minute) {
      this.channels.forEach((channel) => {
        channel.chatActivity.recent.unshift(0)
        channel.chatActivity.recent.pop()
      })

      this.API.pollData()
    }

    this.variables.updateVariables()
  }
}

export = TwitchInstance

runEntrypoint(TwitchInstance, [])
