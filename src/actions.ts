import { type CompanionActionDefinitions, type CompanionActionSchema, createModuleLogger } from '@companion-module/base'
import open from 'open'
import type TwitchInstance from './index.js'
import type { ClipOptions } from './api/createClip.js'
import type { ClipVODOptions } from './api/createClipVOD.js'
import { options } from './utils.js'

export type ActionsSchema = {
  adStart: CompanionActionSchema<
    {
      length: number
    },
    void
  >
  createClip: CompanionActionSchema<
    {
      channel: string
      title: string
      duration: number
    },
    void
  >
  createClipVOD: CompanionActionSchema<
    {
      channel: string
      vodID: string
      offset: number
      duration: number
      title: string
    },
    void
  >
  createPoll: CompanionActionSchema<
    {
      title: string
      choice1: string
      choice2: string
      choice3: string
      choice4: string
      choice5: string
      duration: number
      channelPoints: boolean
      channelPointsValue: number
    },
    void
  >
  endPoll: CompanionActionSchema<
    {
      status: 'TERMINATED' | 'ARCHIVED'
    },
    void
  >
  endPrediction: CompanionActionSchema<
    {
      status: 'RESOLVED' | 'CANCELED' | 'LOCKED'
      outcome: string
    },
    void
  >
  marker: CompanionActionSchema<
    {
      channel: string
    },
    void
  >
  request: CompanionActionSchema<
    {
      url: string
      method: 'get' | 'put' | 'post' | 'patch' | 'delete'
      body: string
    },
    void
  >

  // Chat
  chatMessage: CompanionActionSchema<
    {
      channel: string
      message: string
    },
    void
  >
  clearChat: CompanionActionSchema<
    {
      channel: string
    },
    void
  >
  resetChatTotal: CompanionActionSchema<
    {
      channel: string
    },
    void
  >
  chatModeEmote: CompanionActionSchema<
    {
      channel: string
    },
    void
  >
  chatModeFollowers: CompanionActionSchema<
    {
      channel: string
      length: number
    },
    void
  >
  chatModeSlow: CompanionActionSchema<
    {
      channel: string
      length: number
    },
    void
  >
  chatModeSub: CompanionActionSchema<
    {
      channel: string
    },
    void
  >
  chatModeUnique: CompanionActionSchema<
    {
      channel: string
    },
    void
  >

  // Util
  selectChannel: CompanionActionSchema<
    {
      channel: string
    },
    void
  >
  streamOpen: CompanionActionSchema<
    {
      channel: string
    },
    void
  >
}

const log = createModuleLogger('Actions')

export function getActions(instance: TwitchInstance): CompanionActionDefinitions<ActionsSchema> {
  return {
    // API
    adStart: {
      name: 'Start a channel commercial',
      description: 'Requires user to be Affiliate or Partner',
      options: [
        {
          type: 'dropdown',
          label: 'Duration',
          id: 'length',
          description: 'Duration in seconds',
          default: 30,
          choices: [
            { id: 30, label: '30' },
            { id: 60, label: '60' },
            { id: 90, label: '90' },
            { id: 120, label: '120' },
            { id: 150, label: '150' },
            { id: 180, label: '180' },
          ],
          allowInvalidValues: true,
        },
      ],
      callback: async (action) => {
        return instance.API.startCommercial(instance, action.options.length.toString())
      },
    },

    createClip: {
      name: 'Create a Clip',
      description: 'Once created the results will be stored in the clip_id, clip_url, and clip_edit_url variables',
      options: [
        options.channelSelect(instance),
        {
          type: 'textinput',
          label: 'Title',
          id: 'title',
          description: 'The title of the clip',
          default: '',
          useVariables: true,
        },
        {
          type: 'number',
          label: 'Duration',
          id: 'duration',
          description: 'The length of the clip in seconds',
          default: 30,
          min: 0,
          max: 60,
        },
      ],
      callback: async (action) => {
        const channel = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel

        const options: ClipOptions = {
          channel,
        }

        if (action.options.title) options.title = action.options.title
        if (action.options.duration && !isNaN(action.options.duration)) {
          options.duration = action.options.duration
        }

        if (channel !== '') return instance.API.createClip(instance, options)
      },
    },

    createClipVOD: {
      name: 'Create a Clip from VOD',
      description: 'Once created the results will be stored in the clip_id, clip_url, and clip_edit_url variables',
      options: [
        options.channelSelect(instance),
        {
          type: 'textinput',
          label: 'VOD ID',
          id: 'vodID',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Title',
          id: 'title',
          tooltip: 'The title of the clip',
          default: '',
          useVariables: true,
        },
        {
          type: 'number',
          label: 'Offset (where the clip ends)',
          id: 'offset',
          tooltip: 'Point in time in the VOD (in seconds) when the Clip is to end',
          default: 0,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          step: 1,
        },
        {
          type: 'number',
          label: 'Duration',
          id: 'duration',
          description: 'The length of the clip in seconds',
          default: 30,
          min: 0,
          max: 60,
        },
      ],
      callback: async (action) => {
        const channel = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel

        const options: ClipVODOptions = {
          channel,
          vodID: action.options.vodID,
          title: action.options.title,
          offset: action.options.offset,
          duration: action.options.duration,
        }

        if (isNaN(options.offset) || isNaN(options.duration) || options.offset < options.duration) {
          log.warn(`Invalid Offset or Duration for creating clips`)
          return
        }

        if (channel !== '') return instance.API.createClipVOD(instance, options)
      },
    },

    createPoll: {
      name: 'Create a Poll',
      description: 'Only available on current users Channel',
      options: [
        {
          type: 'textinput',
          label: 'Title',
          id: 'title',
          description: 'Title for the Poll',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 1',
          id: 'choice1',
          description: 'Poll Choice',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 2',
          id: 'choice2',
          description: 'Poll Choice',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 3',
          id: 'choice3',
          description: 'Poll Choice (leave blank if not used)',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 4',
          id: 'choice4',
          description: 'Poll Choice (leave blank if not used)',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 5',
          id: 'choice5',
          description: 'Poll Choice (leave blank if not used)',
          default: '',
          useVariables: true,
        },
        {
          type: 'number',
          label: 'Duration',
          id: 'duration',
          description: 'Durations in Seconds from 15 to 1800',
          default: 60,
          min: 15,
          max: 1800,
          step: 1,
        },
        {
          type: 'checkbox',
          label: 'Channel Points Voting',
          id: 'channelPoints',
          default: false,
        },
        {
          type: 'number',
          label: 'Channel Points per vote',
          id: 'channelPointsValue',
          description: 'Valid Values: 1 to 1000000',
          default: 100,
          min: 1,
          max: 1000000,
          step: 1,
        },
      ],
      callback: async (action) => {
        const title = action.options.title

        const choices = [action.options.choice1, action.options.choice2, action.options.choice3, action.options.choice4, action.options.choice5].filter((choice) => choice !== '')

        if (choices.length < 2) {
          log.warn('Creating Poll requires at least 2 choices')
          return
        }

        return instance.API.createPoll(instance, {
          title,
          choices,
          duration: action.options.duration,
          pointsVoting: action.options.channelPoints,
          pointsValue: action.options.channelPointsValue,
        })
      },
    },

    endPoll: {
      name: 'End current Poll',
      description: 'Only available on current users Channel',
      options: [
        {
          type: 'dropdown',
          label: 'Status',
          id: 'status',
          choices: [
            { id: 'TERMINATED', label: 'End Poll and show results' },
            { id: 'ARCHIVED', label: 'End Poll and archive results' },
          ],
          default: 'TERMINATED',
          expressionDescription: `Valid Values: 'TERMINATED' to end poll and show results or 'ARCHIVED' to end poll and archive results`,
        },
      ],
      callback: async (action) => {
        return instance.API.endPoll(instance, action.options.status)
      },
    },

    endPrediction: {
      name: 'End current Prediction',
      description: 'Only available on current users Channel',
      options: [
        {
          type: 'dropdown',
          label: 'Status',
          id: 'status',
          choices: [
            { id: 'RESOLVED', label: 'End Prediction with selected Outcome' },
            { id: 'CANCELED', label: 'Cancel Prediction and refund Channel Points' },
            { id: 'LOCKED', label: 'Lock a Prediction and prevent further voting' },
          ],
          default: 'RESOLVED',
          expressionDescription: `Valid Values: 'RESOLVED', 'CANCELED', or 'LOCKED'`,
        },
        {
          type: 'textinput',
          label: 'Winning Outcome',
          id: 'outcome',
          default: '',
          useVariables: true,
        },
      ],
      callback: async (action) => {
        return instance.API.endPrediction(instance, action.options.status, action.options.outcome)
      },
    },

    marker: {
      name: 'Create Stream Marker',
      options: [options.channelSelect(instance)],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.API.createStreamMarker(instance, selection)
      },
    },

    request: {
      name: 'Twitch API Request',
      description: 'Send an API request to Twitch with included OAuth headers',
      options: [
        {
          type: 'textinput',
          label: 'URL',
          id: 'url',
          default: '',
          useVariables: true,
        },
        {
          type: 'dropdown',
          label: 'Method',
          id: 'method',
          default: 'get',
          choices: [
            { id: 'get', label: 'GET' },
            { id: 'put', label: 'PUT' },
            { id: 'post', label: 'POST' },
            { id: 'patch', label: 'PATCH' },
            { id: 'delete', label: 'DELETE' },
          ],
          expressionDescription: `Valid Values: 'get', 'put', 'post', 'patch', or 'delete'`,
        },
        {
          type: 'textinput',
          label: 'Body',
          tooltip: 'JSON',
          id: 'body',
          default: '',
          useVariables: true,
        },
      ],
      callback: async (action) => {
        return instance.API.customRequest(instance, action.options.method, action.options.url, action.options.body)
      },
    },

    // Chat
    chatMessage: {
      name: 'Send a message to chat',
      options: [
        options.channelSelect(instance),
        {
          type: 'textinput',
          label: 'Message',
          id: 'message',
          default: '',
          useVariables: true,
        },
      ],
      callback: async (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '' && action.options.message !== '') {
          instance.chat.message('#' + selection, action.options.message)
        }
      },
    },

    clearChat: {
      name: 'Clear Chat',
      options: [options.channelSelect(instance)],
      callback: async (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') return instance.API.deleteChatMessages(instance, selection)
        return
      },
    },

    chatModeEmote: {
      name: 'Toggle emote only mode',
      options: [options.channelSelect(instance)],
      callback: async (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((x) => x.username === selection)

        if (selection !== '') {
          return instance.API.updateChatSettings(instance, selection, 'emote_mode', !channel?.chatModes.emote)
        }
        return
      },
    },

    chatModeFollowers: {
      name: 'Toggle followers only mode',
      options: [
        options.channelSelect(instance),
        {
          type: 'number',
          label: 'Follow length minutes',
          id: 'length',
          default: 10,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          step: 1,
        },
      ],
      callback: async (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel

        if (selection !== '') {
          return instance.API.updateChatSettings(instance, selection, 'follower_mode_duration', action.options.length)
        }
        return
      },
    },

    chatModeSlow: {
      name: 'Toggle slow mode',
      options: [
        options.channelSelect(instance),
        {
          type: 'number',
          label: 'Slow mode length (0 for off)',
          id: 'length',
          default: 30,
          min: 0,
          max: 3600000,
        },
      ],
      callback: async (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel

        if (selection !== '') {
          return instance.API.updateChatSettings(instance, selection, 'slow_mode_wait_time', action.options.length)
        }
        return
      },
    },

    chatModeSub: {
      name: 'Toggle sub only mode',
      options: [options.channelSelect(instance)],
      callback: async (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((x) => x.username === selection)

        if (selection !== '') {
          return instance.API.updateChatSettings(instance, selection, 'subscriber_mode', !channel?.chatModes.sub)
        }
        return
      },
    },

    chatModeUnique: {
      name: 'Toggle unique chat (r9k) mode',
      options: [options.channelSelect(instance)],
      callback: async (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((x) => x.username === selection)

        if (selection !== '') {
          return instance.API.updateChatSettings(instance, selection, 'unique_chat_mode', !channel?.chatModes.unique)
        }
        return
      },
    },

    resetChatTotal: {
      name: 'Reset Chat Total',
      description: 'Sets the total chat activity to 0',
      options: [options.channelSelect(instance)],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((data) => data.username === selection)

        if (channel) {
          log.debug(`Resetting ${channel.displayName} Chat total of ${channel.chatActivity.total}`)
          channel.chatActivity.total = 0
          return instance.variables.updateVariables()
        }
      },
    },

    // Util
    selectChannel: {
      name: 'Select Channel',
      description: '',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: instance.channels[0]?.username || '',
          choices: instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
        },
      ],
      callback: (action) => {
        instance.selectedChannel = action.options.channel
        instance.variables.updateVariables()
        instance.checkFeedbacks('chatStatus', 'channelStatus')
      },
    },

    streamOpen: {
      name: 'Open Channel',
      description: 'Opens Twitch stream in default browser on the machine running Companion',
      options: [options.channelSelect(instance)],
      callback: (action) => {
        const channel = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (channel === '') return

        open(`https://twitch.tv/${channel}`)
      },
    },
  }
}
