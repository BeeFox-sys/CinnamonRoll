const Discord = require('discord.js');
const utils = require('../util.js')
const fs = require('fs')
var request = require('request')
const mongoose = require('mongoose');
const schemas = require('../schemas')
const characterModel = mongoose.model('characters', schemas.character)
const locationModel = mongoose.model('locations', schemas.location)


module.exports = {
	name: 'import',
	aliases: undefined,
	description: 'Imports a file provided by TupperBox, Pluralkit, or CinnamonRoll',
	hidden: false,
	args: false,
	argsMin: 0,
	usage: '',
	example: '',
	async execute(client, guildSettings, msg, args) {
		var attachments = msg.attachments.array()
		if(attachments.length != 1) return msg.channel.send(utils.errorEmbed("You must attach only one file from either Tupperbox, CinnamonRoll, or Pluralkit"))
		
		await request.get(attachments[0].url, (error, response, body) => {
			try{
				var importJson = JSON.parse(body)
			} catch (err) {
				return msg.channel.send(utils.errorEmbed("There is something wrong with your JSON file"))
			}
			if(importJson.members) return pluralkitImport(importJson, msg, guildSettings)
			if(importJson.tuppers) return tupperboxImport(importJson, msg, guildSettings)
			if(importJson.characters || importJson.locations) return cinnamonrollImport(importJson, msg, guildSettings)
			return msg.channel.send(utils.errorEmbed("That doesn't seem to be a valid file"))
		})
	},
};

async function pluralkitImport(importJson, msg, guildSettings){
	var importMessage = await msg.channel.send(utils.warnEmbed(`Begining import...`).setTitle(`Importing characters from Pluralkit for ${msg.member.nickname}`).setFooter("This may take some time"))
	var updated = "";
	for (let ci = 0; ci < importJson.members.length; ci++) {
		const member = importJson.members[ci];
		var newDoc = await new characterModel()
		newDoc._id = await utils.generateID(characterModel)
		await guildSettings.characters.push(newDoc._id)
		await guildSettings.save()
		newDoc.owner = msg.member.id
		newDoc.guild = guildSettings._id

		newDoc.name = member.name
		newDoc.colour = member.color
		newDoc.avatar = member.avatar_url
		newDoc.description = member.description
		newDoc.birthday = member.birthday
		newDoc.pronouns = member.pronouns
		newDoc.proxy = {
			"prefix":member.prefix || "",
			"suffix":member.suffix || ""
		}

		await newDoc.save(async (err, doc)=>{
			if(err){
				console.warn(err)
				return msg.channel.send(utils.errorEmbed("Something Went Wrong"))
			}
			if(ci == importJson.members.length-1){
				await importMessage.edit(utils.passEmbed("Success!").setTitle(`Importing characters from Pluralkit for ${msg.member.nickname}`).setFooter(`Import complete!`))
			}
		})
	}
}

async function tupperboxImport(importJson, msg, guildSettings){
	var importMessage = await msg.channel.send(utils.warnEmbed(`Begining import...`).setTitle(`Importing characters from TupperBox for ${msg.member.nickname}`).setFooter("This may take some time"))
	var updated = "";
	for (let ci = 0; ci < importJson.tuppers.length; ci++) {
		const tulpa = importJson.tuppers[ci];
		var newDoc = await new characterModel()
		newDoc._id = await utils.generateID(characterModel)
		await guildSettings.characters.push(newDoc._id)
		await guildSettings.save()
		newDoc.owner = msg.member.id
		newDoc.guild = guildSettings._id

		newDoc.name = tulpa.name
		newDoc.avatar = tulpa.avatar_url
		newDoc.description = tulpa.description
		newDoc.birthday = tulpa.birthday
		newDoc.proxy = {
			"prefix":tulpa.brackets[0],
			"suffix":tulpa.brackets[1]
		}

		await newDoc.save(async (err, doc)=>{
			if(err){
				console.warn(err)
				return msg.channel.send(utils.errorEmbed("Something Went Wrong"))
			}
			if(ci == importJson.tuppers.length-1){
				await importMessage.edit(utils.passEmbed("Success!").setTitle(`Importing characters from TupperBox for ${msg.member.nickname}`).setFooter(`Import complete!`))
			}
		})
	}

}

async function cinnamonrollImport(importJson, msg, guildSettings){
	
	if(importJson.characters != undefined){
		var importMessage = await msg.channel.send(utils.warnEmbed(`Begining import...`).setTitle(`Importing characters from CinnamonRoll for ${msg.member.nickname}`).setFooter("This may take some time"))

		for (let ci = 0; ci < importJson.characters.length; ci++) {
			await importCharacter(importJson.characters[ci], msg, guildSettings)
		}	
		await importMessage.edit(utils.passEmbed("Success!").setTitle(`Importing characters from CinnamonRoll for ${msg.member.nickname}`))
	}
	if(importJson.locations != undefined){
		var importMessage = await msg.channel.send(utils.warnEmbed(`Begining import...`).setTitle(`Importing locations from CinnamonRoll for ${msg.member.nickname}`).setFooter("This may take some time"))

		for (let ci = 0; ci < importJson.locations.length; ci++) {
			await importLocation(importJson.locations[ci], msg, guildSettings)			
		}
		await importMessage.edit(utils.passEmbed("Success!").setTitle(`Importing locations from CinnamonRoll for ${msg.member.nickname}`))
	}
}

async function importCharacter(character, msg, guildSettings) {
	return new Promise(async resolve => {		
			var newDoc;
			newDoc = new characterModel()
			newDoc._id = await utils.generateID(characterModel)
			newDoc.owner = msg.member.id
			newDoc.guild = guildSettings._id
			guildSettings.characters.push(newDoc._id)
			guildSettings.save()

			newDoc.inventory = character.inventory
			newDoc.references = character.references
			newDoc.name = character.name
			newDoc.displayName = character.displayName
			newDoc.proxy = character.proxy
			newDoc.avatar = character.avatar
			newDoc.birthday = character.birthday
			newDoc.colour = character.colour
			newDoc.avatar = character.avatar
			newDoc.description = character.description
			newDoc.pronouns = character.pronouns
			
			await newDoc.save(async (err, doc)=>{
				if(err){
					console.warn(err)
					return msg.channel.send(utils.errorEmbed("Something Went Wrong"))
				}
				resolve()
			})
		})
}

async function importLocation(location, msg, guildSettings) {
	return new Promise(async resolve => {
		var newDoc;
		newDoc = await new locationModel()
		newDoc._id = await utils.generateID(characterModel)
		newDoc.owner = msg.member.id
		newDoc.guild = guildSettings._id
		guildSettings.locations.push(newDoc._id)
		guildSettings.save()

		newDoc.references = location.references
		newDoc.name = location.name
		newDoc.colour = location.colour
		newDoc.description = location.description
		
		await newDoc.save(async (err, doc)=>{
			if(err){
				console.warn(err)
				return msg.channel.send(utils.errorEmbed("Something Went Wrong"))
			}
			resolve()
		})
	})
}