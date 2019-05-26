const Discord = require("discord.js")
const mongoose = require('mongoose');
const config = require("./config.json")

module.exports = {

  //Webhook Finder
  async getWebhook(client, channel) {
    var webhooks = await channel.guild.fetchWebhooks()
		var hook
		webhooks = webhooks.filter(hook => hook.channelID === channel.id)
		if(webhooks.find(hook => hook.owner.id === client.user.id) == null){
			hook = await msg.channel.createWebhook("CinnamonRP")
		} else {
			hook = await webhooks.find(hook => hook.owner.id === client.user.id)
		}
    return hook
  },

  //Webhook Finder
  async getGuildSettings(guild, collection) {

    var doc = await collection.findById(guild).populate('locations').exec()
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
      if(msg.member.roles.get(guildSettings.admin[i]) != undefined) {
         return true;
         break;
       }
    }
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

  async generateID(collection){
    var result = '';
    var foundEmpty = false
    while (!foundEmpty) {
      result = ''
      for ( var i = 0; i < config.idLength; i++ ) {
         result += config.idCharacters.charAt(Math.floor(Math.random() * config.idCharacters.length));
      }
      await collection.findById(result,(err, doc)=>{
        if(doc == null){
          foundEmpty = true
        }
      })
    }
    return result;
  },

  //Find by ID/Name
  findObjInArray(search, objectsArray) {
    var result = null;
    for (var i = 0; i < objectsArray.length; i++) {
      if(objectsArray[i]._id == search){
        return objectsArray[i]
      }
    }
    if(result == null){
      for (var i = 0; i < objectsArray.length; i++) {
        if(objectsArray[i].name == search){
          result = objectsArray[i]
        }
      }
    }
    return result
  },

  valadateColour(colour){
    if (colour === 'RANDOM') return true
    colourTest = Discord.Constants.Colors[colour]
    if(colourTest != undefined) return true
    return /^[0-9A-F]{6}$/i.test(colour.replace("#", ""))
  },

  toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    },

  quoteFinder(array){
    var start = null
    var end = null
    for(var i = 0; i < array.length; i++){
      if(array[i].startsWith(`"`)){
        start = i
      }
      if(array[i].endsWith(`"`)){
        end = i + 1
      }
      if(start != null && end != null) break
    }
    if(start != null && end != null && start < end){
      quote = array.slice(start, end).join(" ").slice(1,-1)
      var del = end - start
      array.splice(start, del, quote)
    }
    return array
  }
}
