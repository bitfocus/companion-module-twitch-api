import { CompanionActionEvent, SomeCompanionActionInputField } from '@companion-module/base'
import TwitchInstance from './index'
import open from 'open'

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
  actionId: 'adStart'
  options: {
    length: '30' | '60' | '90' | '120' | '150' | '180'
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
type InputFieldWithDefault = Exclude<SomeCompanionActionInputField, 'default'> & { default: string | number | boolean | null }

// Actions specific to Twitch
export interface TwitchAction<T> {
  name: string
  description?: string
  options: InputFieldWithDefault[]
  callback: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void
  subscribe?: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void
  unsubscribe?: (action: Readonly<Omit<CompanionActionEvent, 'options' | 'id'> & T>) => void
}

export function getActions(instance: TwitchInstance): TwitchActions {
  return {
    // API
    adStart: {
      name: 'Start a channel commercial',
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
        instance.API.startCommercial(action.options.length)
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
          choices: [
            { id: 'selected', label: 'Selected' },
            ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
          ],
        },
      ],
      callback: (action) => {
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.API.createStreamMarker(selection)
      },
    },

    request: {
      name: 'Twitch API Request',
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
          default: ''
        },
      ],
      callback: (action) => {
        instance.API.request(action.options.method, action.options.url, action.options.body)
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
        instance.chat.message('distbot', 'test')
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '' && action.options.message !== '') instance.chat.message(selection, action.options.message)
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
          choices: [
            { id: 'selected', label: 'Selected' },
            ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName })),
          ],
        },
      ],
      callback: (action) => {
        instance.API.sendChatAnnouncement('thedist', 'test', 'primary')

        return
        const selection = action.options.channel === 'selected' ? instance.selectedChannel : action.options.channel
        if (selection !== '') instance.chat.clearChat(selection)
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
      name: 'Toggle followers only mode',
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
      name: 'Toggle slow mode',
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
      name: 'Toggle sub only mode',
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
      name: 'Toggle unique chat (r9k) mode',
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
      name: 'Reset Chat Total',
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

        if (false === null) open(`https://twitch.tv/${channel}`)

        instance.API.getChatSettings()
      },
    },
  }
}
