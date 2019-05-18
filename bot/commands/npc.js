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


		hook = await utils.webhookCheck(client, msg)
		await hook.edit(args.shift()+" [NPC]", "./bot/transparent.png")
		await hook.send(args.join(" "))

		await msg.delete()
	},
};
