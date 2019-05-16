const Discord = require('discord.js');

module.exports = {
	name: 'extra',
	aliases: ['e','npc'],
	description: 'Summon an extra',
  perms: [''],
	guildOnly: true,
	args: false,
	usage: '<Words>',
	async execute(client, msg, args) {
    if(!msg.member.hasPermission(this.perms)) return;

		var webhooks = await msg.guild.fetchWebhooks()
		var hook
		webhooks = webhooks.filter(hook => hook.channelID === msg.channel.id)
		if(webhooks.find(hook => hook.owner.id === client.user.id) == null){
			hook = await msg.channel.createWebhook("rpBot")
		} else {
			hook = await webhooks.find(hook => hook.owner.id === client.user.id)
		}
		await hook.edit(args.shift()+" [NPC]", "./bot/transparent.png")
		await hook.send(args.join(" "))
	},
};
