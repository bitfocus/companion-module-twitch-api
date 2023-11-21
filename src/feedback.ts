import TwitchInstance from './index'
//import { options } from './utils'
import {
  combineRgb,
  CompanionAdvancedFeedbackResult,
  CompanionFeedbackButtonStyleResult,
  CompanionFeedbackAdvancedEvent,
  CompanionFeedbackBooleanEvent,
  SomeCompanionFeedbackInputField,
} from '@companion-module/base'
import { NumberComparitorPicker } from './input.js'
import {
  adScheduleNextAdCountdownMinutesChoice,
  adSchedulePrerollFreeTimeSecondsChoice,
  adScheduleSnoozeCountChoice,
} from './choices'
import { compareNumber, NumberComparitor } from './utils'

export interface TwitchFeedbacks {
  adScheduleSnoozeCount: TwitchFeedback<AdScheduleSnoozeCountCallback>
  adScheduleNextAdCountdownMinutes: TwitchFeedback<AdScheduleNextAdCountdownMinutesCallback>
  adSchedulePrerollFreeTimeSeconds: TwitchFeedback<AdSchedulePrerollFreeTimeSecondsCallback>
  channelStatus: TwitchFeedback<ChannelStatusCallback>
  chatStatus: TwitchFeedback<ChatStatusCallback>
  // Index signature
  [key: string]: TwitchFeedback<any>
}

type ChatModes = 'emote' | 'followers' | 'slow' | 'sub' | 'unique'

interface ChannelStatusCallback {
  type: 'channelStatus'
  options: Readonly<{
    channel: string
  }>
}

interface ChatStatusCallback {
  type: 'chatStatus'
  options: Readonly<{
    channel: string
    mode: ChatModes
    value: string
  }>
}

interface AdScheduleSnoozeCountCallback {
  type: 'adScheduleSnoozeCount'
  options: Readonly<{
    channel: string
    adScheduleSnoozeCount: number
    comparitor: NumberComparitor
  }>
}

interface AdScheduleNextAdCountdownMinutesCallback {
  type: 'adScheduleNextAdCountdownMinutes'
  options: Readonly<{
    channel: string
    adScheduleNextAdCountdownMinutes: number
    comparitor: NumberComparitor
  }>
}

interface AdSchedulePrerollFreeTimeSecondsCallback {
  type: 'adSchedulePrerollFreeTimeSeconds'
  options: Readonly<{
    channel: string
    adSchedulePrerollFreeTimeSeconds: number
    comparitor: NumberComparitor
  }>
}
// Callback type for Presets
export type FeedbackCallbacks = ChatStatusCallback

// Force options to have a default to prevent sending undefined values
type InputFieldWithDefault = Exclude<SomeCompanionFeedbackInputField, 'default'> & {
  default: string | number | boolean | null
}

// Twitch Boolean and Advanced feedback types
interface TwitchFeedbackBoolean<T> {
  type: 'boolean'
  name: string
  description: string
  style: Partial<CompanionFeedbackButtonStyleResult>
  options: InputFieldWithDefault[]
  callback: (feedback: Readonly<Omit<CompanionFeedbackBooleanEvent, 'options' | 'type'> & T>) => boolean
  subscribe?: (feedback: Readonly<Omit<CompanionFeedbackBooleanEvent, 'options' | 'type'> & T>) => boolean
  unsubscribe?: (feedback: Readonly<Omit<CompanionFeedbackBooleanEvent, 'options' | 'type'> & T>) => boolean
}

interface TwitchFeedbackAdvanced<T> {
  type: 'advanced'
  name: string
  description: string
  options: InputFieldWithDefault[]
  callback: (
    feedback: Readonly<Omit<CompanionFeedbackAdvancedEvent, 'options' | 'type'> & T>
  ) => CompanionAdvancedFeedbackResult
  subscribe?: (
    feedback: Readonly<Omit<CompanionFeedbackAdvancedEvent, 'options' | 'type'> & T>
  ) => CompanionAdvancedFeedbackResult
  unsubscribe?: (
    feedback: Readonly<Omit<CompanionFeedbackAdvancedEvent, 'options' | 'type'> & T>
  ) => CompanionAdvancedFeedbackResult
}

export type TwitchFeedback<T> = TwitchFeedbackBoolean<T> | TwitchFeedbackAdvanced<T>

export function getFeedbacks(instance: TwitchInstance): TwitchFeedbacks {
  return {
    adScheduleSnoozeCount: {
      type: 'boolean',
      name: 'Ad Snooze Count',
      description: 'The number of snoozes available for the broadcaster.',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [
            { id: 'selected', label: 'Selected' },
            ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
          ],
        },
        NumberComparitorPicker(),
        adScheduleSnoozeCountChoice,
      ],
      style: {
        color: combineRgb(0, 0, 0),
        bgcolor: combineRgb(0, 255, 0),
      },
      callback: (feedback): boolean => {
        const selection = feedback.options.channel === 'selected' ? instance.selectedChannel : feedback.options.channel
        const channel = instance.channels.find((data) => data.username === selection)
        const currentVal = channel?.adSchedule.snooze_count
        return (
          typeof currentVal === 'number' &&
          compareNumber(feedback.options.adScheduleSnoozeCount, feedback.options.comparitor, currentVal)
        )
      },
    },
    adScheduleNextAdCountdownMinutes: {
      type: 'boolean',
      name: 'Next Ad Countdown (Minutes)',
      description: 'The number of minutes until the next scheduled ad.',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [
            { id: 'selected', label: 'Selected' },
            ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
          ],
        },
        NumberComparitorPicker(),
        adScheduleNextAdCountdownMinutesChoice,
      ],
      style: {
        color: combineRgb(0, 0, 0),
        bgcolor: combineRgb(0, 255, 0),
      },
      callback: (feedback): boolean => {
        const selection = feedback.options.channel === 'selected' ? instance.selectedChannel : feedback.options.channel
        const channel = instance.channels.find((data) => data.username === selection)
        const next_ad_at = channel?.adSchedule.next_ad_at
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const currentVal = Math.round((next_ad_at - new Date().getTime() / 1000) / 60)
        return (
          typeof currentVal === 'number' &&
          compareNumber(feedback.options.adScheduleNextAdCountdownMinutes, feedback.options.comparitor, currentVal)
        )
      },
    },
    adSchedulePrerollFreeTimeSeconds: {
      type: 'boolean',
      name: 'Prerool Free Time (Seconds)',
      description: 'The number of seconds before new viewers will see preroll ads.',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [
            { id: 'selected', label: 'Selected' },
            ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
          ],
        },
        NumberComparitorPicker(),
        adSchedulePrerollFreeTimeSecondsChoice,
      ],
      style: {
        color: combineRgb(0, 0, 0),
        bgcolor: combineRgb(0, 255, 0),
      },
      callback: (feedback): boolean => {
        const selection = feedback.options.channel === 'selected' ? instance.selectedChannel : feedback.options.channel
        const channel = instance.channels.find((data) => data.username === selection)
        const currentVal = channel?.adSchedule.preroll_free_time_seconds
        return (
          typeof currentVal === 'number' &&
          compareNumber(feedback.options.adSchedulePrerollFreeTimeSeconds, feedback.options.comparitor, currentVal)
        )
      },
    },
    channelStatus: {
      type: 'boolean',
      name: 'Channel Status',
      description: 'Indicates if a channel is live',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [
            { id: 'selected', label: 'Selected' },
            ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
          ],
        },
      ],
      style: {
        color: combineRgb(0, 0, 0),
        bgcolor: combineRgb(0, 255, 0),
      },
      callback: (feedback): boolean => {
        const selection = feedback.options.channel === 'selected' ? instance.selectedChannel : feedback.options.channel
        const channel = instance.channels.find((data) => data.username === selection)

        return channel !== undefined && channel?.live !== false
      },
    },
    chatStatus: {
      type: 'boolean',
      name: 'Chat Status',
      description: 'Indicates status of different chat modes',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [
            { id: 'selected', label: 'Selected' },
            ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
          ],
        },
        {
          type: 'dropdown',
          label: 'Mode',
          id: 'mode',
          default: 'emote',
          choices: ['Emote', 'Followers', 'Slow', 'Sub', 'Unique'].map((mode) => ({
            id: mode.toLowerCase(),
            label: mode,
          })),
        },
        {
          type: 'textinput',
          label: 'Mode value',
          id: 'value',
          default: '',
          isVisible: (options) => {
            return !['emote', 'followers', 'sub', 'unique'].includes(options.mode as string)
          },
        },
      ],
      style: {
        color: combineRgb(0, 0, 0),
        bgcolor: combineRgb(255, 0, 0),
      },
      callback: (feedback): boolean => {
        const selection = feedback.options.channel === 'selected' ? instance.selectedChannel : feedback.options.channel
        const channel = instance.channels.find((data) => data.username === selection)

        if (channel && channel.chatModes[feedback.options.mode]) {
          if (feedback.options.mode === 'slow')
            return (
              feedback.options.value === '' ||
              feedback.options.value === (channel.chatModes.slowLength ? channel.chatModes.slowLength.toString() : '')
            )
          return true
        }
        return false
      },
    },
  }
}
