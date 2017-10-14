import TwitchHelix from "../src/index"

require("dotenv").config()

const clientId = process.env.TWITCH_CLIENT_ID
const clientSecret = process.env.TWITCH_CLIENT_SECRET

test("TwitchHelix functions should return legit values", async () => {

    const twitchApi = new TwitchHelix({clientId, clientSecret})
    expect(typeof twitchApi).toBe("object")
    const tokenExpiration = await twitchApi.authorize()
    expect(tokenExpiration).toBeGreaterThan(Date.now())

    const j4idn = await twitchApi.getTwitchUserByName("j4idn")
    expect(j4idn.description).toMatch("")
    expect(j4idn.display_name).toMatch("")
    expect(j4idn.id).toBe("65887522")
    expect(j4idn.login).toBe("j4idn")
    expect(j4idn.offline_image_url).toMatch("https://")
    expect(j4idn.profile_image_url).toMatch("https://")
    expect(j4idn.view_count).toBeGreaterThan(0)

    const twitchUsers = await twitchApi.getTwitchUsersByName(["gronkh", "xpandorya"])
    expect(twitchUsers).toHaveLength(2)
    const [gronkh, pandorya] = twitchUsers // Guessing that getTwitchUsersByName returns array values in the same order as its argument (not confirmed)
    expect(gronkh.id).toBe("12875057")
    expect(pandorya.id).toBe("35893764")

    const followDate = await twitchApi.getFollowDate(gronkh.id, pandorya.id)
    expect(followDate.getFullYear()).toBe(2014) // Bravely assuming that xPandorya never unfollows Gronkh

})

test("TwitchHelix should throw an Error if incorrectly constructed", () => {
    expect(() => new TwitchHelix()).toThrow("needs options object")
    expect(() => new TwitchHelix({clientId}).toThrow("TwitchHelix option clientSecret"))
})
