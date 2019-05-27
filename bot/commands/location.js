const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('../util.js');
const schemas = require('../schemas.js');
const locationsModel = mongoose.model('locations', schemas.location)
const reactResponse = mongoose.model('reactions', schemas.reaction)


module.exports = {
	name: 'location',
	aliases: ['l'],
	description: `
**Add <name>**
Adds a new location with the name \`<name>\`
**<location> remove**
Removes the location \`<location>\`
**<location> colour <hex|word>**
Sets \`<location>\`'s colour to a hex code or a word
**<location> description <description>**
Sets \`<location>\`'s description to \`<description>\`
**<location> reference add <name> <url>**
Adds a reference to \`<location>\`
**<location> reference remove <name>**
Removes a reference from \`<location>\``,
	args: false,
	argsMin: 0,
	usage: [`[location]`,`add <name>`,`<location> remove`,`<location> colour <hex|word>`,`<location> description <description>`, `<location> reference add <name> <url>`,`<location> reference remove <name>`, `<character> rename <New name>`],
	example: '',
	async execute(client, guildSettings, msg, args) {
    const locationsList = guildSettings.locations
    if(args.length == 0){
      if(locationsList.length == 0){
        return msg.channel.send(utils.errorEmbed(`This server has no locations\nCreate one with \`${guildSettings.prefix}location add <name>\``))
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

    else if (args[0] == "add" || args[0] == "new" || args[0] == "create") {
      if(args.length > 1){
        var newLocation = await new locationsModel()
        newLocation.name = args.splice(1).join(" ")
        newLocation._id = await utils.generateID(locationsModel)
        newLocation.guild = guildSettings._id
        return await newLocation.save(async (err,  doc)=>{
          if(err) {
            console.log(err)
            return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
          }
					await guildSettings.locations.push(doc._id)
					await guildSettings.save()
          return msg.channel.send(utils.passEmbed(`Created **${doc.name}** \`(${doc._id})\``))
        })
      }
      return msg.channel.send(utils.errorEmbed("You must set a name!"))
    }



		//Find Location
		args = utils.quoteFinder(args)
		var name = args[0]
		var location = utils.findObjInArray(name, locationsList)
		if(location == null) return msg.channel.send(utils.errorEmbed(`Location \"${name}\" does not exist`))

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
			else if(args[1] == "description" || args[1] == "desc"){
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
			//reference commands
			else if(args[1] == "reference" || args[1] == "ref"){
				//reference add command
				if(args[2] == "add" || args[2] == "new"){
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
						return msg.channel.send(utils.passEmbed(`Added reference \"${name}\"!`))
					})
				}
				//reference remove command
				else if(args[2] == "remove" || args[2] == "delete"){
					if(args.length < 4) return msg.channel.send(utils.errorEmbed("Must supply a reference to delete"))
					var name = utils.quoteFinder(args.slice(3))[0]
					var find = location.references.filter(ref => ref.name == name)
					if(find.length == 0) return msg.channel.send(utils.errorEmbed(`Reference \"${name}\" doesn't exist!`))
					var index = location.references.indexOf(find[0])
					location.references.splice(index,1)
					return location.save((err) => {
						if(err){
							console.log(err)
						  return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
						}
						return msg.channel.send(utils.passEmbed(`Removed reference \"${name}\"!`))
					})
				}
			}
			//rename
      else if(args[1] == "rename"){
				if(args.length < 3) return msg.channel.send(utils.errorEmbed("A location must have a name!"))
        newName = args.slice(2).join(" ")
        location.name = newName
        return await location.save(err => {
            if(err){
              console.log(err)
              return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
            }
            return msg.channel.send(utils.passEmbed(`Updataed name to ${location.name}!`))
          })
      }
			//remove command
			else if(args[1] == "remove" || args[1] == "delete" || args[1] == "destroy"){
				return msg.channel.send(utils.passEmbed(`React ✅ to delete ${location.name}`))
					.then(async response => {
						newReact = await new reactResponse()
						newReact._id = response.id
						newReact.user = msg.member.id
						newReact.settings = {
							type: "deleteLocation",
							id: location._id
						}
						return newReact.save( (err,doc) => {
							if(err) {
								console.log(err)
								return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
							}
							setTimeout((response, reactions) => {
								reactions.findById(response.id, (err, doc) => {
									if(doc == null) return
									response.clearReactions()
									reactions.deleteOne({_id: doc._id}, err =>{
					          if(err) return console.log(err)
										response.channel.send(utils.errorEmbed("Timed out"))
					        })
								})
							}, 60000, response, reactResponse);
							return response.react("✅")
						})
					})
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
