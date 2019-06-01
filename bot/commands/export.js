const Discord = require('discord.js');
const utils = require('../util.js');
const mongoose = require('mongoose');
const fs = require("fs")


module.exports = {
	name: 'export',
	aliases: undefined,
	description: 'Summon an Exports data',
	hidden: false,
	args: true,
	argsMin: 1,
	usage: ['<location | character> <name | id>','all [characters | locations]',],
	async execute(client, guildSettings, msg, args) {
		args = utils.quoteFinder(args)
		switch (args[0]) {
			case "location":
				exportObject(args[1], guildSettings.locations, msg, "location")
				break;
			
			case "character":
				exportObject(args[1], guildSettings.characters, msg, "character")
				break;
		
			case "all":
				switch(args[1]){
					case "locations":
						exportArray(guildSettings.locations, msg, "location")
						break;

					case "characters":
						exportArray(guildSettings.characters, msg, "character")
						break;

					default:
						exportAll(guildSettings, msg)
						break;
				}
				break;

			default:
				break;
		}
	},
};

async function exportObject(id, array, msg, type) {
	//Get object to export
	var exportObj = await utils.findObjInArray(id, array)
	if(!exportObj) return await msg.channel.send(utils.errorEmbed(`${id} does not exist`))
	var exportMsg = await msg.channel.send(utils.warnEmbed("Exporting... This may take a second"))
	//remove database info
	if(type == "character"){
		var exportArray = {
			characters:[
				await cleanObject(exportObj)
			]
		}
	} else {
		var exportArray = {
			locations:[
				await cleanObject(exportObj)
			]
		}
	}
	createFile(exportArray, msg, exportMsg)
}

async function exportArray(array, msg, type) {
	var exportMsg = await msg.channel.send(utils.warnEmbed("Exporting... This may take a second"))
	var exportArray = {}
	if(type == "character") exportArray.characters = []
	else exportArray.locations = []
	for (let i = 0; i < array.length; i++) {
		const document = array[i];

		if(type == "character"){
			exportArray.characters.push(await cleanObject(document))
		} else {
			exportArray.locations.push(await cleanObject(document))
		}
		if(i == array.length-1){
			createFile(exportArray, msg, exportMsg)
		}
	}
	
	
}

async function cleanObject(obj){
	return new Promise(async (resolve)=>{
		obj._id = undefined
		obj.guild = undefined
		obj.owner = undefined
		obj.__v = undefined
		return resolve(obj)
	})
	
}

async function createFile(json, msg, exportMsg){
	var randIdentifier =  Math.floor((Math.random() * 16777215) + 1).toString(16);
	var writeStream = await fs.createWriteStream(`CinnamonRoll.json.${randIdentifier}`)
	await writeStream.write(JSON.stringify(json))
	await writeStream.end()
	var attachment = await new Discord.Attachment(`CinnamonRoll.json.${randIdentifier}`, `CinnamonRoll.json`)

	try{
		await msg.author.send(utils.passEmbed(`This may take a second more to upload`).setTitle(`Export for CinnamonRoll`))
		await msg.author.send(attachment)
		await exportMsg.edit(utils.passEmbed("Sent you a DM!"))
	} catch(e) {
		await exportMsg.edit(utils.passEmbed(`This may take a second more to upload`).setTitle(`Export for CinnamonRoll`).setFooter("I couldn't send this in a DM, so I sent it in chat"))
		await msg.channel.send(attachment)
	}
	await fs.unlink(`CinnamonRoll.json.${randIdentifier}`, (err) => {if (err) throw err;})
}

async function exportAll(guildSettings, msg) {
	var exportMsg = await msg.channel.send(utils.warnEmbed("Exporting... This may take a second"))
	var exportArray = {
		characters:[],
		locations:[]
	}
	for (let i = 0; i < guildSettings.characters.length; i++) {
		const document = guildSettings.characters[i];
		exportArray.characters.push(await cleanObject(document))
		}
	for (let i = 0; i < guildSettings.locations.length; i++) {
		const document = guildSettings.locations[i];
		exportArray.locations.push(await cleanObject(document))
		if(i == guildSettings.locations.length-1){
			createFile(exportArray, msg, exportMsg)
		}
	}
}