import TwitchHelix from "../src/index"

require("dotenv").config()

const clientId = process.env.TWITCH_CLIENT_ID
const clientSecret = process.env.TWITCH_CLIENT_SECRET

test("TwitchHelix functions should return legit values", async () => {
    const twitchClient = new TwitchHelix({clientId, clientSecret})
    expect(typeof twitchClient).toBe("object")
    const tokenExpiration = await twitchClient.authorize()
    expect(tokenExpiration).toBeGreaterThan(Date.now())
    const j4idn = await twitchClient.getTwitchUserByName("j4idn")
    expect(j4idn.description).toMatch("")
    expect(j4idn.display_name).toMatch("")
    expect(j4idn.id).toBe("65887522")
    expect(j4idn.login).toBe("j4idn")
    expect(j4idn.offline_image_url).toMatch("https://")
    expect(j4idn.profile_image_url).toMatch("https://")
    expect(j4idn.view_count).toBeGreaterThan(0)
    const bots = await twitchClient.getTwitchUsersByName(["moobot", "nightbot"])
    expect(bots).toHaveLength(2)
    const moobot = bots.find(twitchUser => twitchUser.login === "moobot")
    const nightbot = bots.find(twitchUser => twitchUser.login === "nightbot")
    expect(moobot.id).toBe("1564983")
    expect(nightbot.id).toBe("19264788")
})

test("TwitchHelix should throw an Error if incorrectly constructed", () => {
    expect(() => new TwitchHelix()).toThrow("needs options object")
    expect(() => new TwitchHelix({clientId}).toThrow("TwitchHelix option clientSecret"))
})
