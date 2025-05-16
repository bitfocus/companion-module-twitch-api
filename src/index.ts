import {
  InstanceBase,
  runEntrypoint,
  CompanionActionDefinitions,
  CompanionFeedbackDefinitions,
  CompanionHTTPRequest,
  CompanionHTTPResponse,
  CompanionPresetDefinitions,
  SomeCompanionConfigField,
} from '@companion-module/base'
import { API } from './api'
import { Auth } from './auth'
import { getActions } from './actions'
import { Chat } from './chat'
import { Config, getConfigFields } from './config'
import { getFeedbacks } from './feedback'
import { httpHandler } from './http'
import { getPresets } from './presets'
import { Variables } from './variables'

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
  adSchedule: {
    next_ad_at: string | number
    last_ad_at: string | number
    duration: number
    preroll_free_time: number
    snooze_count: number
    snooze_refresh_at: string | number
  }
  viewers: number
  chatters: any[]
  chattersTotal: number
  categoryID: string
  categoryName: string
  delay: number
  followersTotal: number
  mod: boolean
  title: string
  tags: string[]
  ccl: string[]
  brandedContent: boolean
  chatActivity: { recent: number[]; total: number }
  shieldMode: boolean
  subs: any[]
  subsTotal: number
  subPoints: number
  charity?: {
    name: string
    description: string
    logo: string
    website: string
    current: { value: number; decimal: number; currency: string }
    target: { value: number; decimal: number; currency: string }
  }
  goals?: { type: 'follower' | 'subscription' | 'subscription_count' | 'new_subscription' | 'new_subscription_count'; description: string; current: number; target: number }[]
  polls?: {
    id: string
    title: string
    choices: { title: string; votes: number; pointsVotes: number; bitsVotes: number }[]
    pointsVoting: boolean
    pointsPerVote: number
    bitsVoting: boolean
    bitsPerVote: number
    duration: number
    status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'ARCHIVED' | 'MODERATED' | 'INVALID'
    started: string
    ended: string | null
  }[]
  predictions?: {
    id: string
    title: string
    outcomes: { id: string; title: string; users: number; points: number; color: string }[]
    duration: number
    status: 'RESOLVED' | 'ACTIVE' | 'CANCELED' | 'LOCKED'
    started: string
    ended: string | null
    locked: string | null
  }[]
}

/**
 * Companion instance class for Studiocoast vMix
 */
class TwitchInstance extends InstanceBase<Config> {
  constructor(internal: unknown) {
    super(internal)
  }

  public API = new API(this)
  public auth = new Auth(this)
  public channels: Channel[] = []
  public config: Config = {
    accessToken: '',
    refreshToken: '',
    channels: '',
    broadcasterAds: true,
    broadcasterBits: true,
    broadcasterChannelPoints: true,
    broadcasterCharity: true,
    broadcasterGoals: true,
    broadcasterExtensions: true,
    broadcasterGypeTrain: true,
    broadcasterModeration: true,
    broadcasterPollsPredictions: true,
    broadcasterRaids: true,
    broadcasterStreamKey: true,
    broadcasterGuestStar: true,
    broadcasterSubscriptions: true,
    broadcasterVIPs: true,
    editorStreamMarkers: true,
    moderatorAnnouncements: true,
    moderatorAutomod: true,
    moderatorChatModeration: true,
    moderatorChatters: true,
    moderatorFollowers: true,
    moderatorShieldMode: true,
    moderatorShoutouts: true,
    moderatorGuestStar: true,
    moderatorUnbanRequests: true,
    moderatorWarnings: true,
    userChat: true,
    userClips: true,
  }
  public connected = false
  public data = {}
  public updateStateInterval: ReturnType<typeof setInterval> | null = null
  public selectedChannel = ''

  public readonly chat = new Chat(this)
  public readonly variables = new Variables(this)

  /**
   * @description triggered on instance being enabled
   */
  public async init(config: Config): Promise<void> {
    this.log('debug', `Process ID: ${process.pid}`)
    this.config = config
    this.updateInstance()
    this.variables.updateDefinitions()
    this.auth.init()
    this.updateStateInterval = setInterval(() => this.updateState(), 1000)
  }

  /**d
   * @returns config options
   * @description generates the config options available for this instance
   */
  public getConfigFields(): SomeCompanionConfigField[] {
    return getConfigFields(this)
  }

  /**
   * @param config new configuration data
   * @description triggered every time the config for this instance is saved
   */
  public async configUpdated(config: Config): Promise<void> {
    const channelUpdate = config.channels !== this.config.channels
    this.config = config

    if (channelUpdate) this.updateInstance()
    this.variables.updateDefinitions()
  }

  /**
   * @description close connections and stop timers/intervals
   */
  public async destroy(): Promise<void> {
    this.chat.destroy()
    this.auth.destroy()
    this.API.destroy()
    if (this.updateStateInterval !== null) clearInterval(this.updateStateInterval)

    this.log('debug', `Instance destroyed: ${this.id}`)
  }

  /**
   * @description sets channels, token, actions, and feedbacks available for this instance
   */
  public async updateInstance(): Promise<void> {
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
          chatModes: { emote: false, followers: false, followersLength: 0, slow: false, slowLength: 30, sub: false, unique: false },
          live: false,
          adSchedule: {
            next_ad_at: '',
            last_ad_at: '',
            duration: 0,
            preroll_free_time: 0,
            snooze_count: 0,
            snooze_refresh_at: '',
          },
          viewers: 0,
          chatters: [],
          chattersTotal: 0,
          categoryID: '',
          categoryName: '',
          delay: 0,
          followersTotal: 0,
          mod: false,
          title: '',
          tags: [],
          ccl: [],
          brandedContent: false,
          chatActivity: { recent: [], total: 0 },
          shieldMode: false,
          subs: [],
          subsTotal: 0,
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

    await this.API.updateUsers(this)

    if (!this.auth.valid) return
    this.chat.update()

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

  /**
   * @param request HTTP request from Companion
   * @returns HTTP response
   */
  public async handleHttpRequest(request: CompanionHTTPRequest): Promise<CompanionHTTPResponse> {
    return httpHandler(this, request)
  }
}

export = TwitchInstance

runEntrypoint(TwitchInstance, [])
