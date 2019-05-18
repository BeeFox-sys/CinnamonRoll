const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('../util.js');
const schemas = require('../schemas.js');
const locationsModel = mongoose.model('locations', schemas.location)

module.exports = {
	name: 'location',
	aliases: ['l'],
	description: `Location Command`,
	args: false,
	argsMin: 0,
	usage: '',
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
        console.log(location)
        response.description += `\n**${location.name}** \`(${location._id})\` `
      }
      return msg.channel.send(response)
    }

    else if (args[0] == "new") {
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



    return msg.channel.send(utils.errorEmbed("That is not a subcommand"))

	},
};
