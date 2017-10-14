#!/usr/bin/env node
import program from "commander"
import prettyJson from "prettyjson"
import winston from "winston"
import TwitchHelix from "./index"

try {
    require("dotenv").config()
} catch (error) {
}

winston.cli()

program
    .description("Command line interface for querying data from Twitch Helix API")
    .usage("[options] <api-query>")
    .option("-c, --client-id [value]", "Twitch application client ID", process.env.TWITCH_CLIENT_ID)
    .option("-s, --client-secret [value]", "Twitch application client secret", process.env.TWITCH_CLIENT_SECRET)
    .parse(process.argv)

if (!program.args[0]) {
    program.outputHelp()
    process.exit(0)
}

const query = program.args[0]

const twitchApi = new TwitchHelix({
    clientId: program.clientId,
    clientSecret: program.clientSecret
})

twitchApi.sendApiRequest(query)
    .then(({response, body}) => {
        const rateLimit = response.headers["ratelimit-limit"]
        const rateLimitRemaining = response.headers["ratelimit-remaining"]
        const rateLimitReset = response.headers["ratelimit-reset"]
        const statusLine = `${response.statusCode} ${response.statusMessage} (${rateLimitRemaining}/${rateLimit} requests remaining for ${ Math.ceil(rateLimitReset - Date.now() / 1000)} seconds)`
        winston.info(statusLine + "\n" + prettyJson.render(body))
    })
    .catch(error => {
        winston.error(error instanceof Error ? error.stack : new Error(error).stack)
        process.exit(1)
    })
