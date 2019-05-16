const Discord = require("discord.js")
const mongoose = require('mongoose');
const config = require("./config.json")

module.exports = {

  //Webhook Finder
  async webhookCheck(client, msg) {
    var webhooks = await msg.guild.fetchWebhooks()
		var hook
		webhooks = webhooks.filter(hook => hook.channelID === msg.channel.id)
		if(webhooks.find(hook => hook.owner.id === client.user.id) == null){
			hook = await msg.channel.createWebhook("rpBot")
		} else {
			hook = await webhooks.find(hook => hook.owner.id === client.user.id)
		}
    return hook
  }


}
