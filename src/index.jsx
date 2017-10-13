import EventEmitter from "events"
import lodash from "lodash"
import request from "request"

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
            autoAuthorize: true
        })
        this.accessToken = null
        this.refreshToken = null
        this.tokenExpiration = null
        this.eventEmitter = new EventEmitter()
    }

    updateApiRequest() {
        this.apiRequest = request.defaults({
            baseUrl: "https://api.twitch.tv/helix",
            jar: true,
            json: true,
            gzip: true,
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        })
    }

    on(type, handler) {
        this.eventEmitter.on(type, handler)
    }

    log(level, message) {
        this.eventEmitter.emit("log-" + level, message)
    }

    authorize() {
        return new Promise((resolve, reject) => {
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
                this.updateApiRequest()
                resolve(this.tokenExpiration)
            })
        })
    }

    isAuthorized() {
        return this.accessToken && (Date.now() - this.options.prematureExpirationTime > this.tokenExpiration)
    }

    async autoAuthorize() {
        if (!this.isAuthorized() && this.options.autoAuthorize) {
            await this.authorize()
        }
    }

    sendApiRequest(query) {
        return new Promise(async (resolve, reject) => {
            await this.autoAuthorize()
            this.apiRequest.get(query, (error, response, body) => {
                if (error) {
                    reject(error)
                    return
                }
                if (!body) {
                    const errorMessage = `Got an invalid response body from Twitch API: ${body}`
                    this.log("error", errorMessage)
                    reject(errorMessage)
                    return
                }
                if (!body.data) {
                    const errorMessage = `Got invalid response data from Twitch API: ${body}`
                    this.log("error", errorMessage)
                    reject(errorMessage)
                    return
                }
                resolve(body.data)
            })
        })
    }

    async getTwitchUserByName(username) {
        const data = await this.sendApiRequest(`users?login=${username}`)
        return data[0]
    }

    async getTwitchUsersByName(usernames) {
        if (!usernames || !usernames.length) {
            return []
        }
        if (usernames.length > 100) {
            this.log("warn", `Tried to retrieve data from Twitch API for more ${usernames.length} usernames at once! Using the first 100 usernames and discarding ${usernames.length} usernames`)
            usernames.length = 100
        }
        const data = await this.sendApiRequest("users?login=" + usernames.join("&login="))
        return data
    }

}
