# CinnamonRP

This is a discord bot for roleplay. Inspired by [PluralKit](https://github.com/xSke/PluralKit)!

# How to run!
The bot currently isn't hosted, however I plan to do this once more features are added!

## With Docker
1. Clone the repo: `git clone https://github.com/PlatypodeCode/CinnamonRP.git`
2. Create `config.json` in the `bot` directory (see `sample-config.json` for the layout), and set bot token
4. Build the bot: `docker-compose build`
5. Run it: `docker-compose up -d`

## Manually
1. Clone the repo: `git clone https://github.com/PlatypodeCode/CinnamonRP.git`
2. Run `npm install` to install dependencies
3. Create `config.json` in the `bot` directory (see `sample-config.json` for the layout), and set bot token
4. Run a mongo database on localhost and set the database URI in config.json to `mongo://localhost` (or wherever your mongo instance is running)
5. Run `node bot/main.js` from the top of the directory to run the bot

# Dependencies
* `discord.js` 11.5.0 and up
* `mongoose` 5.5.8 and up
