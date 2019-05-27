const Discord = require('discord.js');
const utils = require('../util.js');
const config = require('../config.json')

module.exports = {
	name: 'npc',
	aliases: ['n'],
	description: 'Summon an extra',
  perms: [''],
	args: true,
	argsMin: 1,
	usage: '<name> <text>',
	async execute(client, guildSettings, msg, args) {
		var attachments = utils.attachmentsToFileOptions(msg.attachments)

		var argLength = 2
		if(attachments) argLength = 1

		if(args.length < argLength) return msg.channel.send(utils.errorEmbed("Message cannot be empty"))

		hook = await utils.getWebhook(client, msg.channel)
		un = args.shift()

		await hook.send(args.join(" "), {
			username: un,
			avatarURL: "./bot/transparent.png",
			disableEveryone: true,
			files: attachments
		})

		await msg.delete()
	},
};
