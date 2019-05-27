const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('./util.js')
const schemas = require('./schemas.js')

module.exports.execute = async (client, guildSettings, msg) => {
  //Get sender and their characters
  sender = msg.member
  characters = guildSettings.characters.filter(character => {
    var prefix = (character.proxy.prefix != "" && character.proxy.prefix != undefined)
    var suffix = (character.proxy.suffix != "" && character.proxy.suffix != undefined)
    if(character.owner == sender.id && (prefix || suffix)) return character
  })
  characters.sort((a,b) => {
    var aSize = 0
      if(a.proxy.prefix) aSize += a.proxy.prefix.length
      if(a.proxy.suffix) aSize += a.proxy.suffix.length

      var bSize = 0
        if(b.proxy.prefix) bSize += b.proxy.prefix.length
        if(b.proxy.suffix) bSize += b.proxy.suffix.length
    return bSize - aSize
  })


  for (var i = 0; i < characters.length; i++) {
    character = characters[i]
    prefix = character.proxy.prefix || ""
    suffix = character.proxy.suffix || ""
    if(msg.content.startsWith(prefix) && msg.content.endsWith(suffix)){
      hook = await utils.getWebhook(client, msg.channel)
      avatar = character.avatar || undefined
      name = character.displayName || character.name
      content = msg.content.slice(prefix.length, -suffix.length)
      attachments = utils.attachmentsToFileOptions(msg.attachments)
      if(!attachments && content == "")  return
      await hook.send(content, {
  			username: name,
  			avatar: avatar,
  			disableEveryone: true,
  			files: attachments
  		})
      msg.delete()
      break
    }
  }
  return
}
