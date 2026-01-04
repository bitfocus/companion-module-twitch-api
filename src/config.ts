import type { SomeCompanionConfigField } from '@companion-module/base'
import type TwitchInstance from './index'

export interface Config {
  accessToken: string
  refreshToken: string
  channels: string
  broadcasterAds: boolean
  broadcasterBits: boolean
  broadcasterChannelPoints: boolean
  broadcasterCharity: boolean
  broadcasterGoals: boolean
  broadcasterExtensions: boolean
  broadcasterHypeTrain: boolean
  broadcasterModeration: boolean
  broadcasterPollsPredictions: boolean
  broadcasterRaids: boolean
  broadcasterStreamKey: boolean
  broadcasterGuestStar: boolean
  broadcasterSubscriptions: boolean
  broadcasterVIPs: boolean
  editorStreamMarkers: boolean
	editorCreateClips: boolean
  moderatorAnnouncements: boolean
  moderatorAutomod: boolean
  moderatorChatModeration: boolean
  moderatorChatters: boolean
  moderatorFollowers: boolean
  moderatorShieldMode: boolean
  moderatorShoutouts: boolean
  moderatorGuestStar: boolean
  moderatorUnbanRequests: boolean
  moderatorWarnings: boolean
  userChat: boolean
  userClips: boolean
}

export const getConfigFields = (instance: TwitchInstance): SomeCompanionConfigField[] => {
  return [
    {
      type: 'textinput',
      label: `Channels to monitor - Space separated. (These are the channels that will be connected to Chat, and perform actions based on if you're the Broadcaster, Moderator, or User)`,
      id: 'channels',
      width: 12,
      default: '',
    },

    {
      type: 'static-text',
      id: 'auth-info',
      width: 12,
      label: 'Authentication',
      value: `The Twitch API restricts various API endpoints to being only usable by the Broadcaster, by Moderators, or by any user. If you wish to use the Broadcaster endpoints for multiple channels 
			you will need to add multiple Twitch connections in Companion and authenticate each one to a different Broadcaster.
			<br /><br />
			To Authenticate with Twitch select the following permissions you wish to grant Companion access to utilize, save the changes, and then go to the <a href="./instance/${instance.label}/auth" target="_blank">Auth URL</a> 
			<br /><br />
			`,
    },

    {
      type: 'static-text',
      id: 'broadcaster-info',
      width: 12,
      label: 'Broadcaster Permissions',
      value: `Required to perform actions and get data on the channel going through the Authentication process`,
    },
    {
      type: 'checkbox',
      label: 'Ads',
      id: 'broadcasterAds',
      width: 4,
      default: true,
      // channel:read:ads channel:manage:ads channel:edit:commercial
    },
    {
      type: 'checkbox',
      label: 'Bits',
      id: 'broadcasterBits',
      width: 4,
      default: true,
      // bits:read
    },
    {
      type: 'checkbox',
      label: 'Channel Points',
      id: 'broadcasterChannelPoints',
      width: 4,
      default: true,
      // channel:manage:redemptions
    },
    {
      type: 'checkbox',
      label: 'Charity Campaign',
      id: 'broadcasterCharity',
      width: 4,
      default: true,
      // channel:read:charity
    },
    {
      type: 'checkbox',
      label: 'Creator Goals',
      id: 'broadcasterGoals',
      width: 4,
      default: true,
      // channel:read:goals
    },
    {
      type: 'checkbox',
      label: 'Extensions',
      id: 'broadcasterExtensions',
      width: 4,
      default: true,
      // channel:manage:extensions
    },
    {
      type: 'checkbox',
      label: 'Hype Train',
      id: 'broadcasterHypeTrain',
      width: 4,
      default: true,
      // channel:read:hype_train
    },
    {
      type: 'checkbox',
      label: 'Moderation',
      id: 'broadcasterModeration',
      width: 4,
      default: true,
      // channel:moderate moderation:read
    },
    {
      type: 'checkbox',
      label: 'Polls & Predictions',
      id: 'broadcasterPollsPredictions',
      width: 4,
      default: true,
      // channel:manage:polls channel:manage:predictions
    },
    {
      type: 'checkbox',
      label: 'Raids',
      id: 'broadcasterRaids',
      width: 4,
      default: true,
      // channel:manage:raids
    },
    {
      type: 'checkbox',
      label: 'Stream Key',
      id: 'broadcasterStreamKey',
      width: 4,
      default: true,
      // channel:read:stream_key
    },
    {
      type: 'checkbox',
      label: 'Stream Together',
      id: 'broadcasterGuestStar',
      width: 4,
      default: true,
      // channel:read:guest_star channel:manage:guest_star
    },
    {
      type: 'checkbox',
      label: 'Subscriptions',
      id: 'broadcasterSubscriptions',
      width: 4,
      default: true,
      // channel:read:subscriptions
    },
    {
      type: 'checkbox',
      label: 'VIPs',
      id: 'broadcasterVIPs',
      width: 4,
      default: true,
      // channel:manage:vips
    },

    {
      type: 'static-text',
      id: 'editor-info',
      width: 12,
      label: 'Editor Permissions',
      value: `Required to perform actions on the channel going through the Authentication process, and as an Editor on other channels`,
    },
    {
      type: 'checkbox',
      label: 'Stream Info and Markers',
      id: 'editorStreamMarkers',
      width: 4,
      default: true,
      // channel:manage:broadcast
    },
    {
      type: 'checkbox',
      label: 'Create Clips from VOD',
      id: 'editorCreateClips',
      width: 4,
      default: true,
      // channel:manage:clips
    },
		
    {
      type: 'static-text',
      id: 'mod-info',
      width: 12,
      label: 'Moderator Permissions',
      value: `Required to perform actions on the channel going through the Authentication process, and any channel that user is a moderator for`,
      // user:read:moderated_channels if any mod permissions are checked
    },
    {
      type: 'checkbox',
      label: 'Announcements',
      id: 'moderatorAnnouncements',
      width: 4,
      default: true,
      // moderator:manage:announcements
    },
    {
      type: 'checkbox',
      label: 'Automod',
      id: 'moderatorAutomod',
      width: 4,
      default: true,
      // moderator:manage:automod moderator:read:automod_settings moderator:read:automod_settings moderator:manage:automod_settings
    },
    {
      type: 'checkbox',
      label: 'Chat Moderation',
      id: 'moderatorChatModeration',
      width: 4,
      default: true,
      // moderator:manage:banned_users moderator:manage:blocked_terms moderator:manage:chat_messages moderator:manage:chat_settings moderator:read:suspicious_users
    },
    {
      type: 'checkbox',
      label: 'Chatter Count',
      id: 'moderatorChatters',
      width: 4,
      default: true,
      // moderator:read:chatters
    },
    {
      type: 'checkbox',
      label: 'Followers',
      id: 'moderatorFollowers',
      width: 4,
      default: true,
      // moderator:read:followers
    },
    {
      type: 'checkbox',
      label: 'Shield Mode',
      id: 'moderatorShieldMode',
      width: 4,
      default: true,
      // moderator:read:shield_mode moderator:manage:shield_mode
    },
    {
      type: 'checkbox',
      label: 'Shoutouts',
      id: 'moderatorShoutouts',
      width: 4,
      default: true,
      // moderator:manage:shoutouts
    },
    {
      type: 'checkbox',
      label: 'Stream Together',
      id: 'moderatorGuestStar',
      width: 4,
      default: true,
      // moderator:read:guest_star  moderator:manage:guest_star
    },
    {
      type: 'checkbox',
      label: 'Unban Requests',
      id: 'moderatorUnbanRequests',
      width: 4,
      default: true,
      // moderator:read:unban_requests moderator:manage:unban_requests
    },
    {
      type: 'checkbox',
      label: 'Warnings',
      id: 'moderatorWarnings',
      width: 4,
      default: true,
      // moderator:read:warnings moderator:manage:warnings
    },

    {
      type: 'static-text',
      id: 'user-info',
      width: 12,
      label: 'User Permissions',
      value: `Required to perform actions as the user going through the Authentication process`,
    },
    {
      type: 'checkbox',
      label: 'Chat Read & Write',
      id: 'userChat',
      width: 4,
      default: true,
      // user:read:chat chat:read user:write:chat chat:edit user:manage:chat_color
    },
    {
      type: 'checkbox',
      label: 'Create Clips',
      id: 'userClips',
      width: 4,
      default: true,
      // clips:edit
    },
  ]
}
