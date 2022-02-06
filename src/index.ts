import instance_skel = require('../../../instance_skel')
import {
  CompanionActions,
  CompanionConfigField,
  CompanionFeedbacks,
  CompanionSystem,
  CompanionPreset,
  CompanionStaticUpgradeScript,
} from '../../../instance_skel_types'
import { exchangeToken, getStreamData, validateToken } from './api'
import { getActions } from './actions'
import { Chat } from './chat'
import { Config, getConfigFields } from './config'
import { getFeedbacks } from './feedback'
import { getPresets } from './presets'
import { getUpgrades } from './upgrade'
import { Variables } from './variables'

interface Auth {
  token: string | null
  oauth: string | null
  clientID: string | null
  valid: boolean
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
    slow: boolean | string
    sub: boolean
    unique: boolean
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
}

/**
 * Companion instance class for Studiocoast vMix
 */
class TwitchInstance extends instance_skel<Config> {
  constructor(system: CompanionSystem, id: string, config: Config) {
    super(system, id, config)
    this.config = config
    this.variables = new Variables(this)
    this.chat = new Chat(this)
    this.channels = []

    this.auth = {
      token: null,
      oauth: null,
      clientID: null,
      valid: false,
      username: '',
      userID: '',
      authRetry: false,
      authRetryTimer: null,
    }
  }
  public auth: Auth
  public channels: Channel[]
  public connected = false
  public data = {}
  public updateStateInterval: NodeJS.Timer | null = null
  public selectedChannel = ''

  public readonly chat
  public readonly variables

  static GetUpgradeScripts(): CompanionStaticUpgradeScript[] {
    return getUpgrades()
  }

  /**
   * @description triggered on instance being enabled
   */
  public init(): void {
    this.updateInstance()
    this.updateStateInterval = setInterval(() => this.updateState(), 1000)
  }

  /**
   * @returns config options
   * @description generates the config options available for this instance
   */
  public readonly config_fields = (): CompanionConfigField[] => {
    return getConfigFields()
  }

  /**
   * @param config new configuration data
   * @description triggered every time the config for this instance is saved
   */
  public async updateConfig(config: Config): Promise<void> {
    this.config = config
    if (config.token !== this.auth.token) {
      this.auth.token = config.token
      this.updateOAuthToken()
    }
    this.updateInstance()
  }

  public async updateOAuthToken(): Promise<void> {
    // Prevent requesting OAuth tokens too frequently
    if (this.auth.authRetry || this.auth.token === '') Promise.resolve()
    this.auth.authRetry = true
    this.auth.authRetryTimer = setTimeout(() => {
      this.auth.authRetry = false
      this.updateOAuthToken()
    }, 900000)

    try {
      this.auth.oauth = (this.config.tokenServer ? await exchangeToken(this) : this.config.token).replace(/['"]+/g, '')
      const validatedToken = await validateToken(this)
      this.auth.clientID = validatedToken.client_id
      this.auth.username = validatedToken.login
      this.auth.userID = validatedToken.user_id
      this.auth.valid = true
      getStreamData(this)

      Promise.resolve()
    } catch (e: any) {
      Promise.reject(e)
    }
  }

  /**
   * @description close connections and stop timers/intervals
   */
  public readonly destroy = (): void => {
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
            slow: false,
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
        }

        for (let i = 0; i < 60; i++) {
          channelData.chatActivity.recent.push(0)
        }

        return channelData
      })

    this.channels.sort((a, b) => {
      return a.username < b.username ? -1 : 1
    })

    await this.updateOAuthToken()
    await this.chat.update()

    // Cast actions and feedbacks from VMix types to Companion types
    const actions = getActions(this) as CompanionActions
    const feedbacks = getFeedbacks(this) as CompanionFeedbacks

    this.setActions(actions)
    this.setFeedbackDefinitions(feedbacks)
    this.setPresetDefinitions(getPresets(this) as CompanionPreset[])
    this.variables.updateVariables()
  }

  private updateState(): void {
    const minute = new Date().getSeconds() === 0

    if (minute) {
      this.channels.forEach((channel) => {
        channel.chatActivity.recent.unshift(0)
        channel.chatActivity.recent.pop()
      })

      getStreamData(this)
    }

    this.variables.updateVariables()
  }
}

export = TwitchInstance
