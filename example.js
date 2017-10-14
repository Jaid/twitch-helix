const TwitchHelix = require("twitch-helix")

// Replace those placeholders with your application credentials
// You get get them in your Twitch Developers Dashboard
// https://dev.twitch.tv/dashboard/apps
const twitchApi = new TwitchHelix({
    clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    clientSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
})

const twitchUser = await twitchApi.getTwitchUserByName("nightbot")
console.log(twitchUser.display_name)
