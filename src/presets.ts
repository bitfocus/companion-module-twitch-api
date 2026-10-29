import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'
import type TwitchInstance from './index.js'
import type { InstanceTypes } from './utils.js'

export function getPresetDefinitions(_instance: TwitchInstance): CompanionPresetDefinitions<InstanceTypes> {
  const presets: CompanionPresetDefinitions<InstanceTypes> = {}

  return presets
}

export const getPresetStructure: CompanionPresetSection<InstanceTypes>[] = []
