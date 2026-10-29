import type { CompanionFeedbackSchema, CompanionFeedbackDefinitions } from '@companion-module/base'
import type TwitchInstance from './index.js'

export type FeedbacksSchema = {
  channelStatus: CompanionFeedbackSchema<{
    channel: string
  }>
  chatStatus: CompanionFeedbackSchema<{
    channel: string
    mode: 'emote' | 'followers' | 'slow' | 'sub' | 'unique'
    value: string
  }>
}

export function getFeedbacks(instance: TwitchInstance): CompanionFeedbackDefinitions<FeedbacksSchema> {
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
      defaultStyle: {
        color: 0x000000,
        bgcolor: 0x00ff00,
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
          isVisibleExpression: `$(options:mode) == 'slow'`,
        },
      ],
      defaultStyle: {
        color: 0x000000,
        bgcolor: 0xff0000,
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
