import type { CompanionStaticUpgradeScript, CompanionStaticUpgradeResult } from '@companion-module/base'
import type { Config } from './config.js'

const upgradeV5_0_0: CompanionStaticUpgradeScript<Config> = (_context, props): CompanionStaticUpgradeResult<Config, undefined> => {
  const changes: CompanionStaticUpgradeResult<Config, undefined> = {
    updatedConfig: null,
    updatedSecrets: null,
    updatedActions: [],
    updatedFeedbacks: [],
  }

  for (const action of props.actions) {
    if (action.actionId === 'adStart') {
      action.options.duration = { isExpression: false, value: parseInt(action.options.duration?.value as string) }
    } else if (action.actionId === 'createClip') {
      action.options.duration = { isExpression: false, value: parseFloat((action.options.duration?.value || '30') as string) }
    } else if (action.actionId === 'createClipVOD') {
      action.options.offset = { isExpression: false, value: parseInt((action.options.offset?.value || '0') as string) }
      action.options.duration = { isExpression: false, value: parseFloat((action.options.duration?.value || '30') as string) }
    } else if (action.actionId === 'createPoll') {
      action.options.duration = { isExpression: false, value: parseFloat((action.options.duration?.value || '30') as string) }
      action.options.channelPointsValue = { isExpression: false, value: parseFloat((action.options.channelPointsValue?.value || '100') as string) }
    } else if (action.actionId === 'chatModeFollowers') {
      const oldLength = ((action.options.duration?.value as string) || '10').replace('m', '')
      action.options.length = { isExpression: false, value: parseInt(oldLength) }
    }
  }

  return changes
}

export const getUpgrades: CompanionStaticUpgradeScript<Config>[] = [upgradeV5_0_0]
