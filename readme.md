# twitch-helix
Little helper class for the new Twitch API described in current [Twitch API docs](https://dev.twitch.tv/docs/api/reference).<br>
[Transpiled and minified](https://unpkg.com/twitch-helix) with Babel.

[![npm Stats](https://nodei.co/npm/twitch-helix.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/twitch-helix/)

[![Travis Build Status](https://api.travis-ci.org/Jaid/twitch-helix.svg)](https://travis-ci.org/Jaid/twitch-helix)
[![Dependency Status](https://gemnasium.com/badges/github.com/Jaid/twitch-helix.svg)](https://gemnasium.com/github.com/Jaid/twitch-helix)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/Jaid/twitch-helix/master/license.txt)

Feel free to contribute by creating [issues](https://github.com/Jaid/twitch-helix/issues) and [pull requests](https://github.com/Jaid/twitch-helix/pulls).

## Installation

Yarn (recommended)
```bash
yarn add twitch-helix
```

npm
```bash
npm install --save twitch-helix
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

```jsx
const twitchApi = new TwitchHelix(options)
```

The options parameter is an object and can have following fields:

Field|Info|Default value
---|---|---
`clientId`|Client ID of your Twitch app|:no_entry_sign: (required)
`clientSecret`|Client secret of your Twitch app|:no_entry_sign: (required)
`prematureExpirationTime`|Time in ms for the access token to expire before it is meant to (Not implemented yet)|`10000`
`autoAuthorize`|Will call automatically call authorize() when needed|`true`
`smartRetry`|Will retry Twitch API requests up to 10 times if the server response is invalid|`true`

#### Implemented queries

Some of the common queries are wrapped into neat functions. Those are:

- Promise `getTwitchUserByName(username: string)` returns a Twitch user info object (as shown in above example)
- Promise `getTwitchUsersByName(usernames: Array<string>)` returns an array of Twitch user info objects
- Promise `getStreamInfoById(id: string)` returns a Twitch stream object if user is currently streaming or `null` otherwise
- Promise `getStreamInfoByUsername(username: string)` returns a Twitch stream object if user is currently streaming or `null` otherwise
- Promise `getFollowDate(streamerId: string, followerId: string)` returns a `Date` if follower follows streamer or `null` otherwise

#### Custom queries

You may need custom queries for retrieving data that is not wrapped into a function yet. Feel free to do so. Some API endpoints are still not implemented by Twitch in Helix API, so you can also use [Kraken v5 API](https://dev.twitch.tv/docs/v5).

```jsx
const helixQueryData = await twitchApi.sendHelixRequest("users?login=nightbot&login=moobot")
const krakenQueryData = await twitchApi.sendApiRequest("users?login=nightbot,moobot", {api: "kraken"})
```

#### Events

You can listen to some events.
```jsx
twitchApi.on(eventName, eventHandler)
```

Event name|Parameters|Description
---|---|---
`log-info`|`message`|Emitted on INFO log messages
`log-warn`|`message`|Emitted on WARN log messages
`log-error`|`message`|Emitted on ERROR log messages

## Command Line Usage

Here is an example:
```bash
node_modules/.bin/twitch-helix --client-id xxx --client-secret xxx "users?login=nightbot"
``` 

This will print:
[![Command Line Output](https://i.imgur.com/PTdBOQW.png)](https://i.imgur.com/PTdBOQW.png)

Use the `--kraken` flag to query data from a Kraken endpoint instead of a Helix endpoint.
