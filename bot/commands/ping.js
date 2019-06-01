const Discord = require('discord.js');
const utils = require('../util.js')

module.exports = {
	name: 'ping',
	aliases: undefined,
	description: 'Ping!',
	hidden: true,
	args: false,
	argsMin: 0,
	usage: [],
	example: [],
	async execute(client, guildSettings, msg, args) {
    return await msg.channel.send("Pong!")
	},
};
