import VMixInstance from './index'
import { ActionCallbacks } from './actions'
import { FeedbackCallbacks } from './feedback'

type PresetCategory = ''

export interface TwitchPreset {
  category: PresetCategory
  label: string
  bank: {
    style: 'text'
    text: string
    size: 'auto' | '7' | '14' | '18' | '24' | '30' | '44'
    color: number
    bgcolor: number
  }
  actions: ActionCallbacks[]
  release_actions?: ActionCallbacks[]
  feedbacks: FeedbackCallbacks[]
}

export function getPresets(_instance: VMixInstance): TwitchPreset[] {
  return []
}
