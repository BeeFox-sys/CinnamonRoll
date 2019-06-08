const Discord = require('discord.js');
const utils = require('../util.js')
const config = require('../../config.json');

module.exports = {
	name: 'say',
	aliases: undefined,
	description: 'Owner Only fun times',
	hidden: true,
	args: false,
	argsMin: 0,
	usage: [],
	example: [],
	async execute(client, guildSettings, msg, args) {
    if(msg.member.id == config.owner.id){
			var message = args.join(" ")
			await msg.channel.send(message)
			return await msg.delete()
		}
	},
};
