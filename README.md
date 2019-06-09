# CinnamonRoll

This is a discord bot for roleplay. Inspired by [PluralKit](https://github.com/xSke/PluralKit)!

# How to run!
You can add the bot to the server with [this link](https://discordapp.com/oauth2/authorize?client_id=582106406069600256&scope=bot&permissions=536996928)

And you can [join our support sever](https://discord.gg/PrKWQP2) too!

Or keep reading for self-hosting options

## With Docker
1. Clone the repo: `git clone https://github.com/PlatypodeCode/CinnamonRoll.git`
2. Create `config.json` in the same directory as `sample-config.json` (see for the layout), and set bot token: `cp sample-config.json config.json`
4. Build the bot: `docker-compose build`
5. Run it: `docker-compose up -d`

## Manually
1. Clone the repo: `git clone https://github.com/PlatypodeCode/CinnamonRoll.git`
2. Run `npm install` to install dependencies
3. Create `config.json` in the same directory as `sample-config.json` (see for the layout), and set bot token: `cp sample-config.json config.json`
4. Run a mongo database on localhost and set the database URI in config.json to `mongo://localhost` (or wherever your mongo instance is running)
5. Run `node bot/main.js` from the top of the directory to run the bot

# Configuration
This bot uses a JSON file for configuration. The elements are explained below. `owner` and `logChannel` are optional.
* `defaultPrefix` - default prefix that the bot sets on first-time setup
* `token` - Bot token from Discord
* `db` - Database URI pointing to a mongoDB instance
* `idCharacters` - A string of characters that unique IDs will be generated from
* `idLength` - Number of characters to generate IDs with
* `owner` - Discord user ID of the bot owner (or anyone you want to grant superuser permission for)
* `logChannel` - Discord channel ID where you want tracebacks to be posted (make sure this is private!)

# Dependencies
* `discord.js` 11.5.0 and up
* `mongoose` 5.5.8 and up
