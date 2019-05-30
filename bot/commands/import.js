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
			if(importJson.created) return pluralkitImport(importJson, msg, guildSettings)
			if(importJson.tuppers) return tupperboxImport(importJson, msg, guildSettings)
			if(importJson.references) return cinnamonrollImport(importJson, msg, guildSettings)
			return msg.channel.send(utils.errorEmbed("That doesn't seem to be a valid file"))
		})
	},
};

async function pluralkitImport(importJson, msg, guildSettings){
	return msg.channel.send(utils.passEmbed("Pluralkit"))
}

async function tupperboxImport(importJson, msg, guildSettings){
	return msg.channel.send(utils.passEmbed("TupperBox"))
}

async function cinnamonrollImport(importJson, msg, guildSettings){
	var importMessage = msg.channel.send(utils.warnEmbed(`Begining import... This may take some time`))
	var newDoc;
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
	return newDoc.save((err, doc)=>{
		if(err){
			console.warn(err)
			return msg.channel.send(utils.errorEmbed("Something Went Wrong"))
		}
		return importMessage.edit(utils.passEmbed(`Sucessfuly imported the ${importType}: ${doc.name} \`(${doc._id})\``))
	})
}
