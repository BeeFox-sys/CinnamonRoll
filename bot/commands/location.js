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
	hidden: false,
	args: false,
	argsMin: 0,
	usage: [`[location]`,`add <name>`,`<location> remove <name>`,`<location> colour <hex | word>`,`<location> description <description>`, `<location> reference add <name> <url>`,`<location> reference remove <name>`, `<location> rename <new name>`],
	example: '',
	async execute(client, guildSettings, msg, args) {
    const locationsList = guildSettings.locations.sort((a,b)=>{
      var nameA = a.name
      var nameB = b.name
      if(nameA) nameA = nameA.toUpperCase()
      if(nameB) nameB = nameB.toUpperCase()
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    })
    if(args.length == 0){
			await listLocations(guildSettings, locationsList, msg)
			return
		}

    else if (args[0] == "add" || args[0] == "new" || args[0] == "create") {
			await addLocation(guildSettings, msg, args)
			return
    }


		//Find Location
		args = utils.quoteFinder(args)
		var name = args[0]
		var location = utils.findObjInArray(name, locationsList)
		if(location == null) return msg.channel.send(utils.errorEmbed(`Location \"${name}\" does not exist`))

		//Location editing commands
		if(args.length > 1 && utils.checkGameAdmin(guildSettings, msg.member)){
			switch (args[1].toLowerCase()) {
			//Colour: <location> colour <hex | word>
				case "colour":
        case "color":
          await setColour(location, msg, args)
        return;

				//Description: <location> description <description>
				case "description":
				case "describe":
				case "desc":
					await setDescription(location, msg, args)
				return;

			// Reference: <location> reference <add | remove>
			case "reference":
					case "ref":
						await setReference(guildSettings, location, msg, args)
					return;

			// Rename: <location> rename <new name>
      case "rename":
        case "name":
          await setName(location, msg, args)
				return;

			//remove command
			case "remove":
        case "delete":
          await removeLocation(location, msg)
				return;
			}

			return msg.channel.send(utils.errorEmbed("That is not a valid subcommand"))
		}


		// Finally, if no extra args, show location card
		await showLocation(location, msg)
	},
};



// List all locations
async function listLocations(guildSettings, locationsList, msg) {
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


// Show location card
async function showLocation(location, msg) {
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
	  if(location.references.length > 0) embed.setThumbnail(location.references[0].url)
		return msg.channel.send(embed)
}


// Add location
async function addLocation(guildSettings, msg, args) {
	if(args.length > 1){
		var newLocation = await new locationsModel()
		newLocation.name = args.splice(1).join(" ")
		newLocation._id = await utils.generateID(locationsModel)
		newLocation.guild = guildSettings._id
		return await newLocation.save(async (err,  doc)=>{
			if(err) {
				console.warn(err)
				return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
			}
			await guildSettings.locations.push(doc._id)
			await guildSettings.save()
			return msg.channel.send(utils.passEmbed(`Created **${doc.name}** \`(${doc._id})\``))
		})
	}
	return msg.channel.send(utils.errorEmbed("You must set a name!"))
}


// Set location colour
async function setColour(location, msg, args) {
  var colour = args.splice(2).join("_").toUpperCase()
  if(utils.valadateColour(colour)){
  	location.colour = colour
  	if(colour == "DEFAULT") location.colour = ""
  	return await location.save((err,  doc)=>{
  		if(err) {
  			console.warn(err)
  			return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
  		}
  		return msg.channel.send(utils.passEmbed(`Set colour to **${doc.colour.toLowerCase() || "default"}**`))
  	})
  }
  var embed = utils.errorEmbed()
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


// Set location description
async function setDescription(location, msg, args) {
  var desc = args.splice(2).join(" ")
  location.description = desc
  return await location.save((err,  doc)=>{
    if(err) {
      console.warn(err)
      return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
    }
    if(!location.description) {
      return msg.channel.send(utils.passEmbed(`Cleared description!`))
    }
    else {
    return msg.channel.send(utils.passEmbed(`Set new description!`))
    }
  })
}


// Set location references
async function setReference(guildSettings, location, msg, args) {
  if(args.length > 2) {
    switch (args[2].toLowerCase()) {
      case 'add':
      case 'new':
        if(args.length < 5) return msg.channel.send(utils.errorEmbed("A reference must have a name and a link"))
        var name = utils.quoteFinder(args.slice(3))[0]
        var url = utils.quoteFinder(args.slice(3))[1]
        if(name.length > 30) return msg.channel.send(utils.errorEmbed("Name cannot be longer then 30 locations"))
        var find = location.references.filter(ref => ref.name == name)
        if(find.length != 0) return msg.channel.send(utils.errorEmbed("That reference already exists!"))
        location.references.push({
          name: name,
          url: url
        })
        return location.save((err,  doc)=>{
          if(err) {
            console.warn(err)
            return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
          }
          return msg.channel.send(utils.passEmbed(`Added reference \"${name}\"!`))
        })
      break;

      case "remove":
      case "delete":
        if(args.length < 4) return msg.channel.send(utils.errorEmbed("Must supply a reference to delete"))
        var name = utils.quoteFinder(args.slice(3))[0]
        var find = location.references.filter(ref => ref.name == name)
        if(find.length == 0) return msg.channel.send(utils.errorEmbed(`Reference \"${name}\" doesn't exist!`))
        var index = location.references.indexOf(find[0])
        location.references.splice(index,1)
        return location.save((err) => {
          if(err){
            console.warn(err)
            return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
          }
          return msg.channel.send(utils.passEmbed(`Removed reference \"${name}\"!`))
        })
      break;

      default:
          return;
    }
  }
  return msg.channel.send(utils.errorEmbed(`You must specify whether you want to add or remove a reference!\nIf you want to view the current references of \`${location.name}\`, type \`${guildSettings.prefix}location ${location.name}\``))
}


// Set location name (rename)
async function setName(location, msg, args) {
  if(args.length < 3) return msg.channel.send(utils.errorEmbed("A location must have a name!"))
  var newName = args.slice(2).join(" ")
  location.name = newName
  return await location.save(err => {
      if(err){
        console.warn(err)
        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
      }
      return msg.channel.send(utils.passEmbed(`Updated name to ${location.name}!`))
    })
}


// Remove/delete location
async function removeLocation(location, msg) {
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
        console.warn(err)
        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
      }
      setTimeout((response, reactions) => {
        reactions.findById(response.id, (err, doc) => {
          if(doc == null) return
          response.clearReactions()
          reactions.deleteOne({_id: doc._id}, err =>{
            if(err) return console.warn(err)
            response.channel.send(utils.errorEmbed("Timed out"))
          })
        })
      }, 1000*60, response, reactResponse);
      return response.react("✅")
    })
  })
}