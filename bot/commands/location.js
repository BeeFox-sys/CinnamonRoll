const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('../util.js');
const schemas = require('../schemas.js');
const locationsModel = mongoose.model('locations', schemas.location)
const reactResponse = mongoose.model('reactions', schemas.reaction)


module.exports = {
	name: 'location',
	aliases: ['l'],
	description: `Location Command`,
	args: false,
	argsMin: 0,
	usage: [`[location]`,`add <name>`,`<location> colour <hex|word>`,`<location> description <description>`],
	example: '',
	async execute(client, guildSettings, msg, args) {
    const locationsList = await locationsModel.find({guild: guildSettings._id})
    if(args.length == 0){
      if(locationsList.length == 0){
        return msg.channel.send(utils.errorEmbed(`This server has no locations\nCreate one with \`${guildSettings.prefix}location new <name>\``))
      }
      response = utils.passEmbed()
      response.setTitle(`Locations for ${guildSettings.gameName || msg.guild.name}`)
      response.description = ""
      for (var index = 0; index < locationsList.length; index++) {
        var location = locationsList[index]
        response.description += `\n**${location.name}** \`(${location._id})\` `
      }
      return msg.channel.send(response)
    }

    else if (args[0] == "add") {
      if(args.length > 1){
        var newLocation = await new locationsModel()
        newLocation.name = args.splice(1).join(" ")
        newLocation._id = await utils.generateID(locationsModel)
        newLocation.guild = guildSettings._id
        return await newLocation.save((err,  doc)=>{
          if(err) {
            console.log(err)
            return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
          }
          return msg.channel.send(utils.passEmbed(`Created **${doc.name}** \`(${doc._id})\``))
        })
      }
      return msg.channel.send(utils.errorEmbed("You must set a name!"))
    }



		//Find Location
		args = utils.quoteFinder(args)
		var name = args[0]
		var location = utils.findObjInArray(name, locationsList)
		if(location == null) return msg.channel.send(utils.errorEmbed("That location does not exist"))

		//Location editing commands
		if(args.length > 1 && utils.checkGameAdmin(guildSettings, msg)){
			//Colour: <location> colour <hex|word>
			if(args[1] == "colour" || args[1] == "color"){
				var colour = args.splice(2).join("_").toUpperCase()
				if(utils.valadateColour(colour)){
					location.colour = colour
					if(colour == "DEFAULT") location.colour = ""
					return await location.save((err,  doc)=>{
						if(err) {
							console.log(err)
							return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
						}
						return msg.channel.send(utils.passEmbed(`Set colour to **${doc.colour.toLowerCase() || "default"}**`))
					})
				}
				embed = utils.errorEmbed()
				embed.setTitle("Colour must be a hex code or one of these:")
				embed.description = "```"
				for (var colour in Discord.Constants.Colors) {
					if (Discord.Constants.Colors.hasOwnProperty(colour)) {
						embed.description += `\n${utils.toTitleCase(colour.replace(/_/g, " "))}`
					}
				}
				embed.description += "```"
				return msg.channel.send(embed)
			}

			//Description: <location> description <description>
			if(args[1] == "description" || args[1] == "desc"){
				desc = args.splice(2).join(" ")
				location.description = desc
				return await location.save((err,  doc)=>{
					if(err) {
						console.log(err)
						return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
					}
					return msg.channel.send(utils.passEmbed(`Set new description!`))
				})
			}

			if(args[1] == "reference"){
				if(args[2] == "add"){
					if(args.length < 5) return msg.channel.send(utils.errorEmbed("A reference must have a name and a link"))
					var name = utils.quoteFinder(args.slice(3))[0]
					var url = utils.quoteFinder(args.slice(3))[1]
					if(name.length > 30) return msg.channel.send(utils.errorEmbed("Name cannot be longer then 30 characters"))
					var find = location.references.filter(ref => ref.name == name)
					if(find.length != 0) return msg.channel.send(utils.errorEmbed("That reference already exists!"))
					location.references.push({
						name: name,
						url: url
					})
					return location.save((err,  doc)=>{
						if(err) {
							console.log(err)
							return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
						}
						return msg.channel.send(utils.passEmbed(`Added reference!`))
					})
				} else if(args[2] == "remove"){
					if(args.length < 4) return msg.channel.send(utils.errorEmbed("Must supply a reference to delete"))
					var name = utils.quoteFinder(args.slice(3))[0]
					var find = location.references.filter(ref => ref.name == name)
					if(find.length == 0) return msg.channel.send(utils.errorEmbed("That reference doesn't exist!"))
					var index = location.references.indexOf(find[0])
					location.references.splice(index,1)
					return location.save((err) => {
						if(err){
							console.log(err)
						  return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
						}
						return msg.channel.send(utils.passEmbed(`Removed reference!`))
					})
				}
			}

			return msg.channel.send(utils.errorEmbed("That is not a valid subcommand"))
		}


		//return location
		embed = utils.passEmbed()
		embed.setTitle(location.name)
		embed.setFooter(location._id)
		embed.setColor(location.colour)
		embed.setDescription(location.description || "")
		var references = ""
		for (var i = 0; i < location.references.length; i++) {
			references += `\n[${location.references[i].name}](${location.references[i].url})`
		}
		if(references != "") embed.addField("References:",references)
		return msg.channel.send(embed)

	},
};
