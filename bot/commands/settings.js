const Discord = require('discord.js');
const utils = require('../util.js')

module.exports = {
	name: 'settings',
	aliases: ['setting', 'set'],
	description:`Show or edit sever settings, Admin Only`,
	hidden: false,
	args: false,
	argsMin: 0,
	usage: [`**\nDisplays current settings`,
					`prefix <new prefix>**\nChanges the bot's prefix`,
					`role add <role>**\nAdds a role to the Game Manager roles`, 
					`role remove <role>**\nRemoves a role from the Game Manager roles`, 
					`name <new name>**\nChanges the name of the game`,
					`import**\nToggles the import command`,
					`locationlock**\nToggles location lock\n-Enabled: Game Managers can only edit their locations\n-Disabled: Game Managers can edit all locations`,
					`remove <character | location> <id | name>**\nRemoves specified character/location from the serever\nUseful for deleting characters if a user leaves`],
	example: '',
	async execute(client, guildSettings, msg, args) {
		if(msg.member.hasPermission("MANAGE_GUILD")){
			if(args.length == 0){ 
				await displaySettings(guildSettings, msg)
				return
			}

			switch (args[0]) {
				case "prefix":
					await setPrefix(guildSettings, msg, args)
					return;

				case "role":
				case "roles":
					await setRole(guildSettings, msg, args)
					return;

				case "import":
					await toggleImport(guildSettings, msg, args)
					return;

				case "locationlock":
					await toggleLocationLock(guildSettings, msg, args)
				break;

				case "name":
				case "rename":
					if(args.length > 1){
						guildSettings.gameName = args.slice(1).join(" ")
						var response = `Name set to **${guildSettings.gameName}**`
					} else {
						guildSettings.gameName = ""
						var response = "Name Cleared"
					}
					return guildSettings.save((err, doc) => {
			      if(err){
			        console.log(err)
			        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
			      } else {
			        return msg.channel.send(utils.passEmbed(response))
			      }
			    })
				break;

				case "delete":
				case "remove":
					switch (args[1]) {
						case "location":
							removeLocation(msg, guildSettings, args)
						break;
						case "character":
							removeCharacter(msg, guildSettings, args)
						break
					}
				break

				case "reset":
					if(args[1] == guildSettings._id){
						return utils.eraseGuild(msg, guildSettings._id)
					} else {
						return msg.channel.send(utils.errorEmbed(`Are you absolutely sure you want to do this?\nThis will delete all server settings, locations, and characters in this server!\nTo reset the server, run this command again with the servers id as an argument\n\`${guildSettings.prefix}settings reset ${guildSettings._id}\``))
					}
				break;

				default:
					return msg.channel.send(utils.errorEmbed('That is not a subcommand'))
				break
			}
		}
		else return msg.channel.send(utils.errorEmbed('You do not have the correct permissions'))
	}
}


// Display current settings
async function displaySettings(guildSettings, msg) {
	let roles = new Discord.Collection()
	for (i = 0; i < guildSettings.admin.length; i++) {
		roles.set(guildSettings.admin[i], msg.guild.roles.get(guildSettings.admin[i]))
	}
	var rolesMsg = ""
	if(roles.size == 0){rolesMsg = "`None`"}
	else{roles.tap(role => {rolesMsg += `\n${role.name}`})}


	embed = utils.warnEmbed()
		.addField('Current Prefix:', guildSettings.prefix, true)
		.addField('Game Manager Roles:', rolesMsg, true)
		.addField('Game Name:', guildSettings.gameName || "`Unset`", true)

		if(guildSettings.enableImport) embed.addField('Importing:', "Enabled", true)
		else embed.addField('Importing:', "Disabled", true)

		if(guildSettings.locationLock) embed.addField('Location Lock:', "Enabled", true)
		else embed.addField('Location Lock:', "Disabled", true)

	return msg.channel.send(embed)
}


// Set server prefix
async function setPrefix(guildSettings, msg, args) {
	if(args.length < 2){
		return msg.channel.send(utils.errorEmbed('You must supply a prefix to change to'))
	}
	guildSettings.prefix = args.slice(1).join(" ")
	return guildSettings.save((err, doc) => {
		if(err){
			console.log(err)
			return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
		} else {
			return msg.channel.send(utils.passEmbed(`Prefix changed to \`${doc.prefix}\``))
		}
	})
}


// Set server roles
async function setRole(guildSettings, msg, args) {
	var guildRoles = msg.guild.roles
	var roleName = args.slice(2).join(" ")
	var role = guildRoles.find(roleFind => roleFind.name === roleName);
	switch (args[1]) {
		case "add":
			if(role == null) return msg.channel.send(utils.errorEmbed("That role was not found"))
			if(guildSettings.admin.find((roleID)=>{return roleID == role.id})) return msg.channel.send(utils.errorEmbed("That role is already a manager!"))
			guildSettings.admin.push(role.id)
			return guildSettings.save((err, doc) => {
				if(err){
					console.log(err)
					return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
				} else {
					return msg.channel.send(utils.passEmbed(role.name+" has been added to Game Manager roles"))
				}
			})
		break;

		case "remove":
			if(role == null) return msg.channel.send(utils.errorEmbed("That role was not found"))
			if(!guildSettings.admin.find((roleID)=>{return roleID == role.id})) return msg.channel.send(utils.errorEmbed("That role isn't a manager!"))
			pos = guildSettings.admin.indexOf(role.id)
			guildSettings.admin.splice(pos, 1)
			return guildSettings.save((err, doc) => {
		     if(err){
		       console.log(err)
		       return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
		     } else {
		       return msg.channel.send(utils.passEmbed(role.name+" has been removed from Game Manager roles"))
		     }
		   })
		break;

		default:
			return msg.channel.send(utils.errorEmbed("That is not a valid option\nValid options are `add` and `remove`"))
		}
}


// Set server game name
async function setName(guildSettings, msg, args) {
	if(args.length > 1){
		guildSettings.gameName = args.slice(1).join(" ")
		var response = `Name set to **${guildSettings.gameName}**`
	} else {
		guildSettings.gameName = ""
		var response = "Name Cleared"
	}

	return guildSettings.save((err, doc) => {
		if(err){
			console.log(err)
			return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
		} else {
			return msg.channel.send(utils.passEmbed(response))
		}
	})
}

//Toggle Import
function toggleImport(guildSettings, msg, args) {
	var currentImport = guildSettings.enableImport
	guildSettings.enableImport = !currentImport
	guildSettings.save((err,doc) => {
		if(err){
		console.log(err)
		return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
	}
	if(doc.enableImport) return msg.channel.send(utils.passEmbed("Enabled importing"))
	return msg.channel.send(utils.passEmbed("Disabled importing"))
})
}

//Toggle Location Lock
function toggleLocationLock(guildSettings, msg, args) {
	var currentLock = guildSettings.locationLock
	guildSettings.locationLock = !currentLock
	return guildSettings.save((err,doc) => {
		if(err){
		console.log(err)
		return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
	}
	if(doc.locationLock) return msg.channel.send(utils.passEmbed("Enabled Location Lock\nGame Managers can only edit locations created by them"))
	return msg.channel.send(utils.passEmbed("Disabled Location Lock\nGame Managers can edit all locations"))
})
}



//Delete location
const mongoose = require('mongoose')
const schemas = require('../schemas.js');
const locationsModel = mongoose.model('locations', schemas.location)
const charactersModel = mongoose.model('locations', schemas.location)
const guildSettingsModel = mongoose.model('guildsettings', schemas.guildSettings)

async function removeLocation(msg, settings, args) {

	//Find location
	args = utils.quoteFinder(args)
	var name = args[2]
	var location = await utils.findObjInArray(name, settings.locations)
	if(location == null) return msg.channel.send(utils.errorEmbed(`Location \"${name}\" does not exist`))

	//Create Prompt
  var deleteMessage = await msg.channel.send(utils.passEmbed(`React ✅ to delete location ${location.name}\`(${location.id})\``))
	deleteMessage.react("✅")
	
	//Await reactions
	var filter = (reaction, user)=>{
    return ['✅'].includes(reaction.emoji.name) && user.id === msg.author.id;
	}
  deleteMessage.awaitReactions(filter,{max:1, time: 60000, errors:['time']})
    .then(collected => {

      deleteMessage.clearReactions()

			//Remove from locations array
      guildSettingsModel.updateOne({_id:settings.id}, {$pull: {locations: location.id}}, (err, doc) =>{
        if(err) {
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("Something went wrong with that reaction")
          )}
      });
			
			//delete location
      return locationsModel.deleteOne({_id: location._id}, (err) =>{
        if(err) {
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
        }
        return msg.channel.send(utils.passEmbed(`Deleted location`))
      })
    })
    .catch(collected => {
      msg.channel.send(utils.errorEmbed("Timed Out"))
      deleteMessage.clearReactions()
    })
}

async function removeCharacter(msg, settings, args) {

	//Find character
	args = utils.quoteFinder(args)
	var name = args[2]
	var character = await utils.findObjInArray(name, settings.characters)
	if(character == null) return msg.channel.send(utils.errorEmbed(`character \"${name}\" does not exist`))

	//Create Prompt
  var deleteMessage = await msg.channel.send(utils.passEmbed(`React ✅ to delete character ${character.name}\`(${character.id})\``))
	deleteMessage.react("✅")
	deleteMessage.react("❌")
	
	//Await reactions
	var filter = (reaction, user)=>{
    return ['✅','❌'].includes(reaction.emoji.name) && user.id === msg.author.id;
	}
  deleteMessage.awaitReactions(filter,{max:1, time: 60000, errors:['time']})
    .then(collected => {

			var reaction = collected.first().emoji.name

			deleteMessage.clearReactions()
			
			if(reaction == "❌") return

			//Remove from characters array
      guildSettingsModel.updateOne({_id:settings.id}, {$pull: {characters: character.id}}, (err, doc) =>{
        if(err) {
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("Something went wrong with that reaction")
          )}
      });
			
			//delete character
      return charactersModel.deleteOne({_id: character._id}, (err) =>{
        if(err) {
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
        }
        return msg.channel.send(utils.passEmbed(`Deleted character`))
      })
    })
    .catch(collected => {
      msg.channel.send(utils.errorEmbed("Timed Out"))
      deleteMessage.clearReactions()
    })
}

