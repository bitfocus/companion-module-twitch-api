import { createClip } from './createClip.js'
import { createClipVOD } from './createClipVOD.js'
import { createPoll } from './createPoll.js'
import { createPrediction } from './createPrediction.js'
import { createStreamMarker } from './createStreamMarker.js'
import { customRequest } from './customRequest.js'
import { deleteChatMessages } from './deleteChatMessages.js'
import { endPoll } from './endPoll.js'
import { endPrediction } from './endPrediction.js'
import { getAdSchedule } from './getAdSchedule.js'
import { getBroadcasterSubscriptions } from './getBroadcasterSubscriptions.js'
import { getChannelFollowers } from './getChannelFollowers.js'
import { getChannels } from './getChannels.js'
import { getCharityCampaign } from './getCharityCampaign.js'
import { getChatSettings } from './getChatSettings.js'
import { getChatters } from './getChatters.js'
import { getCreatorGoals } from './getCreatorGoals.js'
import { getGames } from './getGames.js'
import { getModeratedChannels } from './getModeratedChannels.js'
import { getPolls } from './getPolls.js'
import { getPredictions } from './getPredictions.js'
import { getShieldModeStatus } from './getShieldModeStatus.js'
import { getStreams } from './getStreams.js'
import { getUsers } from './getUsers.js'
import { modifyChannelInformation } from './modifyChannelInformation.js'
import { sendChatAnnouncement } from './sendChatAnnouncement.js'
import { snoozeNextAd } from './snoozeNextAd.js'
import { startARaid } from './startARaid.js'
import { startCommercial } from './startCommercial.js'
import { updateChatSettings } from './updateChatSettings.js'
import { updateUsers } from './updateUsers.js'

export default class Endpoints {
  createClip = createClip
  createClipVOD = createClipVOD
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
