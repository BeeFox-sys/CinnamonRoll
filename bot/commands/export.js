const Discord = require('discord.js');
const utils = require('../util.js');
const mongoose = require('mongoose');


module.exports = {
	name: 'export',
	aliases: [''],
	description: 'Summon an extra',
  perms: [''],
	hidden: false,
	args: true,
	argsMin: 2,
	usage: '<location | character> <name | id>',
	async execute(client, guildSettings, msg, args) {
		args = utils.quoteFinder(args)
		switch (args[0]) {
			case "location":
				exportObject(args[1], guildSettings.locations, msg)
				break;
			
			case "character":
				exportObject(args[1], guildSettings.characters, msg)
				break;
		
			default:
				break;
		}
	},
};

async function exportObject(id, array, msg) {
	//Get object to export
	var exportObj = await utils.findObjInArray(id, array)
	if(!exportObj) return await msg.channel.send(utils.errorEmbed(`${id} does not exist`))
	//remove database info
	exportObj._id = undefined
	exportObj.guild = undefined
	exportObj.owner = undefined
	exportObj.__v = undefined
	//return object
	//TODO: Create a file and return it
	try{
		await msg.author.send(utils.passEmbed(`\`\`\`${exportObj.toString()}\`\`\``).setTitle(`Export for ${exportObj.name}`))
		return msg.channel.send(utils.passEmbed("Sent you a DM!"))
	} catch(e) {
		return await msg.channel.send(utils.passEmbed(`\`\`\`${exportObj.toString()}\`\`\``).setTitle(`Export for ${exportObj.name}`).setFooter("Couldn't send this in a DM, so I sent it in main chat"))
	}
	

}