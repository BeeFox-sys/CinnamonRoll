const Discord = require("discord.js")
const mongoose = require('mongoose');
const config = require("../config.json")
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
  async getGuildSettings(client, guild, collection) {
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

  async checkGameAdmin(guildSettings, member){
    return new Promise(async (resolve) =>{
      if(guildSettings.admin.length == 0) return resolve(true);

      for (var i = 0; i < guildSettings.admin.length; i++) {
        if(member.roles.get(guildSettings.admin[i]) != undefined) {
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
      .setColor('#ffaa00')
      .setDescription(text || "")
    return embed
  },

  async generateID(collection){
    return new Promise(async resolve => {
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
        if(objectsArray[i].name.toLowerCase() == search){
          result = objectsArray[i]
        }
      }
    }
    return result
  },

  validateColour(colour){
    if (colour === 'RANDOM') return true
    colourTest = Discord.Constants.Colors[colour]
    if(colourTest != undefined) return true
    return /^[0-9A-F]{6}$/i.test(colour.replace("#", ""))
  },

  validateUrl(url) {
    pattern = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/igm);
    return pattern.test(url);
  },

  toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    },

  quoteFinder(input){
    if (!input.length) throw new TypeError("Input array to quoteFinder is undefined!");
    var string = input.join(" ")
    solved = string.match(/\w+|["'“][^"'”]+["'”]/g)
    result = []
    solved.forEach(part => {
      if(/^["'“][^"'”]+["'”]$/.test(part)){
        result.push(part.substr(1,part.length-2))
      }
      else(result.push(part))
    });
    return result
  },
  attachmentsToFileOptions(attachments){
    if(attachments.size == 0) return undefined
    var fileOptions = []
    attachments.tap((attachment)=>{
      fileOptions.push({
        attachment: attachment.url,
        name: attachment.filename
      })
    })
    return fileOptions;
  },
  async eraseGuild(msg, guildID){
    return new Promise(async resolve => {
      msg.channel.send(utils.errorEmbed("Resetting your guild, This may take some time..."))
      var guild = await guildSettings.findById(guildID).populate('locations').populate('characters').exec()
      for(var ci = 0; ci < guild.characters.length; ci++){
        guild.characters[ci].delete()
      }
      for(var li = 0; li < guild.locations.length; li++){
        guild.locations[li].delete()
      }
      guild.delete()
      return resolve(msg.channel.send(utils.errorEmbed(`Guild Reset, default prefix is \`${config.defaultPrefix}\``)))
    })
  },
  async wait(ms){
    return new Promise(async resolve => {
      setTimeout(resolve, ms);
    })
  },

  // Traceback logging
  async logTraceback(err, client, msg) {
    try {
      if (config.logChannel) {
        let date = new Date; 
        console.error(`${date.toUTCString()} Server: ${msg.guild.id} Channel:${msg.channel.id} Input:${msg.content}\n${err.stack}`)
        const logChannel = await client.channels.get(config.logChannel);
        var embed = utils.errorEmbed()
        if (msg) {
          var user = await client.fetchUser(msg.author.id)
          if (msg.content.length > 256) {
            embed.setTitle(msg.content.substring(0, 256 - 3) + "...")
          } else embed.setTitle(msg.content)
          embed.setFooter(`Sender: ${user.tag} (${user.id}) | Guild: ${msg.guild.id} | Channel: ${msg.channel.id}`)
        }
        embed.description = "```js\n" + err.stack + "```"
        logChannel.send(embed);
      }
      return
    } catch (e) {
      console.warn("Something went wrong, we couldn't log this error to the log channel because of the following error:\n" + e.stack)
    }
  },
  fackClyde(str){
    str = str.padEnd(2,"឵឵") // <- there is a invisbale unicode char there
    if(!str.toLowerCase().includes("clyde")) return str
    var pos = str.search(/(clyde)/gi)
    var strarry = str.split('')
    strarry.splice(pos+1,0," ")
    str = strarry.join("")
    return utils.fackClyde(str)
  }
}

module.exports = utils
