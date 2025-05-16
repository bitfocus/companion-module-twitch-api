import TwitchInstance from './index'

type APIError<T> = { status: number; message: T }

type GetDeviceCode = { device_code: string; expires_in: number; interval: number; user_code: string; verification_uri: string }

type CheckDeviceCodeSuccess = { access_token: string; expires_in: number; refresh_token: string; scope: Scopes[]; token_type: 'bearer' }

type CheckDeviceCodePending = APIError<'authorization_pending'>

type CheckDeviceCodeInvalid = APIError<'invalid device code'>

type RefreshTokenSuccess = { access_token: string; expires_in: number; refresh_token: string; token_type: string }

type RefreshTokenInvalid = APIError<'Invalid refresh token'>

type ValidateTokenSuccess = { client_id: string; login: string; scopes: null | Scopes[]; user_id: number; expires_in: number }

type ValidateTokenInvalid = APIError<'invalid access token'>

export type Scopes =
  | 'analytics:read:extensions'
  | 'analytics:read:games'
  | 'bits:read'
  | 'channel:bot'
  | 'channel:manage:ads'
  | 'channel:read:ads'
  | 'channel:manage:broadcast'
  | 'channel:read:charity'
  | 'channel:edit:commercial'
  | 'channel:read:editors'
  | 'channel:manage:extensions'
  | 'channel:read:goals'
  | 'channel:read:guest_star'
  | 'channel:manage:guest_star'
  | 'channel:read:hype_train'
  | 'channel:manage:moderators'
  | 'channel:read:polls'
  | 'channel:manage:polls'
  | 'channel:read:predictions'
  | 'channel:manage:predictions'
  | 'channel:manage:raids'
  | 'channel:read:redemptions'
  | 'channel:manage:redemptions'
  | 'channel:manage:schedule'
  | 'channel:read:stream_key'
  | 'channel:read:subscriptions'
  | 'channel:manage:videos'
  | 'channel:read:vips'
  | 'channel:manage:vips'
  | 'channel:moderate'
  | 'clips:edit'
  | 'moderation:read'
  | 'moderator:manage:announcements'
  | 'moderator:manage:automod'
  | 'moderator:read:automod_settings'
  | 'moderator:manage:automod_settings'
  | 'moderator:read:banned_users'
  | 'moderator:manage:banned_users'
  | 'moderator:read:blocked_terms'
  | 'moderator:read:chat_messages'
  | 'moderator:manage:blocked_terms'
  | 'moderator:manage:chat_messages'
  | 'moderator:read:chat_settings'
  | 'moderator:manage:chat_settings'
  | 'moderator:read:chatters'
  | 'moderator:read:followers'
  | 'moderator:read:guest_star'
  | 'moderator:manage:guest_star'
  | 'moderator:read:moderators'
  | 'moderator:read:shield_mode'
  | 'moderator:manage:shield_mode'
  | 'moderator:read:shoutouts'
  | 'moderator:manage:shoutouts'
  | 'moderator:read:suspicious_users'
  | 'moderator:read:unban_requests'
  | 'moderator:manage:unban_requests'
  | 'moderator:read:vips'
  | 'moderator:read:warnings'
  | 'moderator:manage:warnings'
  | 'user:bot'
  | 'user:edit'
  | 'user:edit:broadcast'
  | 'user:read:blocked_users'
  | 'user:manage:blocked_users'
  | 'user:read:broadcast'
  | 'user:read:chat'
  | 'user:manage:chat_color'
  | 'user:read:email'
  | 'user:read:emotes'
  | 'user:read:follows'
  | 'user:read:moderated_channels'
  | 'user:read:subscriptions'
  | 'user:read:whispers'
  | 'user:manage:whispers'
  | 'user:write:chat'
  | 'chat:edit'
  | 'chat:read'
  | 'whispers:read'

export class Auth {
  accessToken = ''
  refreshToken = ''
  instance: TwitchInstance
  clientID = '0v78s08sgp7j9am52mpmqcztoz5mvw'
  deviceCode: string | null = null
  deviceCodeInterval: number = 5000
  login = ''
  pollDeviceCode: ReturnType<typeof setTimeout> | null = null
  pollTokenCheck: ReturnType<typeof setInterval> | null = null
  scopes: Scopes[] = []
  userCode: string | null = null
  userID = ''
  valid = false
  verificationURL: string = ''

  constructor(instance: TwitchInstance) {
    this.instance = instance
  }

  /**
   * Check Device Code to see if User has connected to the app
   */
  private checkDeviceCode = async () => {
    this.instance.log('debug', `Checking Device Code`)
    const grantType = 'urn:ietf:params:oauth:grant-type:device_code'
    const url = `https://id.twitch.tv/oauth2/token?client_id=${this.clientID}&device_code=${this.deviceCode}&grant_type=${grantType}`

    fetch(url, { method: 'POST' })
      .then((res) => res.json() as Promise<CheckDeviceCodeSuccess | CheckDeviceCodePending | CheckDeviceCodeInvalid>)
      .then((body) => {
        if ('access_token' in body) {
          this.instance.log('debug', `Got DCF Tokens - ${JSON.stringify(body, null, 2)}`)
          this.accessToken = body.access_token
          this.refreshToken = body.refresh_token
          this.scopes = body.scope

          if (this.pollTokenCheck) clearInterval(this.pollTokenCheck)
          this.pollTokenCheck = setInterval(this.validateTokens, 1000 * 60 * 10)

          this.instance.saveConfig({ ...this.instance.config, accessToken: this.accessToken, refreshToken: this.refreshToken })
          this.startup()
        } else {
          if (body.message === 'authorization_pending') {
            this.instance.log('debug', `Authorization still pending`)
            this.pollDeviceCode = setTimeout(() => {
              this.checkDeviceCode()
            }, this.deviceCodeInterval)
          } else {
            this.instance.log('warn', `Checking Device Code Err: ${body.message}`)
          }
        }
      })
      .catch((err) => {
        this.instance.log('error', `Error checking Device Code: ${err.message || err}`)
      })
  }

  /**
   * Clearn up timers
   */
  destroy = (): void => {
    if (this.pollDeviceCode) clearTimeout(this.pollDeviceCode)
    if (this.pollTokenCheck) clearInterval(this.pollTokenCheck)
  }

  /**
   * Generate Device Code
   * @returns {Promise<GetDeviceCode | null>} Device code for User Auth
   */
  public generateDeviceCode = (): Promise<GetDeviceCode | null> => {
    const scopes = this.generateScopes()
    let url = 'https://id.twitch.tv/oauth2/device?client_id=0v78s08sgp7j9am52mpmqcztoz5mvw'
    if (scopes.length > 0) url += `&scopes=${scopes.join(' ')}`

    return fetch(url, { method: 'POST' })
      .then((res) => res.json() as Promise<GetDeviceCode>)
      .then((body) => {
        this.deviceCode = body.device_code
        this.userCode = body.user_code
        this.verificationURL = body.verification_uri
        this.deviceCodeInterval = body.interval * 1000

        if (this.pollDeviceCode) clearTimeout(this.pollDeviceCode)
        this.checkDeviceCode()
        return body
      })
      .catch((err) => {
        this.instance.log('error', `Error generating Device Code: ${err.message || err}`)
        return null
      })
  }

  /**
   * Generate Scopes
   * @returns {Scopes[]} Array of scopes
   */
  private generateScopes = (): Scopes[] => {
    const scopes: Scopes[] = []

    if (this.instance.config.broadcasterAds) scopes.push('channel:read:ads', 'channel:manage:ads', 'channel:edit:commercial')
    if (this.instance.config.broadcasterBits) scopes.push('bits:read')
    if (this.instance.config.broadcasterChannelPoints) scopes.push('channel:manage:redemptions')
    if (this.instance.config.broadcasterCharity) scopes.push('channel:read:charity')
    if (this.instance.config.broadcasterGoals) scopes.push('channel:read:goals')
    if (this.instance.config.broadcasterExtensions) scopes.push('channel:manage:extensions')
    if (this.instance.config.broadcasterGypeTrain) scopes.push('channel:read:hype_train')
    if (this.instance.config.broadcasterModeration) scopes.push('channel:moderate', 'moderation:read')
    if (this.instance.config.broadcasterPollsPredictions) scopes.push('channel:manage:polls', 'channel:manage:predictions')
    if (this.instance.config.broadcasterRaids) scopes.push('channel:manage:raids')
    if (this.instance.config.broadcasterStreamKey) scopes.push('channel:read:stream_key')
    if (this.instance.config.broadcasterGuestStar) scopes.push('channel:read:guest_star', 'channel:manage:guest_star')
    if (this.instance.config.broadcasterSubscriptions) scopes.push('channel:read:subscriptions')
    if (this.instance.config.broadcasterVIPs) scopes.push('channel:manage:vips')
    if (this.instance.config.editorStreamMarkers) scopes.push('channel:manage:broadcast')

    if (
      this.instance.config.moderatorAnnouncements ||
      this.instance.config.moderatorAutomod ||
      this.instance.config.moderatorChatModeration ||
      this.instance.config.moderatorChatters ||
      this.instance.config.moderatorFollowers ||
      this.instance.config.moderatorShieldMode ||
      this.instance.config.moderatorShoutouts ||
      this.instance.config.moderatorGuestStar ||
      this.instance.config.moderatorUnbanRequests ||
      this.instance.config.moderatorWarnings
    ) {
      scopes.push('user:read:moderated_channels')
    }

    if (this.instance.config.moderatorAnnouncements) scopes.push('moderator:manage:announcements')
    if (this.instance.config.moderatorAutomod)
      scopes.push('moderator:manage:automod', 'moderator:read:automod_settings', 'moderator:read:automod_settings', 'moderator:manage:automod_settings')
    if (this.instance.config.moderatorChatModeration)
      scopes.push(
        'moderator:manage:banned_users',
        'moderator:manage:blocked_terms',
        'moderator:manage:chat_messages',
        'moderator:manage:chat_settings',
        'moderator:read:suspicious_users',
      )
    if (this.instance.config.moderatorChatters) scopes.push('moderator:read:chatters')
    if (this.instance.config.moderatorFollowers) scopes.push('moderator:read:followers')
    if (this.instance.config.moderatorShieldMode) scopes.push('moderator:read:shield_mode', 'moderator:manage:shield_mode')
    if (this.instance.config.moderatorShoutouts) scopes.push('moderator:manage:shoutouts')
    if (this.instance.config.moderatorGuestStar) scopes.push('moderator:read:guest_star', 'moderator:manage:guest_star')
    if (this.instance.config.moderatorUnbanRequests) scopes.push('moderator:read:unban_requests', 'moderator:manage:unban_requests')
    if (this.instance.config.moderatorWarnings) scopes.push('moderator:read:warnings', 'moderator:manage:warnings')
    if (this.instance.config.userChat) scopes.push('user:read:chat', 'chat:read', 'user:write:chat', 'chat:edit', 'user:manage:chat_color')
    if (this.instance.config.userClips) scopes.push('clips:edit')

    return scopes
  }

  /**
   * Initial assignment of tokens if existing in config, and start token check
   */
  public init = (): void => {
    this.accessToken = this.instance.config.accessToken
    this.refreshToken = this.instance.config.refreshToken

    this.validateTokens()
    this.pollTokenCheck = setInterval(this.validateTokens, 1000 * 60 * 10)
  }

  /**
   * Refresh tokens using the one time use Refresh Token
   */
  private refreshTokens = async (): Promise<void> => {
    const url = 'https://id.twitch.tv/oauth2/token'
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.clientID, grant_type: 'refresh_token', refresh_token: this.refreshToken }),
    }

    fetch(url, options)
      .then((res) => res.json() as Promise<RefreshTokenSuccess | RefreshTokenInvalid>)
      .then((body) => {
        if ('access_token' in body) {
          this.instance.log('debug', `Refresh tokens: ${JSON.stringify(body, null, 2)}`)
          this.accessToken = body.access_token
          this.refreshToken = body.refresh_token
          this.instance.saveConfig({ ...this.instance.config, accessToken: this.accessToken, refreshToken: this.refreshToken })
          this.validateTokens()
        } else {
          this.instance.log('warn', `Unable to refresh tokens, token might be expired or invalid such as from importing an old config. Please authenticate again.`)
          this.valid = false
          this.accessToken = ''
          this.refreshToken = ''
          this.instance.saveConfig({ ...this.instance.config, accessToken: '', refreshToken: '' })
          if (this.pollTokenCheck) clearInterval(this.pollTokenCheck)
        }
      })
      .catch((err) => {
        this.instance.log('error', `Error refreshing tokens: ${err.message || err}`)
        return null
      })
  }

  /**
   * Start Chat and API processes with valid tokens
   */
  private startup = (): void => {
    this.valid = true
    this.instance.chat.init()
    this.instance.updateInstance()
		this.instance.API.initialPoll()
		this.instance.API.pollData()
  }

  /**
   * Validate tokens and refresh if needed
   */
  private validateTokens = (): void => {
    this.instance.log('debug', 'Validating tokens')

    if (this.accessToken === '' || this.refreshToken === '') {
      this.instance.log('debug', `Unable to validate tokens - Access Token: ${this.accessToken} - Refresh Token: ${this.refreshToken}`)
      if (this.pollTokenCheck) clearInterval(this.pollTokenCheck)
    }

    const url = 'https://id.twitch.tv/oauth2/validate'
    const options = { headers: { Authorization: `OAuth ${this.accessToken}` } }

    fetch(url, options)
      .then((res) => res.json() as Promise<ValidateTokenSuccess | ValidateTokenInvalid>)
      .then((body) => {
        if ('client_id' in body) {
          // Valid Token
          this.login = body.login
          this.scopes = body.scopes ?? []
          this.userID = body.user_id + ''

          if (body.expires_in < 1800) {
            this.instance.log('debug', `Access token expiring in ${body.expires_in} seconds, attempting to refresh`)
            this.refreshTokens()
          } else {
            this.instance.log('debug', `Access token validated`)
            if (!this.valid) this.startup()
            this.valid = true
          }
        } else {
          // Invalid Token
          this.instance.log('debug', 'Access token invalid, attempting to refresh')
          this.refreshTokens()
        }
      })
      .catch((err) => {
        this.instance.log('error', `Error validating tokens: ${err.message || err}`)
      })
  }
}
