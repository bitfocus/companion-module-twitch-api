import { createClip } from './createClip'
import { createPoll } from './createPoll'
import { createPrediction } from './createPrediction'
import { createStreamMarker } from './createStreamMarker'
import { customRequest } from './customRequest'
import { deleteChatMessages } from './deleteChatMessages'
import { endPoll } from './endPoll'
import { endPrediction } from './endPrediction'
import { getAdSchedule } from './getAdSchedule'
import { getBroadcasterSubscriptions } from './getBroadcasterSubscriptions'
import { getChannelFollowers } from './getChannelFollowers'
import { getChannels } from './getChannels'
import { getCharityCampaign } from './getCharityCampaign'
import { getChatSettings } from './getChatSettings'
import { getChatters } from './getChatters'
import { getCreatorGoals } from './getCreatorGoals'
import { getGames } from './getGames'
import { getModeratedChannels } from './getModeratedChannels'
import { getPolls } from './getPolls'
import { getPredictions } from './getPredictions'
import { getShieldModeStatus } from './getShieldModeStatus'
import { getStreams } from './getStreams'
import { getUsers } from './getUsers'
import { modifyChannelInformation } from './modifyChannelInformation'
import { sendChatAnnouncement } from './sendChatAnnouncement'
import { snoozeNextAd } from './snoozeNextAd'
import { startARaid } from './startARaid'
import { startCommercial } from './startCommercial'
import { updateChatSettings } from './updateChatSettings'
import { updateUsers } from './updateUsers'

export default class Endpoints {
  createClip = createClip
  createPoll = createPoll
  createPrediction = createPrediction
  createStreamMarker = createStreamMarker
  customRequest = customRequest
  deleteChatMessages = deleteChatMessages
  endPoll = endPoll
  endPrediction = endPrediction
  getAdSchedule = getAdSchedule
  getBroadcasterSubscriptions = getBroadcasterSubscriptions
  getChannelFollowers = getChannelFollowers
  getChannels = getChannels
  getCharityCampaign = getCharityCampaign
  getChatSettings = getChatSettings
  getChatters = getChatters
  getCreatorGoals = getCreatorGoals
  getGames = getGames
  getModeratedChannels = getModeratedChannels
  getPolls = getPolls
  getPredictions = getPredictions
  getShieldModeStatus = getShieldModeStatus
  getStreams = getStreams
  getUsers = getUsers
  modifyChannelInformation = modifyChannelInformation
  sendChatAnnouncement = sendChatAnnouncement
  snoozeNextAd = snoozeNextAd
  startARaid = startARaid
  startCommercial = startCommercial
  updateChatSettings = updateChatSettings
  updateUsers = updateUsers
}
