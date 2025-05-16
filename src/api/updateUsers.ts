import type TwitchInstance from '../index'

export const updateUsers = async (instance: TwitchInstance): Promise<void> => {
  if (!instance.auth.valid) return

  const logins = instance.channels.map((channel) => channel.username)
  const userData = await instance.API.getUsers(instance, { type: 'login', channels: logins })

  userData.forEach((user) => {
    const channel = instance.channels.find((channel) => channel?.username === user.login)
    if (!channel) return

    channel.displayName = user.display_name
    channel.id = user.id
  })

  const ids = instance.channels.map((channel) => channel.id).filter((channel) => channel !== '')
  const channelData = await instance.API.getChannels(instance, ids)

  channelData.forEach((data) => {
    const channel = instance.channels.find((channel) => channel.id === data.broadcaster_id)
    if (!channel) return

    channel.categoryID = data.game_id
    channel.categoryName = data.game_name
    channel.ccl = data.content_classification_labels
    channel.delay = data.delay
    channel.brandedContent = data.is_branded_content
    channel.title = data.title
  })

  return
}
