const TwitchHelix = require("twitch-helix")

// Replace those placeholders with your application credentials
// You get get them in your Twitch Developers Dashboard
// https://dev.twitch.tv/dashboard/apps
const twitchApi = new TwitchHelix({
    clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    clientSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
})

twitchApi.on("log-info", console.log)

const twitchUser = await twitchApi.getTwitchUserByName("nightbot")
console.log(`Twitch user ${twitchUser.display_name} with ID ${twitchUser.id} has ${twitchUser.view_count} views!`)
