const Discord = require('discord.js');
const utils = require('../util.js');
const config = require('../config.json')

module.exports = {
	name: 'npc',
	aliases: ['n'],
	description: 'Summon an extra',
  perms: [''],
	args: true,
	argsMin: 2,
	usage: '<name> <text>',
	async execute(client, guildSettings, msg, args) {
    if(!msg.member.hasPermission(this.perms)) return;

		if(args.length < 2) return msg.channel.send(utils.errorEmbed("Message cannot be empty"))
		hook = await utils.getWebhook(client, msg.channel)
		await hook.edit(args.shift()+" [NPC]", "./bot/transparent.png")
		await hook.send(args.join(" "))

		await msg.delete()
	},
};
