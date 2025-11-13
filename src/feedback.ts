import type TwitchInstance from './index'
//import { options } from './utils'
import type {
  CompanionAdvancedFeedbackResult,
  CompanionFeedbackButtonStyleResult,
  CompanionFeedbackAdvancedEvent,
  CompanionFeedbackBooleanEvent,
  SomeCompanionFeedbackInputField,
} from '@companion-module/base'
import { combineRgb } from '@companion-module/base'

export interface TwitchFeedbacks {
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
  callback: (feedback: Readonly<Omit<CompanionFeedbackAdvancedEvent, 'options' | 'type'> & T>) => CompanionAdvancedFeedbackResult
  subscribe?: (feedback: Readonly<Omit<CompanionFeedbackAdvancedEvent, 'options' | 'type'> & T>) => CompanionAdvancedFeedbackResult
  unsubscribe?: (feedback: Readonly<Omit<CompanionFeedbackAdvancedEvent, 'options' | 'type'> & T>) => CompanionAdvancedFeedbackResult
}

export type TwitchFeedback<T> = TwitchFeedbackBoolean<T> | TwitchFeedbackAdvanced<T>

export function getFeedbacks(instance: TwitchInstance): TwitchFeedbacks {
  return {
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
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
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
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
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
            return feedback.options.value === '' || feedback.options.value === (channel.chatModes.slowLength ? channel.chatModes.slowLength.toString() : '')
          return true
        }
        return false
      },
    },
  }
}
