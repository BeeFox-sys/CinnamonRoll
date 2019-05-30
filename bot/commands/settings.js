const Discord = require('discord.js');
const utils = require('../util.js')

module.exports = {
	name: 'settings',
	aliases: ['setting', 'set'],
	description:
	`Show or edit sever settings, Admin Only

	**prefix <prefix>**
	Changes server prefix to \`<prefix>\`
	**role <add|remove> <role name>**
	Adds or removes \`<role name>\` from the list of roles that can edit locations
	**name <name>**
	Sets the server's game name`,
	hidden: false,
	args: false,
	argsMin: 0,
	usage: ['prefix <new prefix>',`role add <role>`, `role remove <role>`, `name <new name>`],
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
					await setRole(guildSettings, msg, args)
					return;

				case "name":
				case "rename":
					await setName(guildSettings, msg, args)
					return;

				default:
					return msg.channel.send(utils.errorEmbed('That is not a subcommand'))
			}
		}
    return msg.channel.send(utils.errorEmbed('You do not have the correct permissions'))
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
		.setColor('#ffaa00')
		.addField('Current Prefix:', guildSettings.prefix, true)
		.addField('Game Manager Roles:', rolesMsg, true)
		.addField('Game Name:', guildSettings.gameName || "`Unset`", true)

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
					return msg.channel.send(utils.passEmbed(role.name+" has been added to manager roles"))
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
		       return msg.channel.send(utils.passEmbed(role.name+" has been removed from manager roles"))
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

