import TwitchInstance from '.'
import Endpoints from './api/endpoints'

export type APIError = {
  error?: string
  status: number
  message: string
}

export class API extends Endpoints {
  constructor(instance: TwitchInstance) {
    super()
    this.instance = instance

    this.#updateRequestCountInterval = setInterval(this.#updateRequestsPerMin, 1000)
  }

  instance: TwitchInstance
  ratelimitLimit = '800'
  ratelimitRemaining = '800'
  requestCount = [0]
  requestsPerMin = 0
  #updateRequestCountInterval: ReturnType<typeof setInterval> | null = null

  clip = {
    id: '',
    url: '',
    edit_url: '',
  }

  readonly defaultOptions = (): RequestInit => {
    const options: RequestInit = {
      method: 'GET',
      headers: {
        'Client-Id': this.instance.auth.clientID,
        Authorization: `Bearer ${this.instance.auth.accessToken}`,
        'Content-Type': 'application/json',
        'user-agent': '',
      },
    }

    return options
  }

  readonly pollData = async (): Promise<void> => {
    if (this.instance.channels.length > 0 && this.instance.auth.valid) {
      await this.updateUsers(this.instance)
      this.getChannelFollowers(this.instance)
      this.getStreams(this.instance)
      if (this.instance.auth.scopes.includes('user:read:moderated_channels')) this.getModeratedChannels(this.instance)
      if (this.instance.auth.scopes.includes('channel:read:charity')) this.getCharityCampaign(this.instance)
      if (this.instance.auth.scopes.includes('moderator:read:chatters')) this.getChatters(this.instance)
      if (this.instance.auth.scopes.includes('channel:read:goals')) this.getCreatorGoals(this.instance)
      if (this.instance.auth.scopes.includes('channel:manage:polls')) this.getPolls(this.instance)
      if (this.instance.auth.scopes.includes('channel:manage:predictions')) this.getPredictions(this.instance)
    }
  }

  public readonly initialPoll = (): void => {
    if (this.instance.channels.length > 0 && this.instance.auth.valid) {
      this.getChatSettings(this.instance)
      if (this.instance.auth.scopes.includes('channel:read:subscriptions')) this.getBroadcasterSubscriptions(this.instance)
      if (this.instance.auth.scopes.includes('channel:read:ads')) this.getAdSchedule(this.instance)
      if (this.instance.auth.scopes.includes('moderator:manage:shield_mode')) this.getShieldModeStatus(this.instance)
    }
  }

  readonly updateRatelimits = (headers: Headers): void => {
    const limit = headers.get('Ratelimit-Limit')
    const remaining = headers.get('Ratelimit-Remaining')

    if (limit) this.ratelimitLimit = limit
    if (remaining) this.ratelimitRemaining = remaining

    this.requestCount[0]++
  }

  readonly #updateRequestsPerMin = () => {
    this.requestsPerMin = this.requestCount.reduce((prev, current) => prev + current, 0)
    this.requestCount.unshift(0)
    if (this.requestCount.length > 60) this.requestCount.pop()
  }

  readonly destroy = () => {
    if (this.#updateRequestCountInterval) clearInterval(this.#updateRequestCountInterval)
  }
}
