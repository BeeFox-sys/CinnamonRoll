const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('../util.js');
const schemas = require('../schemas.js');
const locationsModel = mongoose.model('locations', schemas.location)
const guildSettingsModel = mongoose.model('guildsettings', schemas.guildSettings)
const fuzzyjs = require("fuzzyset.js")


module.exports = {
  name: 'location',
  aliases: ['l'],
  description: `Displays location/s, or edits a location`,
  hidden: false,
  args: false,
  argsMin: 0,
  usage: [`**\nLists all locations`,
    `[location]**\nDisplays a single location`,
    `add <name>**\nCreates a new location`,
    `<location> remove**\nDeletes a location`,
    `<location> colour <hex | word>**\nSets the colour for a location`,
    `<location> description <description>**\nSets the description for a location`,
    `<location> reference add <name> <url>**\nAdds a reference link to a location`,
    `<location> reference remove <name>**\nRemoves a reference link from a location`,
    `<location> rename <new name>**\nRenames a location`],
  example: undefined,
  async execute(client, guildSettings, msg, args) {
    const locationsList = guildSettings.locations.sort((a, b) => {
      var nameA = a.name
      var nameB = b.name
      if (nameA) nameA = nameA.toUpperCase()
      if (nameB) nameB = nameB.toUpperCase()
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    })
    if (args.length == 0) {
      await listLocations(guildSettings, locationsList, msg)
      return
    }

    else if ((args[0] == "add" || args[0] == "new" || args[0] == "create") && await utils.checkGameAdmin(guildSettings, msg.member)) {
      args.shift()
      await addLocation(guildSettings, client, msg, args)
      return
    }
    else if ((args[0] == "add" || args[0] == "new" || args[0] == "create") && !await utils.checkGameAdmin(guildSettings, msg.member)) {
      args.shift()
      return msg.channel.send(utils.errorEmbed("You are not a game manager"))
    }

    // Find Location
    args = utils.quoteFinder(args)
    var name = args.shift().toLowerCase()
    var location = await utils.findObjInArray(name, locationsList)
    if (location == null) {
      var locationNames = locationsList.map(location => location.name)
      var locationFuzz = FuzzySet(locationNames).get(name)
      var message = `Location \"${name}\" does not exist`
      if (locationFuzz != null) {
        var suggestedLocations = locationFuzz.map(location => location[1])
        message += `\n***Did you mean:***\n${suggestedLocations.join("\n")}`
      }
      return msg.channel.send(utils.errorEmbed(message))
    }

    // Location editing commands
    if (args.length > 0 && await utils.checkGameAdmin(guildSettings, msg.member)) {
      if (guildSettings.locationLock && location.owner != msg.member.id) return showLocation(location, msg, client)
      switch (args.shift().toLowerCase()) {
        // Colour: <location> colour <hex | word>
        case "colour":
        case "color":
          await setColour(location, client, msg, args)
          return;

        // Description: <location> description <description>
        case "description":
        case "describe":
        case "desc":
          await setDescription(location, client, msg, args)
          return;

        // Reference: <location> reference <add | remove>
        case "reference":
        case "ref":
          await setReference(guildSettings, location, client, msg, args)
          return;

        // Rename: <location> rename <new name>
        case "rename":
        case "name":
          await setName(location, client, msg, args)
          return;

        // Remove location
        case "remove":
        case "delete":
          await removeLocation(location, client, msg, guildSettings)
          return;
      }

      return msg.channel.send(utils.errorEmbed("That is not a valid subcommand"))
    }

    // Finally, if no extra args, show location card
    await showLocation(location, msg, client)
  },
};



// List all locations
async function listLocations(guildSettings, locationsList, msg) {
  if (locationsList.length == 0) {
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
async function showLocation(location, msg, client) {

  if (location.owner) var user = await client.users.fetch(location.owner)
  else user = { tag: "[Orphan Location, please export and import it to correct this error]" }

  var embed = utils.passEmbed()
  embed.setTitle(location.name)
  embed.setFooter(`id: ${location._id} | creator: @${user.tag}`)
  embed.setColor(location.colour)
  embed.setDescription(location.description || "")
  var references = ""
  for (var i = 0; i < location.references.length; i++) {
    references += `\n[${location.references[i].name}](${location.references[i].url})`
  }
  if (references != "") embed.addField("References:", references)
  if (location.references.length > 0) embed.setThumbnail(location.references[0].url)
  return msg.channel.send(embed)
}


// Add location
async function addLocation(guildSettings, client, msg, args) {
  if (args.length > 0) {
    var newLocation = await new locationsModel()
    newLocation.name = args.join(" ").replace(/^"(.+(?="$))"$/, '$1')
    newLocation._id = await utils.generateID(locationsModel)
    newLocation.owner = msg.member.id
    newLocation.guild = guildSettings._id
    return await newLocation.save(async (err, doc) => {
      if (err) {
        console.warn(err)
        return utils.logTraceback(err, client, msg)
      }
      await guildSettings.locations.push(doc._id)
      await guildSettings.save()
      return msg.channel.send(utils.passEmbed(`Created **${doc.name}** \`(${doc._id})\``))
    })
  }
  return msg.channel.send(utils.errorEmbed("You must set a name!"))
}


// Set location colour
async function setColour(location, client, msg, args) {
  var colour = args.join("_").toUpperCase().replace(/^"(.+(?="$))"$/, '$1')
  if (utils.validateColour(colour)) {
    location.colour = colour
    if (colour == "DEFAULT") location.colour = ""
    return await location.save((err, doc) => {
      if (err) {
        console.warn(err)
        return utils.logTraceback(err, client, msg)
      }
      return msg.channel.send(utils.passEmbed(`Set colour to **${doc.colour.toLowerCase() || "default"}**`).setColor(doc.colour))
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
async function setDescription(location, client, msg, args) {
  var desc = args.join(" ")
  if (desc.charAt(0) === '"' && desc.charAt(desc.length - 1) === '"') {
    desc = desc.substr(1, desc.length - 2);
  }
  location.description = desc
  return await location.save((err, doc) => {
    if (err) {
      console.warn(err)
      return utils.logTraceback(err, client, msg)
    }
    if (!location.description) {
      return msg.channel.send(utils.passEmbed(`Cleared description!`))
    }
    else {
      return msg.channel.send(utils.passEmbed(`Set new description!`))
    }
  })
}


// Set location references
async function setReference(guildSettings, location, client, msg, args) {
  if (args.length > 1) {
    switch (args.shift().toLowerCase()) {
      case 'add':
      case 'new':
        if (args.length < 2) return msg.channel.send(utils.errorEmbed("A reference must have a name and a link"))
        var name = utils.quoteFinder(args).shift()
        var url = args[0]
        if (name.length > 30) return msg.channel.send(utils.errorEmbed("Name cannot be longer then 30 locations"))
        var find = location.references.filter(ref => ref.name == name)
        if (find.length != 0) return msg.channel.send(utils.errorEmbed("That reference already exists!"))
        if (utils.validateUrl(url) !== true) return msg.channel.send(utils.errorEmbed(`\`${url}\` is not a valid URL. Make sure the website exists and that the link starts with \`http://\` or \`https://\`.`))
        location.references.push({
          name: name,
          url: url
        })
        return location.save((err, doc) => {
          if (err) {
            console.warn(err)
            return utils.logTraceback(err, client, msg)
          }
          return msg.channel.send(utils.passEmbed(`Added reference \"${name}\"!`))
        })
        break;

      case "remove":
      case "delete":
        if (args.length < 1) return msg.channel.send(utils.errorEmbed("Must supply a reference to delete"))
        var name = utils.quoteFinder(args)[0]
        var find = location.references.filter(ref => ref.name == name)
        if (find.length == 0) return msg.channel.send(utils.errorEmbed(`Reference \"${name}\" doesn't exist!`))
        var index = location.references.indexOf(find[0])
        location.references.splice(index, 1)
        return location.save((err) => {
          if (err) {
            console.warn(err)
            return utils.logTraceback(err, client, msg)
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
async function setName(location, client, msg, args) {
  if (args.length < 1) return msg.channel.send(utils.errorEmbed("A location must have a name!"))
  var newName = args.join(" ").replace(/^"(.+(?="$))"$/, '$1')
  location.name = newName
  return await location.save(err => {
    if (err) {
      console.warn(err)
      return utils.logTraceback(err, client, msg)
    }
    return msg.channel.send(utils.passEmbed(`Updated name to ${location.name}!`))
  })
}


// Remove/delete location
async function removeLocation(location, client, msg, settings) {
  var deleteMessage = await msg.channel.send(utils.passEmbed(`Are you sure you want to delete ${location.name}\`(${location.id})\`?`))
  deleteMessage.react("✅")
  deleteMessage.react("❌")
  var filter = (reaction, user) => {
    return ['✅', "❌"].includes(reaction.emoji.name) && user.id === msg.author.id;
  }
  deleteMessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
    .then(collected => {
      var reaction = collected.first().emoji.name

      deleteMessage.reactions.removeAll()

      if (reaction == "❌") 
        return;

      return locationsModel.deleteOne({ _id: location._id }, (err) => {
        if (err) {
          console.warn(err)
          return utils.logTraceback(error, client, deleteMessage)
        }
        return msg.channel.send(utils.passEmbed(`Deleted location`))
      })
    })
    .catch((error, collected) => {
      if(error.size == 0) msg.channel.send(utils.errorEmbed("Timed Out"))
      else return utils.logTraceback(error, client, deleteMessage)
      deleteMessage.reactions.removeAll()
    })
}