import { CompanionActionEventInfo, CompanionActionEvent, SomeCompanionInputField } from '../../../instance_skel_types'
import TwitchInstance from './index'
import open from 'open'
import { adStart, createMarker, request } from './api'

export interface TwitchActions {
  // API
  adStart: TwitchAction<AdStartCallback>
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
  action: 'adStart'
  options: {
    length: '30' | '60' | '90' | '120' | '150' | '180'
  }
}

interface MarkerCallback {
  action: 'marker'
  options: {
    channel: string
  }
}

interface RequestCallback {
  action: 'request'
  options: {
    url: string
    method: 'get' | 'put' | 'post'
    body: string
  }
}

interface ClearChatCallback {
  action: 'clearChat'
  options: {
    channel: string
  }
}

interface ChatModeEmoteCallback {
  action: 'chatModeEmote'
  options: {
    channel: string
  }
}

interface ChatModeFollowersCallback {
  action: 'chatModeFollowers'
  options: {
    channel: string
    length: string
  }
}

interface ChatModeSlowCallback {
  action: 'chatModeSlow'
  options: {
    channel: string
    length: number
  }
}

interface ChatModeSubCallback {
  action: 'chatModeSub'
  options: {
    channel: string
  }
}

interface ChatModeUniqueCallback {
  action: 'chatModeUnique'
  options: {
    channel: string
  }
}

interface ResetChatTotalCallback {
  action: 'resetChatTotal'
  options: {
    channel: string
  }
}

interface SelectChannelCallback {
  action: 'selectChannel'
  options: {
    channel: string
  }
}

interface StreamOpenCallback {
  action: 'streamOpen'
  options: {
    channel: string
  }
}

export type ActionCallbacks =
  | AdStartCallback
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
type InputFieldWithDefault = Exclude<SomeCompanionInputField, 'default'> & { default: string | number | boolean | null }

// Actions specific to Twitch
export interface TwitchAction<T> {
  label: string
  description?: string
  options: InputFieldWithDefault[]
  callback: (
    action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>,
    info: Readonly<CompanionActionEventInfo | null>
  ) => void
  subscribe?: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void
  unsubscribe?: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void
}

export function getActions(instance: TwitchInstance): TwitchActions {
  return {
    // API
    adStart: {
      label: 'Start a channel commercial',
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
        adStart(instance, action.options.length)
      },
    },

    marker: {
      label: 'Create Stream Marker',
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
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') createMarker(instance, selection)
      },
    },

    request: {
      label: 'Twitch API Request',
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
        request(instance, action.options.method, action.options.url, action.options.body)
      },
    },

    // Chat
    chatMessage: {
      label: 'Send a message to chat',
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
          type: 'textinput',
          label: 'Message',
          id: 'message',
          default: '',
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '' && action.options.message !== '') instance.chat.message(selection, action.options.message)
      },
    },

    clearChat: {
      label: 'Clear Chat',
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
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.chat.clearChat(selection)
      },
    },

    chatModeEmote: {
      label: 'Toggle emote only mode',
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
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.chat.chatMode(selection, 'emote')
      },
    },

    chatModeFollowers: {
      label: 'Toggle followers only mode',
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
          type: 'textinput',
          label: 'Follow length',
          id: 'length',
          default: '10m',
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.chat.chatMode(selection, 'followers', action.options.length)
      },
    },

    chatModeSlow: {
      label: 'Toggle slow mode',
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
        if (selection !== '') instance.chat.chatMode(selection, 'slow', action.options.length)
      },
    },

    chatModeSub: {
      label: 'Toggle sub only mode',
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
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.chat.chatMode(selection, 'sub')
      },
    },

    chatModeUnique: {
      label: 'Toggle unique chat (r9k) mode',
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
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.chat.chatMode(selection, 'unique')
      },
    },

    resetChatTotal: {
      label: 'Reset Chat Total',
      description: 'Sets the total chat actvity to 0',
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
      label: 'Select Channel',
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
      label: 'Open Channel',
      description: 'Opens Twitch stream in default browser',
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
      callback: (action) => {
        const channel = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (channel === '') return

        open(`https://twitch.tv/${channel}`)
      },
    },
  }
}
