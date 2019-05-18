const Discord = require('discord.js');
const utils = require('../util.js')

module.exports = {
	name: 'settings',
	aliases: ['setting', 'set'],
	description: 'Changes server prefix, admin only',
	args: false,
	argsMin: 0,
	usage: '[prefix <new prefix>]',
	example: 'prefix rp!',
	execute(client, guildSettings, msg, args) {
		if(msg.member.hasPermission("MANAGE_GUILD")){
			if(args.length == 0){
				//Settings

				let roles = new Discord.Collection()
				for (i = 0; i < guildSettings.admin.length; i++) {
			    roles.set(guildSettings.admin[i], msg.guild.roles.get(guildSettings.admin[i]))
			  }
				var rolesMsg = ""
				if(roles.size == 0){rolesMsg = "`None`"}
			  else{roles.tap(role => {rolesMsg += `\n${role.name}`})}


				embed = utils.warnEmbed()
					.setColor('#ffaa00')
					.addField('Current Prefix:', guildSettings.prefix, true)
					.addField('Game Manager Roles:', rolesMsg, true)
					.addField('Game Name:', guildSettings.gameName || "`Unset`", true)

				return msg.channel.send(embed)
			}


			//prefix subcommand
			else if (args[0] == 'prefix') {
				if(args.length < 2){
					return msg.channel.send(utils.errorEmbed('You must supply a prefix to change to'))
				}
				guildSettings.prefix = args[1]
				return guildSettings.save((err, doc) => {
		      if(err){
		        console.log(err)
		        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command!"))
		      } else {
		        return msg.channel.send(utils.passEmbed(`Prefix changed to \`${doc.prefix}\``))
		      }
		    })
			}


			//Manager Roles
			else if (args[0] == "role" && (args[1] == "add" || args[1] == "remove")) {
				const guildRoles = msg.guild.roles
				roleName = args.slice(2).join(" ")
				role = guildRoles.find(roleFind => roleFind.name === roleName);
				response = ""
				if(role == null) return msg.channel.send(utils.errorEmbed("That role was not found"))
				if (args[1] == "add"){
					if(guildSettings.admin.find((roleID)=>{return roleID == role.id})) return msg.channel.send(utils.errorEmbed("That role is already a manager!"))
					guildSettings.admin.push(role.id)
					response = role.name+" has been added to manager roles"
				}
				else if(args[1] == "remove"){
					if(!guildSettings.admin.find((roleID)=>{return roleID == role.id})) return msg.channel.send(utils.errorEmbed("That role isn't a manager!"))
					pos = guildSettings.admin.indexOf(role.id)
					guildSettings.admin.splice(pos, 1)
					response = role.name+" has been removed from manager roles"
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
			//name
			else if (args[0] == "name") {
				if(args.length > 2){
					guildSettings.gameName = args.slice(1).join(" ")
					response = `Name set to **${guildSettings.gameName}**`
				} else {
					guildSettings.gameName = ""
					response = "Name Cleared"
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


			return msg.channel.send(utils.errorEmbed('That is not a subcommand'))
		}
    return msg.channel.send(utils.errorEmbed('You do not have the correct permissions'))
	}
};
