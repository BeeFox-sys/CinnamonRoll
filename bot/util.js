const Discord = require("discord.js")
const mongoose = require('mongoose');
const config = require("./config.json")
const schemas = require('./schemas.js');
const guildSettings = mongoose.model('guildSettings', schemas.guildSettings)


utils = {

  //Webhook Finder
  async getWebhook(client, channel) {
    return new Promise(async (resolve) =>{
      var webhooks = await channel.guild.fetchWebhooks()
  		var hook
  		webhooks = webhooks.filter(hook => hook.channelID === channel.id)
  		if(webhooks.find(hook => hook.owner.id === client.user.id) == null){
  			hook = await channel.createWebhook("CinnamonRoll")
  		} else {
  			hook = await webhooks.find(hook => hook.owner.id === client.user.id)
  		}
      return resolve(hook)
    })
  },

  //Webhook Finder
  async getGuildSettings(guild, collection) {
    return new Promise(async (resolve) => {
      var doc = await collection.findById(guild).populate('locations').populate('characters').exec()
      if(doc) return resolve(doc)
      var newSettings = await new collection({
              _id: guild
            })
      return await newSettings.save((err, newDoc)=>{
          if (err) return console.error(err)
          return resolve(newDoc);
        });
    })
  },

  async checkGameAdmin(guildSettings, msg){
    return new Promise(async (resolve) =>{
      if(guildSettings.admin.length == 0) return true;
      for (var i = 0; i < guildSettings.admin.length; i++) {
        if(msg.member.roles.get(guildSettings.admin[i]) != undefined) {
           return resolve(true);
           break;
         }
      }
      return resolve(false)
    })
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
    return new Promise(async (resolve, reject) => {
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
      return resolve(result);
    })
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
  },
  attachmentsToFileOptions(attatchments){
    if(attatchments.size == 0) return undefined
    var fileOptions = []
    attatchments.tap((attachment)=>{
      fileOptions.push({
        attachment: attachment.url,
        name: attachment.filename
      })
    })
    return fileOptions;
  },
  async eraseGuild(msg, guildID){
    msg.channel.send(utils.errorEmbed("Reseting your guild, this may take some time"))
    var guild = await guildSettings.findById(guildID).populate('locations').populate('characters').exec()
    for(var ci = 0; ci < guild.characters.length; ci++){
      guild.characters[ci].delete()
    }
    for(var li = 0; li < guild.locations.length; li++){
      guild.locations[li].delete()
    }
    guild.delete()
    return msg.channel.send(utils.errorEmbed("Guild Reset, default prefix is `!!`"))
  }
}

module.exports = utils
