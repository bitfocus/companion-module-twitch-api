import TwitchInstance from './index'
//import { options } from './utils'
import {
  CompanionFeedbackEvent,
  SomeCompanionInputField,
  CompanionBankRequiredProps,
  CompanionBankAdditionalStyleProps,
  CompanionFeedbackEventInfo,
  CompanionBankPNG,
} from '../../../instance_skel_types'

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
type InputFieldWithDefault = Exclude<SomeCompanionInputField, 'default'> & { default: string | number | boolean | null }

// Twitch Boolean and Advanced feedback types
interface TwitchFeedbackBoolean<T> {
  type: 'boolean'
  label: string
  description: string
  style: Partial<CompanionBankRequiredProps & CompanionBankAdditionalStyleProps>
  options: InputFieldWithDefault[]
  callback?: (
    feedback: Readonly<Omit<CompanionFeedbackEvent, 'options' | 'type'> & T>,
    bank: Readonly<CompanionBankPNG | null>,
    info: Readonly<CompanionFeedbackEventInfo | null>
  ) => boolean
  subscribe?: (feedback: Readonly<Omit<CompanionFeedbackEvent, 'options' | 'type'> & T>) => boolean
  unsubscribe?: (feedback: Readonly<Omit<CompanionFeedbackEvent, 'options' | 'type'> & T>) => boolean
}

interface TwitchFeedbackAdvanced<T> {
  type: 'advanced'
  label: string
  description: string
  options: InputFieldWithDefault[]
  callback?: (
    feedback: Readonly<Omit<CompanionFeedbackEvent, 'options' | 'type'> & T>,
    bank: Readonly<CompanionBankPNG | null>,
    info: Readonly<CompanionFeedbackEventInfo | null>
  ) => Partial<CompanionBankRequiredProps & CompanionBankAdditionalStyleProps> | void
  subscribe?: (
    feedback: Readonly<Omit<CompanionFeedbackEvent, 'options' | 'type'> & T>
  ) => Partial<CompanionBankRequiredProps & CompanionBankAdditionalStyleProps> | void
  unsubscribe?: (
    feedback: Readonly<Omit<CompanionFeedbackEvent, 'options' | 'type'> & T>
  ) => Partial<CompanionBankRequiredProps & CompanionBankAdditionalStyleProps> | void
}

export type TwitchFeedback<T> = TwitchFeedbackBoolean<T> | TwitchFeedbackAdvanced<T>

export function getFeedbacks(instance: TwitchInstance): TwitchFeedbacks {
  return {
    channelStatus: {
      type: 'boolean',
      label: 'Channel Status',
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
        color: instance.rgb(0, 0, 0),
        bgcolor: instance.rgb(0, 255, 0),
      },
      callback: (feedback, _bank): boolean => {
        const selection = feedback.options.channel === 'selected' ? instance.selectedChannel : feedback.options.channel
        const channel = instance.channels.find((data) => data.username === selection)

        return channel !== undefined && channel?.live !== false
      },
    },

    chatStatus: {
      type: 'boolean',
      label: 'Chat Status',
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
        },
      ],
      style: {
        color: instance.rgb(0, 0, 0),
        bgcolor: instance.rgb(255, 0, 0),
      },
      callback: (feedback, _bank): boolean => {
        const selection = feedback.options.channel === 'selected' ? instance.selectedChannel : feedback.options.channel
        const channel = instance.channels.find((data) => data.username === selection)
        if (channel && channel.chatModes[feedback.options.mode]) {
          if (feedback.options.mode === 'followers')
            return feedback.options.value === channel.chatModes[feedback.options.mode]
          if (feedback.options.mode === 'slow')
            return feedback.options.value === channel.chatModes[feedback.options.mode]
          return true
        }
        return false
      },
    },
  }
}

/*



*/
