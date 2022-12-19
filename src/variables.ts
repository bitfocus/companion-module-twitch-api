import VMixInstance from './'
import { formatNumber, formatTime } from './utils'

interface InstanceVariableDefinition {
  name: string
  variableId: string
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
   * @param variables Object of variablenames and their values
   * @description Updates or removes variable for current instance
   */
  public readonly set = (variables: InstanceVariableValue): void => {
    const newVariables: { [variableId: string]: string | undefined } = {}

    for (const name in variables) {
      newVariables[name] = variables[name]?.toString()
    }

    this.instance.setVariableValues(newVariables)
  }

  /**
   * @description Sets variable definitions
   */
  public readonly updateDefinitions = (): void => {
    const variables: Set<InstanceVariableDefinition> = new Set([])

    variables.add({ name: `Selected Channel`, variableId: `selected` })
    variables.add({ name: `Selected Channel Live`, variableId: `selected_live` })
    variables.add({ name: `Selected Channel Uptime`, variableId: `selected_uptime` })
    variables.add({ name: `Selected Channel Viewers`, variableId: `selected_viewers` })
    variables.add({ name: `Selected Channel Viewers (formatted)`, variableId: `selected_viewers_formatted` })
    variables.add({ name: `Selected Channel Chatters`, variableId: `selected_chatters` })
    variables.add({ name: `Selected Channel Chatters (formatted)`, variableId: `selected_chatters_formatted` })
    variables.add({ name: `Selected Channel Category`, variableId: `selected_category` })
    variables.add({ name: `Selected Channel Title`, variableId: `selected_title` })
    variables.add({ name: `Selected Channel Chat 1m Activity`, variableId: `selected_chat_activity_1m` })
    variables.add({ name: `Selected Channel Chat 5m Activity`, variableId: `selected_chat_activity_5m` })
    variables.add({ name: `Selected Channel Chat 15m Activity`, variableId: `selected_chat_activity_15m` })
    variables.add({ name: `Selected Channel Chat 60m Activity`, variableId: `selected_chat_activity_60m` })
    variables.add({ name: `Selected Channel Chat Total Activity`, variableId: `selected_chat_activity_total` })
    variables.add({ name: `Selected Channel Chat Emote Only`, variableId: `selected_chat_mode_emote` })
    variables.add({ name: `Selected Channel Chat Followers Only`, variableId: `selected_chat_mode_followers` })
    variables.add({ name: `Selected Channel Chat Slow Mode`, variableId: `selected_chat_mode_slow` })
    variables.add({ name: `Selected Channel Chat Sub Only`, variableId: `selected_chat_mode_sub` })
    variables.add({ name: `Selected Channel Chat Unique Mode`, variableId: `selected_chat_mode_unique` })

    this.instance.channels.forEach((channel) => {
      variables.add({ name: `${channel.displayName} Channel Live`, variableId: `${channel.username}_live` })
      variables.add({ name: `${channel.displayName} Channel Uptime`, variableId: `${channel.username}_uptime` })
      variables.add({ name: `${channel.displayName} Viewers`, variableId: `${channel.username}_viewers` })
      variables.add({
        name: `${channel.displayName} Viewers (formatted)`,
        variableId: `${channel.username}_viewers_formatted`,
      })
      variables.add({ name: `${channel.displayName} Chatters`, variableId: `${channel.username}_chatters` })
      variables.add({
        name: `${channel.displayName} Chatters (formatted)`,
        variableId: `${channel.username}_chatters_formatted`,
      })
      variables.add({ name: `${channel.displayName} Category`, variableId: `${channel.username}_category` })
      variables.add({ name: `${channel.displayName} Title`, variableId: `${channel.username}_title` })
      variables.add({ name: `${channel.displayName} Chat 1m Activity`, variableId: `${channel.username}_chat_activity_1m` })
      variables.add({ name: `${channel.displayName} Chat 5m Activity`, variableId: `${channel.username}_chat_activity_5m` })
      variables.add({
        name: `${channel.displayName} Chat 15m Activity`,
        variableId: `${channel.username}_chat_activity_15m`,
      })
      variables.add({
        name: `${channel.displayName} Chat 60m Activity`,
        variableId: `${channel.username}_chat_activity_60m`,
      })
      variables.add({
        name: `${channel.displayName} Chat Total Activity`,
        variableId: `${channel.username}_chat_activity_total`,
      })
      variables.add({
        name: `${channel.displayName} Channel Chat Emote Only`,
        variableId: `${channel.username}_chat_mode_emote`,
      })
      variables.add({
        name: `${channel.displayName} Channel Chat Followers Only`,
        variableId: `${channel.username}_chat_mode_followers`,
      })
      variables.add({
        name: `${channel.displayName} Channel Chat Slow Mode`,
        variableId: `${channel.username}_chat_mode_slow`,
      })
      variables.add({
        name: `${channel.displayName} Channel Chat Sub Only`,
        variableId: `${channel.username}_chat_mode_sub`,
      })
      variables.add({
        name: `${channel.displayName} Channel Chat Unique Mode`,
        variableId: `${channel.username}_chat_mode_unique`,
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
