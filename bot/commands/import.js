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
	aliases: [],
	description: 'Imports a file provided by TupperBox, Pluralkit, or CinnamonRoll',
	hidden: false,
	args: false,
	argsMin: 0,
	usage: '',
	example: '',
	async execute(client, guildSettings, msg, args) {
		var attachments = msg.attachments.array()
		if(attachments.length != 1) return msg.channel.send(utils.errorEmbed("You must attach only one file from either Tupperbox OR Pluralkit"))
		
		await request.get(attachments[0].url, (error, response, body) => {
			try{
				var importJson = JSON.parse(body)
			} catch (err) {
				return msg.channel.send(utils.errorEmbed("There is something wrong with your JSON file"))
			}
			if(importJson.members) return pluralkitImport(importJson, msg, guildSettings)
			if(importJson.tuppers) return tupperboxImport(importJson, msg, guildSettings)
			if(importJson.references) return cinnamonrollImport(importJson, msg, guildSettings)
			return msg.channel.send(utils.errorEmbed("That doesn't seem to be a valid file"))
		})
	},
};

async function pluralkitImport(importJson, msg, guildSettings){
	var importMessage = await msg.channel.send(utils.warnEmbed(`Begining import...`).setTitle(`Import from Pluralkit for ${msg.member.nickname}`).setFooter("This may take some time"))
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
			updated += `Sucessfuly imported the character: ${doc.name} \`(${doc._id})\`\n`
			if(ci%3==0){ //rateLimit Prevention
				await importMessage.edit(utils.warnEmbed(updated).setTitle(`Import from Pluralkit for ${msg.member.nickname}`).setFooter("This may take some time"))
			}
		})
	}
	await importMessage.edit(utils.passEmbed(updated).setTitle(`Import from Pluralkit for ${msg.member.nickname}`).setFooter(`Import complete!`))

}

async function tupperboxImport(importJson, msg, guildSettings){
	var importMessage = await msg.channel.send(utils.warnEmbed(`Begining import...`).setTitle(`Import from TupperBox for ${msg.member.nickname}`).setFooter("This may take some time"))
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
			updated += `Sucessfuly imported the character: ${doc.name} \`(${doc._id})\`\n`
			if(ci%3==0){ //rateLimit Prevention
				await importMessage.edit(utils.warnEmbed(updated).setTitle(`Import from TupperBox for ${msg.member.nickname}`).setFooter("This may take some time"))
			}
		})
	}
	await importMessage.edit(utils.passEmbed(updated).setTitle(`Import from TupperBox for ${msg.member.nickname}`).setFooter(`Import complete!`))

}

async function cinnamonrollImport(importJson, msg, guildSettings){
	var importMessage = await msg.channel.send(utils.warnEmbed(`Begining import...`).setTitle(`Import from CinnamonRoll for ${msg.member.nickname}`).setFooter("This may take some time"))
	var newDoc;
	var updated = ""
	if(importJson.inventory) {
		newDoc = new characterModel()
		newDoc._id = await utils.generateID(characterModel)
		guildSettings.characters.push(newDoc._id)
		var importType = "character"
	} else {
		newDoc = new locationModel()
		newDoc._id = await utils.generateID(locationModel)
		guildSettings.locations.push(newDoc._id)
		var importType = "location"
	}
	guildSettings.save()
	newDoc.inventory = importJson.inventory
	newDoc.references = importJson.references
	newDoc.name = importJson.name
	newDoc.displayName = importJson.displayName
	newDoc.proxy = importJson.proxy
	newDoc.avatar = importJson.avatar
	newDoc.birthday = importJson.birthday
	newDoc.colour = importJson.colour
	newDoc.avatar = importJson.avatar
	newDoc.description = importJson.description
	newDoc.owner = msg.member.id
	newDoc.guild = guildSettings._id
	await newDoc.save(async (err, doc)=>{
		if(err){
			console.warn(err)
			return msg.channel.send(utils.errorEmbed("Something Went Wrong"))
		}
		updated += `Sucessfuly imported the character: ${doc.name} \`(${doc._id})\`\n`

		await importMessage.edit(utils.passEmbed(updated).setTitle(`Import from CinnamonRoll for ${msg.member.nickname}`).setFooter(`Import complete!`))
	})
}
