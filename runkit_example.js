const TwitchHelix = require("twitch-helix")

// Replace those placeholders with your application credentials
// You get get them in your Twitch Developers Dashboard
// https://dev.twitch.tv/dashboard/apps
const twitchApi = new TwitchHelix({
    clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    clientSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
})

twitchApi.getTwitchUserByName("nightbot").then(twitchUser => {
    console.log(twitchUser.display_name)
})
