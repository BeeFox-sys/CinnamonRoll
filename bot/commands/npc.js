const Discord = require('discord.js');
const utils = require('../util.js');
const config = require('../config.json')
const mongoose = require('mongoose');
const schemas = require('../schemas.js')
const messages = mongoose.model('messages', schemas.message)

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

		newMessage = await hook.send(args.join(" "), {
			username: un,
			avatarURL: "https://cdn.discordapp.com/avatars/582243614030299136/fe639cfe01e197860599ff347eed9998.png?size=256",
			disableEveryone: true,
			files: attachments
		})
		messageRecord = new messages({
			_id: newMessage.id,
			owner: msg.member.id,
			character: undefined
		}).save()
		await msg.delete()
	},
};
