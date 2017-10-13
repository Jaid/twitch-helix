# twitch-helix
Little helper class for the new Twitch API described in current [Twitch API docs](https://dev.twitch.tv/docs/api/reference).<br>
[Transpiled and minified](https://unpkg.com/twitch-helix) with Babel.

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

## Usage

Import the default class from this package and feed its constructor with a client ID and a client secret. You can get those in your [Twitch Developers Dashboard](https://dev.twitch.tv/dashboard/apps).

```jsx
import TwitchHelix from "twitch-helix"
// Or: const TwitchHelix = require("twitch-helix")

const twitchClient = new TwitchHelix({
    clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    clientSecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
})
twitchClient.getTwitchUserByName("nightbot").then(twitchUser => {
    console.log(twitchUser.display_name) // Prints "Nightbot"
})
```
