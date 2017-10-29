# twitch-helix
Little helper class for the new Twitch API described in current [Twitch API docs](https://dev.twitch.tv/docs/api/reference).<br>
[Transpiled and minified](https://unpkg.com/twitch-helix) with Babel.

[![npm Stats](https://nodei.co/npm/twitch-helix.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/twitch-helix/)

[![Travis Build Status](https://api.travis-ci.org/Jaid/twitch-helix.svg)](https://travis-ci.org/Jaid/twitch-helix)
[![Dependency Status](https://gemnasium.com/badges/github.com/Jaid/twitch-helix.svg)](https://gemnasium.com/github.com/Jaid/twitch-helix)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/Jaid/twitch-helix/master/license.txt)

:warning: This module is instable and incomplete. Feel free to contribute by creating [issues](https://github.com/Jaid/twitch-helix/issues) and [pull requests](https://github.com/Jaid/twitch-helix/pulls).

## Installation

npm
```bash
npm install twitch-helix
```

Yarn
```bash
yarn add twitch-helix
```

## Library Usage

#### Example

Import the default class from this package and feed its constructor with a client ID and a client secret. You can generate those in your [Twitch Developers Dashboard](https://dev.twitch.tv/dashboard/apps).<br>
Try it out on [RunKit](https://npm.runkit.com/twitch-helix)!

```jsx
import TwitchHelix from "twitch-helix"
// Or: const TwitchHelix = require("twitch-helix")

const twitchApi = new TwitchHelix({
    clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    clientSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
})

twitchApi.getTwitchUserByName("nightbot").then(twitchUser => {
    console.log(twitchUser.display_name) // Prints "Nightbot"
})
```

#### Construction

TwitchHelix is a class and you need to create an instance with:

```
new TwitchHelix(options)
```

The options parameter is an object and can have following fields:

|Field|Default value
|---|---|
|clientId|:no_entry_sign: (required)
|clientSecret|:no_entry_sign: (required)
|prematureExpirationTime|10000
|autoAuthorize|true
|smartRetry|true

#### Implemented queries

Some of the common queries are wrapped into neat functions. Those are:

- Promise `getTwitchUserByName(username: string)` returns a Twitch user info object (as shown in above example)
- Promise `getTwitchUsersByName(usernames: Array<string>)` returns an array of Twitch user info objects
- Promise `getStreamInfoById(id: string)` returns a Twitch stream object if user is currently streaming or `null` otherwise
- Promise `getStreamInfoByUsername(username: string)` returns a Twitch stream object if user is currently streaming or `null` otherwise
- Promise `getFollowDate(streamerId: string, followerId: string)` returns a `Date` if follower follows streamer or `null` otherwise

#### Custom queries

You may need custom queries for retrieving data that is not wrapped into a function yet. Feel free to do so.<br>
Some API endpoints are still not implemented by Twitch in Helix API, so you can also use [Kraken v5 API](https://dev.twitch.tv/docs/v5).

```
const helixQueryData = twitchApi.sendHelixRequest("users?login=nightbot&login=moobot")
const krakenQueryData = twitchApi.sendApiRequest("users?login=nightbot,moobot", {api: "kraken"})
```

## Command Line Usage

Here is an example:
```bash
node_modules/.bin/twitch-helix --client-id xxx --client-secret xxx "users?login=nightbot"
``` 

This will print:
```
info:    200 OK (119/120 requests remaining for 56 seconds)
data: 
  - 
    id:                19264788
    login:             nightbot
    display_name:      Nightbot
    type:              
    broadcaster_type:  partner
    description:       A chat moderator bot for Twitch. Visit https://nightbot.tv for more info.
    profile_image_url: https://static-cdn.jtvnw.net/jtv_user_pictures/nightbot-profile_image-2345338c09b4d468-300x300.png
    offline_image_url: https://static-cdn.jtvnw.net/jtv_user_pictures/nightbot-channel_offline_image-71fd41fb8f4b34a3-1920x1080.png
    view_count:        799442
```
