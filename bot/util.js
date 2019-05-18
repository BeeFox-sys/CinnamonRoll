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
  },

  //Webhook Finder
  async getGuildSettings(guild, collection) {

    var doc = await collection.findById(guild).exec()
    if(doc) return doc
    var newSettings = await new collection({
            _id: guild,
            prefix: config.prefix
          })
    await newSettings.save((err, newDoc)=>{
        if (err) return console.error(err)
        return newDoc;
      });
    },

  async checkGameAdmin(guildSettings, msg){
    if(!guildSettings.admin) return true
    for (var role in guildSettings.admin) {
      if (object.hasOwnProperty(role)) {
        if(msg.member.roles.get(role) != undefined) return true; break;
      }
    }
    return false
  }
}
