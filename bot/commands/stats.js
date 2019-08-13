const Discord = require('discord.js');
const utils = require('../util.js')
const mongoose = require('mongoose')
const schemas = require('../schemas.js');
const characters = mongoose.model('characters', schemas.characters)
const locations = mongoose.model('locations', schemas.locations)


module.exports = {
	name: 'stats',
	aliases: ['status'],
	description: 'Show Cinnamons Stats',
	hidden: false,
	args: false,
	argsMin: 0,
	usage: undefined,
	example: [],
	async execute(client, guildSettings, msg, args) {

        var stats = utils.warnEmbed()
        var ms = client.uptime
        hours = Math.floor(ms / 3600000)
        minutes = Math.floor((ms % 3600000) / 60000)
        seconds = Math.floor(((ms % 360000) % 60000) / 1000)
 
        var time = `${hours>0?`${hours} hour${hours>1?`s`:``} `:''}${minutes>0?`${minutes} minute${minutes>1?`s`:``} `:''}${seconds>0?`${seconds} second${seconds>1?`s`:``}`:''}`

        stats.addField(`Ping`,`${Math.round(client.ping)}ms`)
        stats.addField(`Guilds`,client.guilds.size)
        stats.addField(`Users`,client.users.size)
        stats.addField('Characters',await characters.estimatedDocumentCount().then())
        stats.addField('Locations',await locations.estimatedDocumentCount().then())
        
        stats.addField(`Uptime`,time)
        

		return await msg.channel.send(stats)
	},
};