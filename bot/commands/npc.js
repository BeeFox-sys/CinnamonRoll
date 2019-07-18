const Discord = require('discord.js');
const utils = require('../util.js');
const config = require('../../config.json')
const mongoose = require('mongoose');
const schemas = require('../schemas.js')
const messages = mongoose.model('messages', schemas.message)

module.exports = {
  name: 'npc',
  aliases: ['n'],
  description: 'Summon an extra',
  perms: [''],
  hidden: false,
  args: true,
  argsMin: 1,
  usage: ['<name> <text>**\nProxies an npc'],
  async execute(client, guildSettings, msg, args) {
    var attachments = utils.attachmentsToFileOptions(msg.attachments)

    var argLength = 2
    if (attachments) argLength = 1

    if (args.length < 1) return msg.channel.send(utils.errorEmbed("You must provide a name for the NPC!"));
    args = await utils.quoteFinder(args)
    un = utils.fackClyde(args.slice(0, 1).toString())
    content = args.slice(1).join(" ")

    if (un.length + content.length < argLength) return msg.channel.send(utils.errorEmbed("Message cannot be empty"))

    hook = await utils.getWebhook(client, msg.channel)

    newMessage = await hook.send(content, {
      username: un,
      avatarURL: "https://cdn.discordapp.com/avatars/582243614030299136/fe639cfe01e197860599ff347eed9998.png?size=256", // Send an empty transparent PNG file so the default avatar is replaced with nothingness
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