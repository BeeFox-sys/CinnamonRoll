const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('./util.js')
const schemas = require('./schemas.js')
const messages = mongoose.model('messages', schemas.message)


module.exports.execute = async (client, guildSettings, msg) => {
  // Get sender and their characters
  sender = msg.member
  characters = guildSettings.characters.filter(character => {
    var prefix = (character.proxy.prefix != "" && character.proxy.prefix != undefined)
    var suffix = (character.proxy.suffix != "" && character.proxy.suffix != undefined)
    if (character.owner == sender.id && (prefix || suffix)) return character
  })
  characters.sort((a, b) => {
    var aSize = 0
    if (a.proxy.prefix) aSize += a.proxy.prefix.length
    if (a.proxy.suffix) aSize += a.proxy.suffix.length

    var bSize = 0
    if (b.proxy.prefix) bSize += b.proxy.prefix.length
    if (b.proxy.suffix) bSize += b.proxy.suffix.length
    return bSize - aSize
  })


  for (var i = 0; i < characters.length; i++) {
    var character = characters[i]
    var prefix = character.proxy.prefix || ""
    var suffix = character.proxy.suffix || ""
    if (msg.content.startsWith(prefix) && msg.content.endsWith(suffix)) {
      var hook = await utils.getWebhook(client, msg.channel)
      var name = character.displayName || character.name
      var suffixLength = -suffix.length
      if (suffixLength == 0) suffixLength = msg.content.length
      var content = msg.content.slice(prefix.length, suffixLength).trim()
      if (character.references.length > 0) var avatar = character.avatar || character.references[0].url
      else var avatar = character.avatar
      var attachments = utils.attachmentsToFileOptions(msg.attachments)
      if (!attachments && content == "") return
      var newMessage = await hook.send(content, {
        username: utils.fackClyde(name),
        avatarURL: avatar,
        disableEveryone: true,
        files: attachments
      })
      var messageRecord = new messages({
        _id: newMessage.id,
        owner: msg.member.id,
        character: character._id
      }).save()
      msg.delete()
      break
    }
  }
  return
}
