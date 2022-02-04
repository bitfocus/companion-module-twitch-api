import VMixInstance from './'
import { formatNumber, formatTime } from './utils'

interface InstanceVariableDefinition {
  label: string
  name: string
  type?: string
}

interface InstanceVariableValue {
  [key: string]: string | number | undefined
}

export class Variables {
  private readonly instance: VMixInstance
  //private currentDefinitions: Set<InstanceVariableDefinition> = new Set()

  constructor(instance: VMixInstance) {
    this.instance = instance
  }

  /**
   * @param name Instance variable name
   * @returns Value of instance variable or undefined
   * @description Retrieves instance variable from any vMix instances
   */
  public readonly get = (variable: string): string | undefined => {
    let data

    this.instance.parseVariables(variable, (value) => {
      data = value
    })

    return data
  }

  /**
   * @param variables Object of variablenames and their values
   * @description Updates or removes variable for current instance
   */
  public readonly set = (variables: InstanceVariableValue): void => {
    const newVariables: { [variableId: string]: string | undefined } = {}

    for (const name in variables) {
      newVariables[name] = variables[name]?.toString()
    }

    this.instance.setVariables(newVariables)
    this.instance.checkFeedbacks('buttonText')
  }

  /**
   * @description Sets variable definitions
   */
  public readonly updateDefinitions = (): void => {
    const variables: Set<InstanceVariableDefinition> = new Set([])

    variables.add({ label: `Selected Channel`, name: `selected` })

    variables.add({ label: `Selected Channel Live`, name: `selected_live` })
    variables.add({ label: `Selected Channel Uptime`, name: `selected_uptime` })
    variables.add({ label: `Selected Channel Viewers`, name: `selected_viewers` })
    variables.add({ label: `Selected Channel Viewers (formatted)`, name: `selected_viewers_formatted` })
    variables.add({ label: `Selected Channel Chatters`, name: `selected_chatters` })
    variables.add({ label: `Selected Channel Chatters (formatted)`, name: `selected_chatters_formatted` })
    variables.add({ label: `Selected Channel Category`, name: `selected_category` })
    variables.add({ label: `Selected Channel Title`, name: `selected_title` })
    variables.add({ label: `Selected Channel Chat 1m Activity`, name: `selected_chat_activity_1m` })
    variables.add({ label: `Selected Channel Chat 5m Activity`, name: `selected_chat_activity_5m` })
    variables.add({ label: `Selected Channel Chat 15m Activity`, name: `selected_chat_activity_15m` })
    variables.add({ label: `Selected Channel Chat 60m Activity`, name: `selected_chat_activity_60m` })
    variables.add({ label: `Selected Channel Chat Total Activity`, name: `selected_chat_activity_total` })
    variables.add({ label: `Selected Channel Chat Emote Only`, name: `selected_chat_mode_emote` })
    variables.add({ label: `Selected Channel Chat Followers Only`, name: `selected_chat_mode_followers` })
    variables.add({ label: `Selected Channel Chat Slow Mode`, name: `selected_chat_mode_slow` })
    variables.add({ label: `Selected Channel Chat Sub Only`, name: `selected_chat_mode_sub` })
    variables.add({ label: `Selected Channel Chat Unique Mode`, name: `selected_chat_mode_unique` })

    this.instance.channels.forEach((channel) => {
      variables.add({ label: `${channel.displayName} Channel Live`, name: `${channel.username}_live` })
      variables.add({ label: `${channel.displayName} Channel Uptime`, name: `${channel.username}_uptime` })
      variables.add({ label: `${channel.displayName} Viewers`, name: `${channel.username}_viewers` })
      variables.add({
        label: `${channel.displayName} Viewers (formatted)`,
        name: `${channel.username}_viewers_formatted`,
      })
      variables.add({ label: `${channel.displayName} Chatters`, name: `${channel.username}_chatters` })
      variables.add({
        label: `${channel.displayName} Chatters (formatted)`,
        name: `${channel.username}_chatters_formatted`,
      })
      variables.add({ label: `${channel.displayName} Category`, name: `${channel.username}_category` })
      variables.add({ label: `${channel.displayName} Title`, name: `${channel.username}_title` })
      variables.add({ label: `${channel.displayName} Chat 1m Activity`, name: `${channel.username}_chat_activity_1m` })
      variables.add({ label: `${channel.displayName} Chat 5m Activity`, name: `${channel.username}_chat_activity_5m` })
      variables.add({
        label: `${channel.displayName} Chat 15m Activity`,
        name: `${channel.username}_chat_activity_15m`,
      })
      variables.add({
        label: `${channel.displayName} Chat 60m Activity`,
        name: `${channel.username}_chat_activity_60m`,
      })
      variables.add({
        label: `${channel.displayName} Chat Total Activity`,
        name: `${channel.username}_chat_activity_total`,
      })
      variables.add({
        label: `${channel.displayName} Channel Chat Emote Only`,
        name: `${channel.username}_chat_mode_emote`,
      })
      variables.add({
        label: `${channel.displayName} Channel Chat Followers Only`,
        name: `${channel.username}_chat_mode_followers`,
      })
      variables.add({
        label: `${channel.displayName} Channel Chat Slow Mode`,
        name: `${channel.username}_chat_mode_slow`,
      })
      variables.add({
        label: `${channel.displayName} Channel Chat Sub Only`,
        name: `${channel.username}_chat_mode_sub`,
      })
      variables.add({
        label: `${channel.displayName} Channel Chat Unique Mode`,
        name: `${channel.username}_chat_mode_unique`,
      })
    })

    this.instance.setVariableDefinitions([...variables])
  }

  /**
   * @description Update variables
   */
  public readonly updateVariables = (): void => {
    const newVariables: InstanceVariableValue = {}

    const selectedChannel = this.instance.channels.find((channel) => channel.username === this.instance.selectedChannel)
    newVariables[`selected`] = selectedChannel ? selectedChannel.displayName : ''

    this.instance.channels.forEach((channel) => {
      let activity1m = 0
      let activity5m = 0
      let activity15m = 0
      let activity60m = 0

      channel.chatActivity.recent.forEach((minute, index) => {
        if (index === 0) activity1m = minute
        if (index < 5) activity5m = activity5m + minute
        if (index < 15) activity15m = activity15m + minute
        activity60m = activity60m + minute
      })

      const calcUptime = (): string => {
        return channel.live === false ? '' : formatTime(new Date().getTime() - channel.live.getTime(), 'ms', 'hh:mm:ss')
      }

      newVariables[`${channel.username}_live`] = (channel.live !== false).toString()
      newVariables[`${channel.username}_uptime`] = calcUptime()
      newVariables[`${channel.username}_viewers`] = channel.viewers
      newVariables[`${channel.username}_viewers_formatted`] = formatNumber(channel.viewers)
      newVariables[`${channel.username}_chatters`] = channel.chatters
      newVariables[`${channel.username}_chatters_formatted`] = formatNumber(channel.chatters)
      newVariables[`${channel.username}_category`] = channel.category
      newVariables[`${channel.username}_title`] = channel.title
      newVariables[`${channel.username}_chat_activity_1m`] = activity1m
      newVariables[`${channel.username}_chat_activity_5m`] = activity5m
      newVariables[`${channel.username}_chat_activity_15m`] = activity15m
      newVariables[`${channel.username}_chat_activity_60m`] = activity60m
      newVariables[`${channel.username}_chat_activity_total`] = channel.chatActivity.total
      newVariables[`${channel.username}_chat_mode_emote`] = channel.chatModes.emote.toString()
      newVariables[`${channel.username}_chat_mode_followers`] = channel.chatModes.followers.toString()
      newVariables[`${channel.username}_chat_mode_slow`] = channel.chatModes.slow.toString()
      newVariables[`${channel.username}_chat_mode_sub`] = channel.chatModes.sub.toString()
      newVariables[`${channel.username}_chat_mode_unique`] = channel.chatModes.unique.toString()

      if (channel.username === this.instance.selectedChannel) {
        newVariables[`selected_live`] = (channel.live !== false).toString()
        newVariables[`selected_uptime`] = calcUptime()
        newVariables[`selected_viewers`] = channel.viewers
        newVariables[`selected_viewers_formatted`] = formatNumber(channel.viewers)
        newVariables[`selected_chatters`] = channel.chatters
        newVariables[`selected_chatters_formatted`] = formatNumber(channel.chatters)
        newVariables[`selected_category`] = channel.category
        newVariables[`selected_title`] = channel.title
        newVariables[`selected_chat_activity_1m`] = activity1m
        newVariables[`selected_chat_activity_5m`] = activity5m
        newVariables[`selected_chat_activity_15m`] = activity15m
        newVariables[`selected_chat_activity_60m`] = activity60m
        newVariables[`selected_chat_activity_total`] = channel.chatActivity.total
        newVariables[`selected_chat_activity_total`] = channel.chatActivity.total
        newVariables[`selected_chat_mode_emote`] = channel.chatModes.emote.toString()
        newVariables[`selected_chat_mode_followers`] = channel.chatModes.followers.toString()
        newVariables[`selected_chat_mode_slow`] = channel.chatModes.slow.toString()
        newVariables[`selected_chat_mode_sub`] = channel.chatModes.sub.toString()
        newVariables[`selected_chat_mode_unique`] = channel.chatModes.unique.toString()
      }
    })

    this.set(newVariables)
    this.updateDefinitions()
  }
}
