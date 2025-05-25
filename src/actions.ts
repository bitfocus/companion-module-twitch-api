import { CompanionActionEvent, SomeCompanionActionInputField } from '@companion-module/base'
import TwitchInstance from './index'
import open from 'open'

export interface TwitchActions {
  // API
  adStart: TwitchAction<AdStartCallback>
  createPoll: TwitchAction<CreatePollCallback>
  endPoll: TwitchAction<EndPollCallback>
  endPrediction: TwitchAction<EndPrediction>
  marker: TwitchAction<MarkerCallback>
  request: TwitchAction<RequestCallback>

  // Chat
  clearChat: TwitchAction<ClearChatCallback>
  resetChatTotal: TwitchAction<ResetChatTotalCallback>
  chatModeEmote: TwitchAction<ChatModeEmoteCallback>
  chatModeFollowers: TwitchAction<ChatModeFollowersCallback>
  chatModeSlow: TwitchAction<ChatModeSlowCallback>
  chatModeSub: TwitchAction<ChatModeSubCallback>
  chatModeUnique: TwitchAction<ChatModeUniqueCallback>

  // Util
  selectChannel: TwitchAction<SelectChannelCallback>
  streamOpen: TwitchAction<StreamOpenCallback>

  // Index signature
  [key: string]: TwitchAction<any>
}

interface AdStartCallback {
  actionId: 'adStart'
  options: {
    length: '30' | '60' | '90' | '120' | '150' | '180'
  }
}

interface CreatePollCallback {
  actionId: 'createPoll'
  options: {
    title: string
    choice1: string
    choice2: string
    choice3: string
    choice4: string
    choice5: string
    duration: string
    channelPoints: boolean
    channelPointsValue: string
  }
}

interface EndPollCallback {
  actionId: 'endPoll'
  options: {
    status: 'TERMINATED' | 'ARCHIVED'
  }
}

interface EndPrediction {
  actionId: 'endPrediction'
  options: {
    status: 'RESOLVED' | 'CANCELED' | 'LOCKED'
    outcome: string
  }
}

interface MarkerCallback {
  actionId: 'marker'
  options: {
    channel: string
  }
}

interface RequestCallback {
  actionId: 'request'
  options: {
    url: string
    method: 'get' | 'put' | 'post'
    body: string
  }
}

interface ClearChatCallback {
  actionId: 'clearChat'
  options: {
    channel: string
  }
}

interface ChatModeEmoteCallback {
  actionId: 'chatModeEmote'
  options: {
    channel: string
  }
}

interface ChatModeFollowersCallback {
  actionId: 'chatModeFollowers'
  options: {
    channel: string
    length: string
  }
}

interface ChatModeSlowCallback {
  actionId: 'chatModeSlow'
  options: {
    channel: string
    length: number
  }
}

interface ChatModeSubCallback {
  actionId: 'chatModeSub'
  options: {
    channel: string
  }
}

interface ChatModeUniqueCallback {
  actionId: 'chatModeUnique'
  options: {
    channel: string
  }
}

interface ResetChatTotalCallback {
  actionId: 'resetChatTotal'
  options: {
    channel: string
  }
}

interface SelectChannelCallback {
  actionId: 'selectChannel'
  options: {
    channel: string
  }
}

interface StreamOpenCallback {
  actionId: 'streamOpen'
  options: {
    channel: string
  }
}

export type ActionCallbacks =
  | AdStartCallback
  | CreatePollCallback
  | EndPollCallback
  | EndPrediction
  | MarkerCallback
  | RequestCallback
  | ClearChatCallback
  | ChatModeEmoteCallback
  | ChatModeFollowersCallback
  | ChatModeSlowCallback
  | ChatModeSubCallback
  | ChatModeUniqueCallback
  | ResetChatTotalCallback
  | SelectChannelCallback
  | StreamOpenCallback

// Force options to have a default to prevent sending undefined values
type InputFieldWithDefault = Exclude<SomeCompanionActionInputField, 'default'> & {
  default: string | number | boolean | null
}

// Actions specific to Twitch
export interface TwitchAction<T> {
  name: string
  description?: string
  options: InputFieldWithDefault[]
  callback: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void | Promise<void>
  subscribe?: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void
  unsubscribe?: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void
}

export function getActions(instance: TwitchInstance): TwitchActions {
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
          default: '30',
          choices: [
            { id: '30', label: '30' },
            { id: '60', label: '60' },
            { id: '90', label: '90' },
            { id: '120', label: '120' },
            { id: '150', label: '150' },
            { id: '180', label: '180' },
          ],
        },
      ],
      callback: (action) => {
        instance.API.startCommercial(instance, action.options.length)
      },
    },

    createClip: {
      name: 'Create a Clip',
			description: 'Once created the results will be stored in the clip_id, clip_url, and clip_edit_url variables',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.API.createClip(instance, selection)
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
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 1',
          id: 'choice1',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 2',
          id: 'choice2',
          default: '',
          useVariables: true,
        },
        {
          type: 'textinput',
          label: 'Choice 3',
          id: 'choice3',
          default: '',
          useVariables: true,
          isVisible: (options) => options.choice1 !== '' && options.choice2 !== '',
        },
        {
          type: 'textinput',
          label: 'Choice 4',
          id: 'choice4',
          default: '',
          useVariables: true,
          isVisible: (options) => options.choice1 !== '' && options.choice2 !== '' && options.choice3 !== '',
        },
        {
          type: 'textinput',
          label: 'Choice 5',
          id: 'choice5',
          default: '',
          useVariables: true,
          isVisible: (options) => options.choice1 !== '' && options.choice2 !== '' && options.choice3 !== '' && options.choice4 !== '',
        },
        {
          type: 'textinput',
          label: 'Duration (seconds, 15 to 1800)',
          id: 'duration',
          default: '15',
          useVariables: true,
        },
        {
          type: 'checkbox',
          label: 'Channel Points Voting',
          id: 'channelPoints',
          default: false,
        },
        {
          type: 'textinput',
          label: 'Channel Points per vote (1 to 1000000)',
          id: 'channelPointsValue',
          default: '100',
          useVariables: true,
          isVisible: (options) => options.channelPoints === true,
        },
      ],
      callback: async (action) => {
        const [title, choice1, choice2, choice3, choice4, choice5, duration, channelPointsValue] = await Promise.all([
          instance.parseVariablesInString(action.options.title),
          instance.parseVariablesInString(action.options.choice1),
          instance.parseVariablesInString(action.options.choice2),
          instance.parseVariablesInString(action.options.choice3),
          instance.parseVariablesInString(action.options.choice4),
          instance.parseVariablesInString(action.options.choice5),
          instance.parseVariablesInString(action.options.duration),
          instance.parseVariablesInString(action.options.channelPointsValue),
        ])

        const choices = [choice1, choice2]
        if (action.options.choice3) {
          choices.push(choice3)
          if (action.options.choice4) {
            choices.push(choice4)
            if (action.options.choice5) {
              choices.push(choice5)
            }
          }
        }

        const parsedDuration = parseInt(duration)

        if (isNaN(parsedDuration)) {
          instance.log('warn', `Duration ${duration} is invalid`)
          return
        }

        const parsedPointsValue = parseInt(channelPointsValue)

        if (isNaN(parsedPointsValue)) {
          instance.log('warn', `Channel Points per vote ${channelPointsValue} is invalid`)
          return
        }

        return instance.API.createPoll(instance, { title, choices, duration: parsedDuration, pointsVoting: action.options.channelPoints, pointsValue: parsedPointsValue })
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
        const outcome = await instance.parseVariablesInString(action.options.outcome)
        return instance.API.endPrediction(instance, action.options.status, outcome)
      },
    },

    marker: {
      name: 'Create Stream Marker',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
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
          ],
        },
        {
          type: 'textinput',
          label: 'Body',
          id: 'body',
          default: '',
        },
      ],
      callback: (action) => {
        instance.API.customRequest(instance, action.options.method, action.options.url, action.options.body)
      },
    },

    // Chat
    chatMessage: {
      name: 'Send a message to chat',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
        {
          type: 'textinput',
          label: 'Message',
          id: 'message',
          default: '',
          useVariables: true,
        },
      ],
      callback: async (action) => {
        const message = await instance.parseVariablesInString(action.options.message)
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '' && message !== '') {
          instance.chat.message('#' + selection, message)
        }
      },
    },

    clearChat: {
      name: 'Clear Chat',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.API.deleteChatMessages(instance, selection)
      },
    },

    chatModeEmote: {
      name: 'Toggle emote only mode',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((x) => x.username === selection)

        if (selection !== '') {
          instance.API.updateChatSettings(instance, selection, 'emote_mode', !channel?.chatModes.emote)
        }
      },
    },

    chatModeFollowers: {
      name: 'Toggle followers only mode',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
        {
          type: 'textinput',
          label: 'Follow length minutes',
          id: 'length',
          default: '10',
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const length = action.options.length.replace('m', '')

        if (selection !== '') {
          instance.API.updateChatSettings(instance, selection, 'follower_mode_duration', length)
        }
      },
    },

    chatModeSlow: {
      name: 'Toggle slow mode',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
        {
          type: 'number',
          label: 'Slow mode length (0 for off)',
          id: 'length',
          default: 30,
          min: 0,
          max: 3600000,
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel

        if (selection !== '') {
          instance.API.updateChatSettings(instance, selection, 'slow_mode_wait_time', action.options.length)
        }
      },
    },

    chatModeSub: {
      name: 'Toggle sub only mode',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((x) => x.username === selection)

        if (selection !== '') {
          instance.API.updateChatSettings(instance, selection, 'subscriber_mode', !channel?.chatModes.sub)
        }
      },
    },

    chatModeUnique: {
      name: 'Toggle unique chat (r9k) mode',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((x) => x.username === selection)

        if (selection !== '') {
          instance.API.updateChatSettings(instance, selection, 'unique_chat_mode', !channel?.chatModes.unique)
        }
      },
    },

    resetChatTotal: {
      name: 'Reset Chat Total',
      description: 'Sets the total chat activity to 0',
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        const channel = instance.channels.find((data) => data.username === selection)

        if (channel) {
          instance.log('debug', `Resetting ${channel.displayName} Chat total of ${channel.chatActivity.total}`)
          channel.chatActivity.total = 0
          instance.variables.updateVariables()
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
      options: [
        {
          type: 'dropdown',
          label: 'Channel',
          id: 'channel',
          default: 'selected',
          choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
        },
      ],
      callback: (action) => {
        const channel = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (channel === '') return

        open(`https://twitch.tv/${channel}`)
      },
    },
  }
}
