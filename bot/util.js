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
			hook = await msg.channel.createWebhook("CinnamonRP")
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

  checkGameAdmin(guildSettings, msg){
    if(guildSettings.admin.length == 0) return true;
    for (var i = 0; i < guildSettings.admin.length; i++) {
      console.log(i)
      if(msg.member.roles.get(guildSettings.admin[i]) != undefined) {
         return true;
         break;
       }
    }
    console.log("here")
    return false
  },

  errorEmbed(text){
    embed = new Discord.RichEmbed()
      .setColor('#ff2200')
      .setDescription(text || "")
    return embed
  },

  passEmbed(text){
    embed = new Discord.RichEmbed()
      .setColor('#43b581')
      .setDescription(text || "")
    return embed
  },

  warnEmbed(text){
    embed = new Discord.RichEmbed()
      .setColor('#43b581')
      .setDescription(text || "")
    return embed
  },
}
