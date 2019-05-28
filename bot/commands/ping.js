const Discord = require('discord.js');
const utils = require('../util.js')

module.exports = {
	name: 'ping',
	aliases: [],
	description: 'Ping!',
	hidden: true,
	args: false,
	argsMin: 0,
	usage: '',
	example: '',
	execute(client, guildSettings, msg, args) {
    return msg.channel.send("Pong!")
	},
};
