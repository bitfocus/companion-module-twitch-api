import type { CompanionInputFieldDropdown } from '@companion-module/base'
import type TwitchInstance from './index.js'
import type { ActionsSchema } from './actions.js'
import type { Config } from './config.js'
import type { FeedbacksSchema } from './feedback.js'
import type { VariablesSchema } from './variables.js'

type TimeFormat = 'hh:mm:ss' | 'hh:mm:ss.ms' | 'mm:ss' | 'mm:ss.ms'

export interface Options {
  channelSelect: (instance: TwitchInstance) => CompanionInputFieldDropdown<'channel'>
}

export const options: Options = {
  channelSelect: (instance: TwitchInstance) => ({
    type: 'dropdown',
    label: 'Channel',
    id: 'channel',
    default: 'selected',
    choices: [{ id: 'selected', label: 'Selected' }, ...instance.channels.map((channel) => ({ id: channel.username, label: channel.displayName }))],
    expressionDescription: `Valid Values: 'selected', ${instance.channels.map((channel) => `'${channel.username}'`).join(', ')}`,
  }),
}

export const formatTime = (time: number, interval: 'ms' | 's', format: TimeFormat): string => {
  const timeMS = time * (interval === 'ms' ? 1 : 1000)
  const padding = (value: number): string => (value < 10 ? '0' + value : value.toString())

  const hh = padding(Math.floor(timeMS / 3600000))
  const mm = padding(Math.floor(timeMS / 60000) % 60)
  const ss = padding(Math.floor(timeMS / 1000) % 60)
  const ms = (timeMS % 1000) / 100

  const result = `${format.includes('hh') ? `${hh}:` : ''}${mm}:${ss}${format.includes('ms') ? `.${ms}` : ''}`
  return result
}

export const formatNumber = (x: number): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export interface InstanceTypes {
  config: Config
  secrets: undefined
  actions: ActionsSchema
  feedbacks: FeedbacksSchema
  variables: VariablesSchema
}
