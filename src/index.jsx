import EventEmitter from "events"
import lodash from "lodash"
import request from "requestretry"

module.exports = class TwitchHelix {

    constructor(options) {
        if (lodash.isEmpty(options)) {
            throw new Error("TwitchHelix constructor needs options object as first argument")
        }
        const requiredOptions = ["clientId", "clientSecret"]
        for (const requiredOption of requiredOptions) {
            if (!options[requiredOption]) {
                throw new Error(`Required TwitchHelix option ${requiredOption} is ${options[requiredOption]}`)
            }
        }
        this.options = Object.assign(options, {
            prematureExpirationTime: 10000,
            autoAuthorize: true,
            smartRetry: true
        })
        this.accessToken = null
        this.refreshToken = null
        this.tokenExpiration = null
        this.eventEmitter = new EventEmitter()
    }

    on = (type, handler) => {
        this.eventEmitter.on(type, handler)
    }

    log = (level, message) => {
        this.eventEmitter.emit("log-" + level, message)
    }

    authorize = () => new Promise((resolve, reject) => {
        request.post("https://api.twitch.tv/kraken/oauth2/token", {
            qs: {
                client_id: this.options.clientId,
                client_secret: this.options.clientSecret,
                grant_type: "client_credentials"
            },
            gzip: true,
            json: true
        }, (error, response, body) => {
            if (error) {
                reject(error)
                return
            }
            this.accessToken = body.access_token
            this.refreshToken = body.refresh_token
            this.tokenExpiration = Date.now() + (body.expires_in * 1000)
            resolve(this.tokenExpiration)
        })
    })

    isAuthorized = () => this.accessToken && (Date.now() - this.options.prematureExpirationTime > this.tokenExpiration)

    autoAuthorize = async () => {
        if (!this.isAuthorized() && this.options.autoAuthorize) {
            await this.authorize()
        }
    }

    shouldRetryRequest = (error, response, body) => {
        const retryErrors = ["Bad Request"]
        if (request.RetryStrategies.HTTPOrNetworkError(error, response) || retryErrors.includes(body.error)) {
            this.log("warn", `Retry #${response.attempts} ${response.request.href}`)
            return true
        }
        return false
    }

    sendHelixRequest = async query => {
        const apiResponse = await this.sendApiRequest(query)
        return apiResponse.body.data
    }

    sendApiRequest = (query, options = {}) => new Promise(async (resolve, reject) => {
        const {
            api = "helix"
        } = options
        await this.autoAuthorize()
        let queryOptions = {
            json: true,
            gzip: true
        }
        if (api === "helix") {
            queryOptions = Object.assign(queryOptions, {
                baseUrl: "https://api.twitch.tv/helix",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            })
        } else if (api === "kraken") {
            queryOptions = Object.assign(queryOptions, {
                baseUrl: "https://api.twitch.tv/kraken",
                headers: {
                    Authorization: `OAuth ${this.accessToken}`,
                    Accept: "application/vnd.twitchtv.v5+json"
                }
            })
        } else {
            throw new Error(`Unknown Twitch API ${api}`)
        }
        if (this.options.smartRetry) {
            queryOptions = Object.assign(queryOptions, {
                maxAttempts: 10,
                delayStrategy: function () {return (this.attempts ** 2) * 200}, // 200 ms, 800 ms, 1800 ms, 3200 ms, 5000 ms, ...
                retryStrategy: this.shouldRetryRequest
            })
        }
        request.get(query, queryOptions, (error, response, body) => {
            if (response && response.request) {
                this.log("info", `${response.request.method} ${response.request.href}`)
            }
            if (error) {
                reject(error)
                return
            }
            if (!body || body.error) {
                const errorMessage = `Got an unexpected response body from Twitch API: ${typeof body === "object" ? JSON.stringify(body) : body}`
                this.log("error", errorMessage)
                reject(errorMessage)
                return
            }
            resolve({response, body})
        })
    })

    getTwitchUserByName = async username => {
        const data = await this.sendHelixRequest(`users?login=${username}`)
        return data[0]
    }

    getTwitchUsersByName = async usernames => {
        if (!usernames || lodash.isEmpty(usernames)) {
            return []
        }
        if (usernames.length > 100) {
            this.log("warn", `Tried to retrieve data from Twitch API for more ${usernames.length} usernames at once! Using the first 100 usernames and discarding ${usernames.length - 100} usernames`)
            usernames.length = 100
        }
        const data = await this.sendHelixRequest("users?login=" + usernames.join("&login="))
        return data
    }

    getStreamInfoById = async id => {
        const data = await this.sendHelixRequest(`streams?user_id=${id}`)
        return data[0] ? data[0] : null
    }

    getStreamInfoByUsername = async username => {
        const data = await this.sendHelixRequest(`streams?user_login=${username}`)
        return data[0] ? data[0] : null
    }

    getFollowDate = async (streamer_id, follower_id) => {
        const data = await this.sendHelixRequest(`users/follows?to_id=${streamer_id}&from_id=${follower_id}`)
        return data[0] ? new Date(data[0].followed_at) : null
    }

}
