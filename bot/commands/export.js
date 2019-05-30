const Discord = require('discord.js');
const utils = require('../util.js');
const mongoose = require('mongoose');
const fs = require("fs")


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
	var exportMsg = await msg.channel.send(utils.warnEmbed("Exporting... This may take a second"))
	//remove database info
	exportObj._id = undefined
	exportObj.guild = undefined
	exportObj.owner = undefined
	exportObj.__v = undefined
	var writeStream = await fs.createWriteStream(`${exportObj.name}.json`)
	await writeStream.write(exportObj.toString())
	await writeStream.end()
	var attachment = await new Discord.Attachment(`${exportObj.name}.json`)

	try{
		await msg.author.send(utils.passEmbed(`Here is your export`).setTitle(`Export for ${exportObj.name}`))
		await msg.author.send(attachment)
		await msg.channel.send(utils.passEmbed("Sent you a DM!"))
	} catch(e) {
		await msg.channel.send(utils.passEmbed().setTitle(`Export for ${exportObj.name}`).setFooter("I couldn't send this in a DM, so I sent it in chat"))
		await msg.channel.send(attachment)
	}
	await fs.unlink(`${exportObj.name}.json`, (err) => {if (err) throw err;})
}
