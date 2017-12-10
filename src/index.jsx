import EventEmitter from "events"
import lodash from "lodash"
import request from "requestretry"

module.exports = class TwitchHelix extends EventEmitter {

    constructor(options) {
        super()
        if (lodash.isEmpty(options)) {
            throw new Error("TwitchHelix constructor needs options object as first argument")
        }
        const credentialOptions = ["clientId", "clientSecret"]
        // Ensure credentials are set
        for (const requiredOption of credentialOptions) {
            if (!options[requiredOption]) {
                throw new Error(`Required TwitchHelix option ${requiredOption} is ${options[requiredOption]}`)
            }
        }
        // Ensure credentials are not "xxx"
        for (const requiredOption of credentialOptions) {
            if (options[requiredOption].match(/^x+$/i)) {
                throw new Error(`Option ${requiredOption} is ${options[requiredOption]} which looks like a placeholder value (You can generate real credential values in your Twitch Developers Dashboard)`)
            }
        }
        // Setting default options
        this.options = {
            prematureExpirationTime: 10000,
            autoAuthorize: true,
            smartRetry: true,
            ...options
        }
        this.accessToken = null
        this.refreshToken = null // TODO Implement autoRefresh
        this.tokenExpiration = null
        this.rateLimit = null
    }

    log = (level, message) => {
        this.emit("log-" + level, message)
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
        if (response.headers) {
            this.rateLimit = {
                limit: response.headers["ratelimit-limit"],
                ramaining: response.headers["ratelimit-remaining"],
                resetDate: response.headers["ratelimit-reset"]
            }
        }
        const getRetryReason = (error, response, body) => {
            if (request.RetryStrategies.HTTPOrNetworkError(error, response)) {
                return response && response.statusCode ? `${response.statusCode} ${response.statusMessage}` : (error.message || error)
            }
            if (!body) {
                return "Received no response body"
            }
            // Bad Request: ?Ad
            // Unauthorized: Retrying because Twitch randomly says "Must provide a valid Client-ID or OAuth token" sometimes
            if (["Bad Request", "Unauthorized"].includes(body.error)) {
                return body.error
            }
        }
        const reason = getRetryReason(error, response, body)
        if (reason) {
            const retryDescription = response ? `#${response.attempts} ${response.request.href}` : response
            this.log("warn", `Retry ${retryDescription} (${reason})`)
            return true
        }
        return false
    }

    sendHelixRequest = async (query, options) => {
        const apiResponse = await this.sendApiRequest(query, options)
        return apiResponse.body.data
    }

    sendApiRequest = (query, options = {}) => new Promise(async (resolve, reject) => {
        const {
            requestOptions,
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
        if (requestOptions) {
            Object.assign(queryOptions, requestOptions)
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

    getTwitchUserById = async id => {
        const data = await this.sendHelixRequest("users", {
            requestOptions: {
                qs: {id}
            }
        })
        return data[0] || null
    }

    getTwitchUserByName = async username => {
        const data = await this.sendHelixRequest("users", {
            requestOptions: {
                qs: {
                    login: username
                }
            }
        })
        return data[0] || null
    }

    getTwitchUsersByName = async usernames => {
        if (!usernames || lodash.isEmpty(usernames)) {
            return []
        }
        const queryPromises = []
        for (const usernamesChunk of lodash.chunk(usernames, 100)) { // /users endpoint has a cap of 100, so we split the query into chunks
            queryPromises.push(this.sendHelixRequest("users", {
                requestOptions: {
                    qs: {
                        login: usernamesChunk
                    }
                }
            }))
        }
        const twitchUsers = await Promise.all(queryPromises)
        return lodash.flatten(twitchUsers)
    }

    getStreamInfoById = async id => {
        const data = await this.sendHelixRequest("streams", {
            requestOptions: {
                qs: {
                    user_id: id
                }
            }
        })
        return data[0] || null
    }

    getStreamInfoByUsername = async username => {
        const data = await this.sendHelixRequest("streams", {
            requestOptions: {
                qs: {
                    user_login: username
                }
            }
        })
        return data[0] || null
    }

    getFollowDate = async (streamer_id, follower_id) => {
        const data = await this.sendHelixRequest("users/follows", {
            requestOptions: {
                qs: {
                    to_id: streamer_id,
                    from_id: follower_id
                }
            }
        })
        return data[0] ? new Date(data[0].followed_at) : null
    }

}
