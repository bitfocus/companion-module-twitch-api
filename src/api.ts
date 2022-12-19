import TwitchInstance from './'
import got from 'got-cjs'

export class API {
  constructor(instance: TwitchInstance) {
    this.instance = instance
  }
  private instance: TwitchInstance
  private readonly gotInstance = got.extend({
    hooks: {
      beforeRequest: [
        (options) => {
          options.headers['Client-ID'] = this.instance.auth.clientID || ''
          options.headers.Authorization = `Bearer ${this.instance.auth.oauth}`
          options.headers['Content-Type'] = 'application/json'
        },
      ],
    },
  })

  /**
   * @scopes channel:manage:polls
   * @param selection Selected Channel
   * @param title Poll Title
   * @param choices Array of 2 to 5 choices
   * @param duration Duration of Poll in seconds, min 15, max 1800
   * @description Creates a Poll
   */
  public readonly createPoll = (selection: string, title: string, choices: string[], duration: number) => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel || !channel.id) return

    if (!this.instance.auth.scopes.includes('channel:manage:polls')) {
      this.instance.log(
        'info',
        'Creating a poll requires the channel:manage:polls scope, please include it in the auth process'
      )
      return
    }

    const options = {
      body: JSON.stringify({
        broadcaster_id: channel.id,
        title,
        choices: choices.map((choice) => ({ title: choice })),
        duration,
      }),
    }

    this.gotInstance
      .post('https://api.twitch.tv/helix/polls', options)
      .then(() => {
        this.instance.log('info', `Poll "${title}" created on channel ${channel.displayName || channel.username}`)
      })
      .catch((err) => {
        this.instance.log('warn', err.response.body)
      })
  }

  /**
   * @scopes channel:manage:predictions
   * @param selection Selected Channel
   * @param title Prediction Title
   * @param outcomes Array of 2 to 10 outcomes
   * @param duration Duration of prediction inseconds, min 1, max 1800
   * @description Creates a Prediction
   */
  public readonly createPrediction = (selection: string, title: string, outcomes: string[], duration: number) => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel || !channel.id) return

    if (!this.instance.auth.scopes.includes('channel:manage:predictions')) {
      this.instance.log(
        'info',
        'Creating a prediction requires the channel:manage:predictions scope, please include it in the auth process'
      )
      return
    }

    const options = {
      body: JSON.stringify({
        broadcaster_id: channel.id,
        title,
        outcomes: outcomes.map((outcome) => ({ title: outcome })),
        prediction_window: duration,
      }),
    }

    this.gotInstance
      .post('https://api.twitch.tv/helix/predictions', options)
      .then(() => {
        this.instance.log('info', `Prediction "${title}" created on channel ${channel.displayName || channel.username}`)
      })
      .catch((err) => {
        this.instance.log('warn', err.response.body)
      })
  }

  /**
   * @scopes channel:manage:broadcast
   * @param selection Selected channel
   * @description Creates a Stream Marker
   */
  public readonly createStreamMarker = (selection: string): void => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel || !channel.id) return

    if (!this.instance.auth.scopes.includes('channel:manage:broadcast')) {
      this.instance.log(
        'info',
        'Creating a stream marker requires the channel:manage:broadcast scope, please include it in the auth process'
      )
      return
    }

    const markerID = `companion-${this.instance.auth.username}-${Date.now()}`

    const options = {
      body: JSON.stringify({
        user_id: channel.id,
        description: markerID,
      }),
    }

    this.gotInstance
      .post('https://api.twitch.tv/helix/streams/markers', options)
      .then((res) => {
        this.instance.log('info', `Created marker: ${markerID} - ${res.body}`)
      })
      .catch((err) => {
        this.instance.log('warn', err.response.body)
      })
  }

  /**
   * @scopes moderator:manage:chat_messages
   * @param selection Selected Channel
   * @description Clears a channels chat
   */
  public readonly deleteChatMessages = (selection: string): void => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel || !channel.id) return

    // Attempt deprecated clear chat if scope is missing
    if (!this.instance.auth.scopes.includes('moderator:manage:chat_messages')) {
      this.instance.chat.clearChat(channel.username)
      this.instance.log(
        'info',
        'Deleting chat messages will soon require the moderator:manage:chat_messages scope, pleases go through the auth process again and grant that scope'
      )
      return
    }

    this.gotInstance
      .delete(
        `https://api.twitch.tv/helix/moderation/chat?broadcaster_id=${channel.id}&moderator_id=${this.instance.auth.userID}`
      )
      .then((_res) => {
        this.instance.log(`info`, `Cleared chat on channel: ${channel.displayName || channel.username}`)
      })
      .catch((err) => {
        this.instance.log('warn', err.response.body)
      })
  }

  /**
   * @scopes channel:manage:polls
   * @param selection Selected Channel
   * @param status Terminated or Archived status
   * @description Checks for an active poll and ends it either publicly showing the results, or hiding them
   */
  public readonly endPoll = async (selection: string, status: 'TERMINATED' | 'ARCHIVED'): Promise<void> => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel || !channel.id) return

    if (!this.instance.auth.scopes.includes('channel:manage:polls')) {
      this.instance.log(
        'info',
        'Ending a poll requires the channel:manage:polls scope, please include it in the auth process'
      )
      return
    }

    let pollID = ''

    await this.gotInstance(`https://api.twitch.tv/helix/polls?broadcaster_id=${channel.id}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data)
        } catch (e) {
          return Promise.reject(e)
        }

        data.data.forEach((poll: any) => {
          if (poll.status === 'ACTIVE') pollID = poll.id
        })

        return
      })
      .catch((err) => {
        this.instance.log('warn', err.response.body)
      })

    if (pollID !== '') {
      const options = {
        body: JSON.stringify({
          broadcaster_id: channel.id,
          id: pollID,
          status,
        }),
      }

      this.gotInstance
        .patch(`https://api.twitch.tv/helix/polls`, options)
        .then((_res) => {
          this.instance.log(`info`, `Ended poll`)
        })
        .catch((err) => {
          this.instance.log('warn', err.response.body)
        })
    }
  }

  /**
   * @scope channel:manage:predictions
   * @param selection Selected Channel
   * @param status Resolved, Canceled, or Locked stuats
   * @param outcome Required winner for Resolved predictions
   * @description Changes the status of a prediction
   */
  public readonly endPrediction = async (
    selection: string,
    status: 'RESOLVED' | 'CANCELED' | 'LOCKED',
    outcome?: string
  ): Promise<void> => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel || !channel.id) return

    if (!this.instance.auth.scopes.includes('channel:manage:predictions')) {
      this.instance.log(
        'info',
        'Ending a prediction requires the channel:manage:predictions scope, please include it in the auth process'
      )
      return
    }

    let predictionID = ''

    await this.gotInstance(`https://api.twitch.tv/helix/predictions?broadcaster_id=${channel.id}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data)
        } catch (e) {
          return Promise.reject(e)
        }

        data.data.forEach((prediction: any) => {
          if (prediction.status === 'ACTIVE') predictionID = prediction.id
        })

        return
      })
      .catch((err) => {
        this.instance.log('warn', err.response.body)
      })

    if (predictionID !== '') {
      const options = {
        body: JSON.stringify({
          broadcaster_id: channel.id,
          id: predictionID,
          status,
          winning_outcome_id: outcome,
        }),
      }

      this.gotInstance
        .patch(`https://api.twitch.tv/helix/predictions`, options)
        .then(() => {
          this.instance.log(`info`, `Prediction status changed`)
        })
        .catch((err) => {
          this.instance.log('warn', err.response.body)
        })
    }
  }

  /**
   * @scope channel:Read:subscriptions
   * @description Gets total number of subscriptions
   */
  public readonly getBroadcasterSubscriptions = (): void => {
    if (!this.instance.auth.scopes.includes('channel:read:subscriptions')) {
      this.instance.log('debug', 'Unable to get Subscriptions, missing channel:read:subscriptions scope')
      return
    }

    this.gotInstance
      .get(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${this.instance.auth.userID}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data)
        } catch (e) {
          this.instance.log('debug', `getBroadcasterSubscriptions: Err parsing data`)
          return
        }

        const channel = this.instance.channels.find((x) => x.id === this.instance.auth.userID)

        if (channel) {
          channel.subs = data.total
          channel.subPoints = data.points
        }
      })
      .catch((err) => {
        this.instance.log('warn', `getBroadcasterSubscriptions err: ${err.message}`)
      })
  }

  /**
   * @scope channel:read:charity
   * @description Gets current Charity campaign
   */
  public readonly getCharityCampaign = (): void => {
    if (!this.instance.auth.scopes.includes('channel:read:charity')) {
      this.instance.log('debug', 'Unable to get Charity Campaign, missing channel:read:charity scope')
      return
    }

    this.gotInstance
      .get(`https://api.twitch.tv/helix/charity/campaigns?broadcaster_id=${this.instance.auth.userID}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data).data
        } catch (e) {
          this.instance.log('debug', `getCharityCampaign: Err parsing data`)
          return
        }

        const channel = this.instance.channels.find((x) => x.id === this.instance.auth.userID)

        if (channel && data.length > 0) {
          channel.charity = {
            name: data[0].name,
            description: data[0].description,
            logo: data[0].logo,
            website: data[0].website,
            current: {
              value: data[0].current_amount.value,
              decimal: data[0].current_amount.decimal_places,
              currency: data[0].current_amount.currency,
            },
            target: {
              value: data[0].target_amount.value,
              decimal: data[0].target_amount.decimal_places,
              currency: data[0].target_amount.currency,
            },
          }
        }
      })
      .catch((err) => {
        this.instance.log('warn', `getCharityCampaign err: ${err.message}`)
      })
  }

  /**
   * @scope moderator:read:chatters
   * @description Gets current Chatter count
   */
  public readonly getChatters = () => {
    if (!this.instance.auth.scopes.includes('moderator:read:chatters')) {
      this.instance.log('debug', 'Unable to get Chatter count, missing moderator:read:chatters scope')
      return
    }

    this.instance.channels
      .filter((channel) => channel.id !== '')
      .forEach((channel) => {
        this.gotInstance
          .get(
            `https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${channel.id}&moderator_id=${this.instance.auth.userID}`
          )
          .then((res) => {
            let data: any = res.body

            try {
              data = JSON.parse(data)
            } catch (e) {
              this.instance.log('debug', `getChatters: Err parsing data`)
              return
            }

            channel.chatters = data.total
          })
          .catch((err) => {
            if (err.response.statusCode !== 403) {
              this.instance.log('warn', `getChatters: Err ${err.message}`)
            }
          })
      })
  }

  /**
   * @deprecataed see https://discuss.dev.twitch.tv/t/new-chatters-api-endpoint-now-available-in-open-beta/40962
   * @description Will use as a backup chatter count until removed
   */
  public readonly getChattersDEPRECATED = (): void => {
    this.instance.channels.forEach((channel) => {
      got
        .get(`https://tmi.twitch.tv/group/user/${channel.username}/chatters`)
        .then((res) => {
          let data: any = res.body

          try {
            data = JSON.parse(data)
          } catch (e) {
            this.instance.log('debug', `getChatters: Err parsing data`)
            return
          }

          if (data && data.chatter_count) channel.chatters = data.chatter_count
          return
        })
        .catch((e: Error) => {
          this.instance.log('warn', e.message)
        })
    })
  }

  /**
   * @scope optional moderator:read:chat_settings
   * @description Gets chat settings
   */
  public readonly getChatSettings = (): any => {
    this.instance.channels
      .filter((channel) => channel.id !== '')
      .forEach((channel) => {
        this.gotInstance
          .get(
            `https://api.twitch.tv/helix/chat/settings?broadcaster_id=${channel.id}&moderator_id=${this.instance.auth.userID}`
          )
          .then((res) => {
            let data: any = res.body

            try {
              data = JSON.parse(data).data
            } catch (e) {
              this.instance.log('debug', `getChatters: Err parsing data`)
              return
            }

            channel.chatModes = {
              emote: data[0].emote_mode,
              followers: data[0].follower_mode,
              followersLength: data[0].follower_mode_duration ? data[0].follower_mode_duration : 0,
              slow: data[0].slow_mode,
              slowLength: data[0].slow_mode_wait_time,
              sub: data[0].subscriber_mode,
              unique: data[0].unique_chat_mode,
              chatDelay: data[0].non_moderator_chat_delay
                ? data[0].non_moderator_chat_delay_duration.toString()
                : data[0].non_moderator_chat_delay,
            }
          })
          .catch((err: any) => {
            if (err?.response?.body) this.instance.log('warn', err.response.body)
          })
      })
  }

  /**
   * @scope channel:read:goals
   * @description Gets creator goals
   */
  public readonly getCreatorGoals = () => {
    if (!this.instance.auth.scopes.includes('channel:read:goals')) {
      this.instance.log('info', 'Unable to get Creator Goals, missing channel:read:goals scope')
      return
    }

    this.gotInstance
      .get(`https://api.twitch.tv/helix/goals?broadcaster_id=${this.instance.auth.userID}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data).data
        } catch (e) {
          this.instance.log('debug', `getCreatorGoals: Err parsing data`)
          return
        }

        const channel = this.instance.channels.find((x) => x.id === this.instance.auth.userID)

        if (channel) {
          channel.goals = data.map((goal: any) => {
            return {
              type: goal.type,
              description: goal.description,
              current: goal.current_amount,
              target: goal.target_amount,
            }
          })
        }
      })
      .catch((err) => {
        this.instance.log('warn', `getCreatorGoals err: ${err.response.body || err.message}`)
      })
  }

  /**
   * @scope channel:read:polls
   * @description Get channel poll
   */
  public readonly getPolls = () => {
    if (!this.instance.auth.scopes.includes('channel:read:polls')) {
      this.instance.log('info', 'Unable to get Polls, missing channel:read:polls scope')
      return
    }

    this.gotInstance
      .get(`https://api.twitch.tv/helix/polls?broadcaster_id=${this.instance.auth.userID}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data).data
        } catch (e) {
          this.instance.log('debug', `getPolls: Err parsing data`)
          return
        }

        const channel = this.instance.channels.find((x) => x.id === this.instance.auth.userID)

        if (channel && data !== null && data[0]) {
          channel.poll = {
            title: data[0].title,
            choices: data[0].choices.map((choice: any) => {
              return {
                title: choice.title,
                votes: choice.votes,
                pointsVotes: choice.channel_points_votes,
                bitsVotes: choice.bits_votes,
              }
            }),
            pointsVoting: data[0].channel_points_voting_enabled,
            pointsPerVote: data[0].channel_points_per_vote,
            bitsVoting: data[0].bits_voting_enabled,
            bitsPerVote: data[0].bits_per_vote,
            duration: data[0].duration,
            status: data[0].status,
            started: data[0].started_at,
            ended: data[0].ended_at,
          }
        }
      })
      .catch((err) => {
        this.instance.log('warn', `getPolls err: ${err.message}`)
      })
  }

  /**
   * @scope channel:read:predictions
   * @description Get channel predictions
   */
  public readonly getPredictions = () => {
    if (!this.instance.auth.scopes.includes('channel:read:predictions')) {
      this.instance.log('info', 'Unable to get Predictions, missing channel:read:predictions scope')
      return
    }

    this.gotInstance
      .get(`https://api.twitch.tv/helix/predictions?broadcaster_id=${this.instance.auth.userID}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data).data
        } catch (e) {
          this.instance.log('debug', `getPredictions: Err parsing data`)
          return
        }

        const channel = this.instance.channels.find((x) => x.id === this.instance.auth.userID)

        if (channel && data !== null && data[0]) {
          channel.predictions = {
            title: data[0].title,
            outcomes: data[0].choices.map((choice: any) => {
              return {
                title: choice.title,
                users: choice.users,
                points: choice.points,
                color: choice.color,
              }
            }),
            duration: data[0].prediction_window,
            status: data[0].status,
            started: data[0].started_at,
            ended: data[0].ended_at,
            locked: data[0].locked_at,
          }
        }
      })
      .catch((err) => {
        this.instance.log('warn', `getPredictions err: ${err.message}`)
      })
  }

  /**
   * @description Get stream status, category, title, and viewer count
   */
  public readonly getStreams = (): void => {
    if (!this.instance.auth.valid) return

    const channels = this.instance.channels.map((channel) => channel.username)

    this.gotInstance
      .get(`https://api.twitch.tv/helix/streams?user_login=${channels.join('&user_login=')}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data)
        } catch (e) {
          this.instance.log('debug', `getStreams: Err parsing data`)
          return
        }

        this.instance.channels.forEach((channel) => {
          const stream = data.data.find((stream: any) => stream.user_login === channel.username)

          if (stream) {
            channel.live = new Date(stream.started_at)
            channel.category = stream.game_name
            channel.title = stream.title
            channel.viewers = stream.viewer_count
          } else {
            channel.live = false
            channel.category = ''
            channel.title = ''
            channel.viewers = 0
          }
        })

        this.instance.checkFeedbacks('channelStatus')
      })
      .catch((err: Error) => {
        this.instance.log('warn', `getStreams err: ${err.message}`)
      })
  }

  /**
   * @description Requests to each data endpoint to get channel/stream data
   */
  public readonly pollData = (): void => {
    if (this.instance.channels.length > 0) {
      this.getBroadcasterSubscriptions()
      this.getCharityCampaign()
      this.getChatters()
      this.getChattersDEPRECATED()
      this.getChatSettings()
      this.getCreatorGoals()
      this.getPolls()
      this.getPredictions()
      this.getStreams()
    }
  }

  /**
   * @scope channel:manage:broadcast
   * @param type game_id or title
   * @param value value to be set
   * @description Updates a channels title, or game id based on a provided name
   */
  public readonly modifyChannelInformation = async (type: 'game_id' | 'title', value: string): Promise<void> => {
    if (!this.instance.auth.scopes.includes('channel:manage:broadcast')) {
      this.instance.log('info', 'Unable to modify channel information, missing channel:manage:broadcast scope')
      return
    }

    const options: any = {
      body: {},
    }

    const getGame = () => {
      return this.gotInstance
        .get(`https://api.twitch.tv/helix/games?name=${value}`)
        .then((res) => {
          let data: any = res.body

          try {
            data = JSON.parse(data).data
          } catch (e) {
            this.instance.log('debug', `getGame: Err parsing data`)
          }

          if (data[0]) {
            options.body = {
              game_id: data[0].id,
            }
          } else {
            this.instance.log('warn', `Unable to find game ${value}`)
          }

          return
        })
        .catch((err) => {
          this.instance.log('warn', `getGame err: ${err.message}`)
        })
    }

    if (type === 'game_id') {
      if (value === '0' || value === '') {
        options.body = {
          game_id: 0,
        }
      } else {
        await getGame()
        if (!options.body?.game_id) return
      }
    } else {
      options.body = {
        title: value,
      }
    }

    options.body = JSON.stringify(options.body)

    this.gotInstance
      .patch(`https://api.twitch.tv/helix/channels?broadcaster_id=${this.instance.auth.userID}`, options)
      .catch((err) => {
        this.instance.log('warn', `modifyChannelInformation err: ${err.message}`)
      })
  }

  /**
   * @param method Request method
   * @param url API endpoint
   * @param body Request body
   * @description Custom Twitch API request
   */
  public readonly request = (method: 'get' | 'put' | 'post', url: string, body: string): void => {
    if (!this.instance.auth.valid) return

    const options = {
      body: body || undefined,
    }

    this.gotInstance[method](url, options)
      .then((res) => {
        this.instance.log('info', JSON.stringify(res.body))
      })
      .catch((err) => {
        this.instance.log('warn', err.response.body ? JSON.stringify(err.response.body) : err.message)
      })
  }

  /**
   * @scope moderator:manage:announcements
   * @param selection Selected channel
   * @param message announcement message
   * @param color announcement color
   * @description Sends an annoucement to chat
   */
  public readonly sendChatAnnouncement = (
    selection: string,
    message: string,
    color: 'blue' | 'green' | 'orange' | 'purple' | 'primary'
  ) => {
    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel || !channel.id) return

    if (!this.instance.auth.scopes.includes('moderator:manage:announcements')) {
      this.instance.log('info', 'Unable to send chat announcement, missing moderator:manage:announcements scope')
      return
    }

    const options = {
      headers: {
        'Client-ID': this.instance.auth.clientID || '',
        Authorization: 'Bearer ' + this.instance.auth.oauth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        color,
      }),
    }

    got
      .post(
        `https://api.twitch.tv/helix/chat/announcements?broadcaster_id=${channel.id}&moderator_id=${this.instance.auth.userID}`,
        options
      )
      .catch((err) => {
        this.instance.log('warn', `sendChatAnnouncement err: ${err.message} - ${err.response.body}`)
      })
  }

  /**
   * @scopechannel:manage:raids
   * @param targetUsername Username of channel to be raided
   * @description Gets the user ID of the target channel, and attempts to raid them
   */
  public readonly startARaid = async (targetUsername: string): Promise<void> => {
    if (!this.instance.auth.userID) return Promise.resolve()

    if (!this.instance.auth.scopes.includes('channel:manage:raids')) {
      this.instance.log('info', 'Unable to start a raid, missing channel:manage:raids scope')
      return Promise.resolve()
    }

    const targetID = await this.gotInstance
      .get(`https://api.twitch.tv/helix/users?user_login=${targetUsername.toLowerCase()}`)
      .then((res) => {
        let data: any = res.body

        try {
          data = JSON.parse(data).data
        } catch (e) {
          this.instance.log('debug', `startARaid: Err parsing data`)
          return
        }

        return data.length === 1 ? data[0].id : ''
      })
      .catch((err: any) => {
        this.instance.log('warn', err.response.body)
      })

    if (targetID !== '') {
      return this.gotInstance
        .post(
          `https://api.twitch.tv/helix/raids?from_broadcaster_id=${this.instance.auth.userID}&to_broadcaster_id=${targetID}`
        )
        .then((res) => {
          this.instance.log('debug', res.body)
        })
        .catch((err: any) => {
          this.instance.log('warn', err.response.body)
        })
    } else {
      this.instance.log('warn', `Unable to raid ${targetUsername}, user not found`)
    }

    return Promise.resolve()
  }

  /**
   * @scope channel:edit:commercial
   * @param length 30, 60, 90, 120, 150, 180 seconds
   * @description Starts a channel commercial
   */
  public readonly startCommercial = (length: string): Promise<void> => {
    if (!this.instance.auth.userID) return Promise.resolve()

    if (!this.instance.auth.scopes.includes('channel:edit:commercial')) {
      this.instance.log('info', 'Unable to start a commercial, missing channel:edit:commercial scope')
      return Promise.resolve()
    }

    return this.gotInstance
      .post(
        `https://api.twitch.tv/helix/channels/commercial?broadcaster_id=${this.instance.auth.userID}&length=${length}`
      )
      .then((res) => {
        this.instance.log('debug', res.body)
      })
      .catch((err: any) => {
        this.instance.log('warn', err.response.body)
      })
  }

  /**
   * @scope moderator:manage:chat_settings
   * @param selection Selected channel
   * @param mode Chat setting to change
   * @param state New state
   * @returns
   */
  public readonly updateChatSettings = (selection: string, mode: string, state: any) => {
    if (!this.instance.auth.scopes.includes('moderator:manage:chat_settings')) {
      this.instance.log('debug', 'Unable to update Chat Settings, missing moderator:manage:chat_settings scope')
      return
    }

    const channel = this.instance.channels.find((x) => x.username === selection)

    if (!channel) return

    const options = {
      headers: {
        'Client-ID': this.instance.auth.clientID || '',
        Authorization: 'Bearer ' + this.instance.auth.oauth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [mode]: state,
      }),
    }

    if (mode === 'slow_mode_wait_time') {
      if (state === 0) {
        options.body = JSON.stringify({ slow_mode: false })
      } else if (state.toString() == channel.chatModes.slowLength) {
        options.body = JSON.stringify({
          slow_mode: !channel.chatModes.slow,
        })
      } else {
        let waitTime = state
        if (state < 3) waitTime = 3
        if (state > 120) waitTime = 120

        options.body = JSON.stringify({
          slow_mode: true,
          slow_mode_wait_time: waitTime,
        })
      }
    }

    if (mode === 'follower_mode_duration') {
      if (state === '0' || state === '') {
        options.body = JSON.stringify({ follower_mode: false })
      } else if (state === channel.chatModes.followersLength.toString()) {
        options.body = JSON.stringify({
          follower_mode: !channel.chatModes.followers,
        })
      } else {
        let duration = state
        if (state < 0) duration = 0
        if (state > 129600) duration = 129600

        options.body = JSON.stringify({
          follower_mode: true,
          follower_mode_duration: duration,
        })
      }
    }

    got
      .patch(
        `https://api.twitch.tv/helix/chat/settings?broadcaster_id=${channel.id}&moderator_id=${this.instance.auth.userID}`,
        options
      )
      .then((res) => {
        console.log(options.body, res.body)
        try {
          const body = JSON.parse(res.body)
          const data = body.data[0]
          channel.chatModes = {
            emote: data.emote_mode,
            followers: data.follower_mode,
            followersLength: data.follower_mode_duration ? data.follower_mode_duration : 0,
            slow: data.slow_mode,
            slowLength: data.slow_mode_wait_time,
            sub: data.subscriber_mode,
            unique: data.unique_chat_mode,
            chatDelay: data.non_moderator_chat_delay
              ? data.non_moderator_chat_delay_duration.toString()
              : data.non_moderator_chat_delay,
          }

          this.instance.checkFeedbacks('chatStatus')
          this.instance.variables.updateVariables()
        } catch (err) {
          console.warn(err)
        }
      })
      .catch((err) => {
        this.instance.log('warn', `updateChatSettings err: ${err.message} - ${err.response.body}`)
      })
  }

  // Validate OAuth token
  public readonly validateToken = (): Promise<any> => {
    const options = {
      headers: {
        Authorization: 'OAuth ' + this.instance.auth.oauth,
      },
    }

    return got.get('https://id.twitch.tv/oauth2/validate', options).then((res) => {
      this.instance.log('debug', `Validated token: ${res.body}`)
      return JSON.parse(res.body)
    })
  }

  public readonly exchangeToken = (): Promise<string> => {
    if (this.instance.config.token === '') return Promise.reject(JSON.stringify(this.instance.config))

    const baseURL =
      this.instance.config.customServerURL === ''
        ? 'https://api-companion.dist.dev/token/'
        : this.instance.config.customServerURL
    const url = baseURL + '?id=' + this.instance.config.token

    return got.get(url).then((res) => {
      this.instance.log('debug', `Got token: ${res.body}`)
      return res.body
    })
  }
}
