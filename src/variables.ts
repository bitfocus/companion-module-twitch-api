import { type CompanionVariableDefinitions, sanitizeVariable } from '@companion-module/base'
import type TwitchInstance from './index.js'
import { formatNumber, formatTime } from './utils.js'

export type VariablesSchema = {
  ratelimit_limit: number
  ratelimit_remaining: number
  requests_per_min: number
  clip_id: string
  clip_url: string
  clip_edit_url: string
  ad_next: string
  ad_next_ms: number
  ad_last: string
  ad_last_ms: number
  ad_duration: string
  ad_preroll_free_time: string
  ad_snooze_count: string
  ad_snooze_refresh: string
  ad_snooze_refresh_ms: number
  selected: string
  [key: `${string}_live`]: boolean
  [key: `${string}_uptime`]: string
  [key: `${string}_viewers`]: number
  [key: `${string}_viewers_formatted`]: string
  [key: `${string}_chatters`]: number
  [key: `${string}_chatters_formatted`]: string
  [key: `${string}_category`]: string
  [key: `${string}_category_id`]: string
  [key: `${string}_followers`]: number | boolean
  [key: `${string}_followers_formatted`]: string
  [key: `${string}_title`]: string
  [key: `${string}_chat_activity_1m`]: number
  [key: `${string}_chat_activity_5m`]: number
  [key: `${string}_chat_activity_15m`]: number
  [key: `${string}_chat_activity_60m`]: number
  [key: `${string}_chat_activity_total`]: number
  [key: `${string}_chat_mode_emote`]: boolean
  [key: `${string}_chat_mode_followers`]: boolean
  [key: `${string}_chat_mode_followers_length`]: number
  [key: `${string}_chat_mode_slow`]: boolean
  [key: `${string}_chat_mode_slow_length`]: number
  [key: `${string}_chat_mode_sub`]: boolean
  [key: `${string}_chat_mode_unique`]: boolean
}

export class Variables {
  private readonly instance: TwitchInstance
  public currentDefinitions: Partial<CompanionVariableDefinitions<VariablesSchema>> = {}
  public currentValues: Partial<VariablesSchema> = {}

  constructor(instance: TwitchInstance) {
    this.instance = instance
  }

  private readonly getDefinitions = (): CompanionVariableDefinitions<VariablesSchema> => {
    const definitions: CompanionVariableDefinitions<VariablesSchema> = {
      ratelimit_limit: { name: 'Ratelimit Limit' },
      ratelimit_remaining: { name: 'Ratelimit Remaining' },
      requests_per_min: { name: 'Requests per Min' },

      clip_id: { name: 'Clip ID' },
      clip_url: { name: 'Clip URL' },
      clip_edit_url: { name: 'Clip Edit URL' },

      ad_next: { name: 'Ad Next' },
      ad_next_ms: { name: 'Ad Next MS' },
      ad_last: { name: 'Ad Last' },
      ad_last_ms: { name: 'Ad Last MS' },
      ad_duration: { name: 'Ad Duration' },
      ad_preroll_free_time: { name: 'Ad Preroll Free Time' },
      ad_snooze_count: { name: 'Ad Snooze Count' },
      ad_snooze_refresh: { name: 'Ad Snooze Refresh' },
      ad_snooze_refresh_ms: { name: 'Ad Snooze Refresh MS' },

      selected: { name: 'Selected Channel' },
      selected_live: { name: 'Selected Channel Live' },
      selected_uptime: { name: 'Selected Channel Uptime' },
      selected_viewers: { name: 'Selected Channel Viewers' },
      selected_viewers_formatted: { name: 'Selected Channel Viewers (formatted)' },
      selected_chatters: { name: 'Selected Channel Chatters' },
      selected_chatters_formatted: { name: 'Selected Channel Chatters (formatted)' },
      selected_category: { name: 'Selected Channel Category' },
      selected_category_id: { name: 'Selected Channel Category ID' },
      selected_followers: { name: 'Selected Channel Followers' },
      selected_followers_formatted: { name: 'Selected Channel Followers (formatted)' },
      selected_title: { name: 'Selected Channel Title' },
      selected_chat_activity_1m: { name: 'Selected Channel 1m Activity' },
      selected_chat_activity_5m: { name: 'Selected Channel 5m Activity' },
      selected_chat_activity_15m: { name: 'Selected Channel 15m Activity' },
      selected_chat_activity_60m: { name: 'Selected Channel 60m Activity' },
      selected_chat_activity_total: { name: 'Selected Channel Total Activity' },
      selected_chat_mode_emote: { name: 'Selected Channel Emotes Only' },
      selected_chat_mode_followers: { name: 'Selected Channel Followers Only' },
      selected_chat_mode_followers_length: { name: 'Selected Channel Followers Length' },
      selected_chat_mode_slow: { name: 'Selected Channel Slow Mode' },
      selected_chat_mode_slow_length: { name: 'Selected Channel Slow Length' },
      selected_chat_mode_sub: { name: 'Selected Channel Sub Only' },
      selected_chat_mode_unique: { name: 'Selected Channel Unique Mode' },
    }

    this.instance.channels.forEach((channel) => {
      const username = sanitizeVariable(channel.username)
      definitions[`${username}_live`] = { name: `${channel.displayName} Channel Live` }
      definitions[`${username}_uptime`] = { name: `${channel.displayName} Channel Uptime` }
      definitions[`${username}_viewers`] = { name: `${channel.displayName} Viewers` }
      definitions[`${username}_viewers_formatted`] = { name: `${channel.displayName} Viewers (formatted)` }
      definitions[`${username}_chatters`] = { name: `${channel.displayName} Chatters` }
      definitions[`${username}_chatters_formatted`] = { name: `${channel.displayName} Chatters (formatted)` }
      definitions[`${username}_category`] = { name: `${channel.displayName} Category` }
      definitions[`${username}_category_id`] = { name: `${channel.displayName} Category ID` }
      definitions[`${username}_followers`] = { name: `${channel.displayName} Followers` }
      definitions[`${username}_followers_formatted`] = { name: `${channel.displayName} Followers (formatted)` }
      definitions[`${username}_title`] = { name: `${channel.displayName} Title` }
      definitions[`${username}_chat_activity_1m`] = { name: `${channel.displayName} Chat 1m Activity` }
      definitions[`${username}_chat_activity_5m`] = { name: `${channel.displayName} Chat 5m Activity` }
      definitions[`${username}_chat_activity_15m`] = { name: `${channel.displayName} Chat 15m Activity` }
      definitions[`${username}_chat_activity_60m`] = { name: `${channel.displayName} Chat 60m Activity` }
      definitions[`${username}_chat_activity_total`] = { name: `${channel.displayName} Chat Total Activity` }
      definitions[`${username}_chat_mode_emote`] = { name: `${channel.displayName} Channel Chat Emote Only` }
      definitions[`${username}_chat_mode_followers`] = { name: `${channel.displayName} Channel Chat Followers Only` }
      definitions[`${username}_chat_mode_followers_length`] = { name: `${channel.displayName} Channel Chat Followers Length` }
      definitions[`${username}_chat_mode_slow`] = { name: `${channel.displayName} Channel Chat Slow Mode` }
      definitions[`${username}_chat_mode_slow_length`] = { name: `${channel.displayName} Channel Chat Slow Length` }
      definitions[`${username}_chat_mode_sub`] = { name: `${channel.displayName} Channel Chat Sub Only` }
      definitions[`${username}_chat_mode_unique`] = { name: `${channel.displayName} Channel Chat Unique Mode` }
    })

    return definitions
  }

  private readonly getValues = (): VariablesSchema => {
    const channel = this.instance.channels.find((x) => x.id === this.instance.auth.userID)
    const selectedChannel = this.instance.channels.find((channel) => channel.username === this.instance.selectedChannel)

    const variables: VariablesSchema = {
      ratelimit_limit: parseInt(this.instance.API.ratelimitLimit),
      ratelimit_remaining: parseInt(this.instance.API.ratelimitRemaining),
      requests_per_min: this.instance.API.requestsPerMin,
      clip_id: this.instance.API.clip.id,
      clip_url: this.instance.API.clip.url,
      clip_edit_url: this.instance.API.clip.edit_url,
      ad_next: channel?.adSchedule.next_ad_at || '',
      ad_next_ms: channel ? Date.parse(channel.adSchedule.next_ad_at) : 0,
      ad_last: channel?.adSchedule.last_ad_at || '',
      ad_last_ms: channel ? Date.parse(channel.adSchedule.last_ad_at) : 0,
      ad_duration: channel?.adSchedule.duration || '',
      ad_preroll_free_time: channel?.adSchedule.preroll_free_time || '',
      ad_snooze_count: channel?.adSchedule.snooze_count || '',
      ad_snooze_refresh: channel?.adSchedule.snooze_refresh_at || '',
      ad_snooze_refresh_ms: channel ? Date.parse(channel.adSchedule.snooze_refresh_at) : 0,
      selected: selectedChannel?.displayName || '',
    }

    this.instance.channels.forEach((channel) => {
      let activity1m = 0
      let activity5m = 0
      let activity15m = 0
      let activity60m = 0

      channel.chatActivity.recent.forEach((minute, index) => {
        if (index === 0) activity1m = minute
        if (index < 5) activity5m = activity5m + minute
        if (index < 15) activity15m = activity15m + minute
        activity60m = activity60m + minute
      })

      const uptime = channel.live === false ? '' : formatTime(new Date().getTime() - channel.live.getTime(), 'ms', 'hh:mm:ss')

      const username = sanitizeVariable(channel.username)
      variables[`${username}_live`] = channel.live !== false
      variables[`${username}_uptime`] = uptime
      variables[`${username}_viewers`] = channel.viewers
      variables[`${username}_viewers_formatted`] = formatNumber(channel.viewers)
      variables[`${username}_chatters`] = channel.chattersTotal
      variables[`${username}_chatters_formatted`] = formatNumber(channel.chattersTotal)
      variables[`${username}_category`] = channel.categoryName
      variables[`${username}_category_id`] = channel.categoryID
      variables[`${username}_followers`] = channel.followersTotal
      variables[`${username}_followers_formatted`] = formatNumber(channel.followersTotal)
      variables[`${username}_title`] = channel.title
      variables[`${username}_chat_activity_1m`] = activity1m
      variables[`${username}_chat_activity_5m`] = activity5m
      variables[`${username}_chat_activity_15m`] = activity15m
      variables[`${username}_chat_activity_60m`] = activity60m
      variables[`${username}_chat_activity_total`] = channel.chatActivity.total
      variables[`${username}_chat_mode_emote`] = channel.chatModes.emote
      variables[`${username}_chat_mode_followers`] = channel.chatModes.followers !== false
      variables[`${username}_chat_mode_followers_length`] = channel.chatModes.followersLength
      variables[`${username}_chat_mode_slow`] = channel.chatModes.slow
      variables[`${username}_chat_mode_slow_length`] = channel.chatModes.slowLength
      variables[`${username}_chat_mode_sub`] = channel.chatModes.sub
      variables[`${username}_chat_mode_unique`] = channel.chatModes.unique

      if (channel.username === this.instance.selectedChannel) {
        variables[`selected_live`] = channel.live !== false
        variables[`selected_uptime`] = uptime
        variables[`selected_viewers`] = channel.viewers
        variables[`selected_viewers_formatted`] = formatNumber(channel.viewers)
        variables[`selected_chatters`] = channel.chattersTotal
        variables[`selected_chatters_formatted`] = formatNumber(channel.chattersTotal)
        variables[`selected_category`] = channel.categoryName
        variables[`selected_category_id`] = channel.categoryID
        variables[`selected_followers`] = channel.followersTotal
        variables[`selected_followers_formatted`] = formatNumber(channel.followersTotal)
        variables[`selected_title`] = channel.title
        variables[`selected_chat_activity_1m`] = activity1m
        variables[`selected_chat_activity_5m`] = activity5m
        variables[`selected_chat_activity_15m`] = activity15m
        variables[`selected_chat_activity_60m`] = activity60m
        variables[`selected_chat_activity_total`] = channel.chatActivity.total
        variables[`selected_chat_activity_total`] = channel.chatActivity.total
        variables[`selected_chat_mode_emote`] = channel.chatModes.emote
        variables[`selected_chat_mode_followers`] = channel.chatModes.followers !== false
        variables[`selected_chat_mode_followers_length`] = channel.chatModes.followersLength
        variables[`selected_chat_mode_slow`] = channel.chatModes.slow
        variables[`selected_chat_mode_slow_length`] = channel.chatModes.slowLength
        variables[`selected_chat_mode_sub`] = channel.chatModes.sub
        variables[`selected_chat_mode_unique`] = channel.chatModes.unique
      }
    })

    return variables
  }

  public updateVariables = (): void => {
    const newDefinitions = this.getDefinitions()
    const newValues = this.getValues()

    if (JSON.stringify(this.currentDefinitions) !== JSON.stringify(newDefinitions)) {
      this.instance.setVariableDefinitions(newDefinitions)
      this.currentDefinitions = newDefinitions
    }

    const valueChanges: Partial<VariablesSchema> = {}

    Object.entries(newValues).forEach(([key, value]: [any, any]) => {
      if (this.currentValues[key] !== value) valueChanges[key] = value
    })

    Object.keys(this.currentValues).forEach((key: any) => {
      if (newValues[key] === undefined) valueChanges[key] = undefined
    })

    if (Object.keys(newValues).length > 0) {
      this.instance.setVariableValues(newValues)
      this.currentValues = newValues
    }
  }
}
