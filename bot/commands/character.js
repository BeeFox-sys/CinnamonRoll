const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('../util.js');
const schemas = require('../schemas.js');
const charactersModel = mongoose.model('characters', schemas.character)
const reactResponse = mongoose.model('reactions', schemas.reaction)

module.exports = {
  name: 'character',
  aliases: ['c', 'char'],
  description: `
**Add <name>**
Adds a new character with the name \`<name>\`
**<character> remove**
Removes the character \`<character>\`
**<character> colour <hex|word>**
Sets \`<character>\`'s colour to a hex code or a word
**<character> description <description>**
Sets \`<character>\`'s description to \`<description>\`
**<character> reference add <name> <url>**
Adds a reference to \`<character>\`
**<character> reference remove <name>**
Removes a reference from \`<character>\`
**<character> rename <name>**
Renames \`<character>\``,
  args: false,
  argsMin: 0,
  usage: [`[character]`,`add <name>`,`<character> remove`,`<character> colour <hex|word>`,`<character> description <description>`, `<character> reference add <name> <url>`,`<character> reference remove <name>`, `<character> rename <New name>`,`<character> avatar <url|attatchment>`],
  example: '',
	async execute(client, guildSettings, msg, args) {
    const charactersList = guildSettings.characters
    if(args.length == 0){
      if(charactersList.length == 0){
        return msg.channel.send(utils.errorEmbed(`This server has no characters\nCreate one with \`${guildSettings.prefix}character add <name>\``))
      }
      response = utils.passEmbed()
      response.setTitle(`Characters for ${guildSettings.gameName || msg.guild.name}`)
      response.description = ""
      for (var index = 0; index < charactersList.length; index++) {
        var character = charactersList[index]
        response.description += `\n**${character.name}** \`(${character._id})\`<@${character.owner}>`
      }
      return msg.channel.send(response)
    }

    else if (args[0] == "add" || args[0] == "new" || args[0] == "create") {
      if(args.length > 1){
        var newCharacter = await new charactersModel()
        newCharacter.name = args.splice(1).join(" ")
        newCharacter._id = await utils.generateID(charactersModel)
        newCharacter.guild = guildSettings._id
        newCharacter.owner = msg.member.id
        newCharacter.proxy = {
          prefix:"",
          suffix:""
        }
        return await newCharacter.save(async (err,  doc)=>{
          if(err) {
            console.log(err)
            return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
          }
          await guildSettings.characters.push(doc._id)
          await guildSettings.save()
          return msg.channel.send(utils.passEmbed(`Created **${doc.name}** \`(${doc._id})\``))
        })
      }
      return msg.channel.send(utils.errorEmbed("You must set a name!"))
    }



		//Find Character
		args = utils.quoteFinder(args)
		var name = args[0]
		var character = utils.findObjInArray(name, charactersList)
		if(character == null) return msg.channel.send(utils.errorEmbed(`Character \"${name}\" does not exist`))

		//Character editing commands
		if(args.length > 1 && character.owner == msg.member.id){
			//Colour: <character> colour <hex|word>
			if(args[1] == "colour" || args[1] == "color"){
				var colour = args.splice(2).join("_").toUpperCase()
				if(utils.valadateColour(colour)){
					character.colour = colour
					if(colour == "DEFAULT") character.colour = ""
					return await character.save((err,  doc)=>{
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

			//Description: <character> description <description>
			else if(args[1] == "description" || args[1] == "desc"){
				desc = args.splice(2).join(" ")
				character.description = desc
				return await character.save((err,  doc)=>{
					if(err) {
						console.log(err)
						return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
					}
					return msg.channel.send(utils.passEmbed(`Set new description!`))
				})
			}
      //reference Command
			else if(args[1] == "reference" || args[1] == "ref"){
        //reference add
				if(args[2] == "add" || args[2] == "new"){
					if(args.length < 5) return msg.channel.send(utils.errorEmbed("A reference must have a name and a link"))
					var name = utils.quoteFinder(args.slice(3))[0]
					var url = utils.quoteFinder(args.slice(3))[1]
					if(name.length > 30) return msg.channel.send(utils.errorEmbed("Name cannot be longer then 30 characters"))
					var find = character.references.filter(ref => ref.name == name)
					if(find.length != 0) return msg.channel.send(utils.errorEmbed("That reference already exists!"))
					character.references.push({
						name: name,
						url: url
					})
					return character.save((err,  doc)=>{
						if(err) {
							console.log(err)
							return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
						}
						return msg.channel.send(utils.passEmbed(`Added reference \"${name}\"!`))
					})
				}
<<<<<<< Updated upstream

         else if(args[2] == "remove" || args[2] == "delete"){
=======
        //reference delete
        else if(args[2] == "remove" || args[2] == "delete"){
>>>>>>> Stashed changes
					if(args.length < 4) return msg.channel.send(utils.errorEmbed("Must supply a reference to delete"))
					var name = utils.quoteFinder(args.slice(3))[0]
					var find = character.references.filter(ref => ref.name == name)
					if(find.length == 0) return msg.channel.send(utils.errorEmbed(`Reference \"${name}\" doesn't exist!`))
					var index = character.references.indexOf(find[0])
					character.references.splice(index,1)
					return character.save((err) => {
						if(err){
							console.log(err)
						  return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
						}
						return msg.channel.send(utils.passEmbed(`Removed reference \"${name}\"!`))
					})
				}
			}
<<<<<<< Updated upstream

=======
      //avatar command
>>>>>>> Stashed changes
      else if (args[1] == "avatar") {
        attachments = utils.attachmentsToFileOptions(msg.attachments)
        if(!attachments){character.avatar = args[2] || undefined}
				else {character.avatar = attachments[0].attachment}
				return await character.save((err,  doc)=>{
					if(err) {
						console.log(err)
						return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
					}
					return msg.channel.send(utils.passEmbed(`Updataed avatar!`))
				})
      }
<<<<<<< Updated upstream

=======
      //rename
      else if(args[1] == "rename"){
        if(args.length < 3) return msg.channel.send(utils.errorEmbed("A character must have a name!"))
        newName = args.slice(2).join(" ")
        character.name = newName
        return await character.save(err => {
            if(err){
              console.log(err)
              return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
            }
            return msg.channel.send(utils.passEmbed(`Updataed name to ${character.name}!`))
          })
      }
      //proxy
      else if (args[1] == "proxy") {
        proxy = args.slice(2).join(" ")
        if(!args.length == 2){
          proxy.split("text")
          prefix = proxy[0].trim() || ""
          suffix = proxy[1].trim() || ""
          objReturn = {
            prefix: prefix,
            suffix: suffix
          }
          response = `Updated proxy\nExample message :\`${preifx}Hello World${suffix}\``
        } else {
          objReturn = {
            prefix:"",
            suffix:""
          }
          response = `Disabled proxy`
        }
        character.proxy = objReturn
        return await character.save(err => {
            if(err){
              console.log(err)
              return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
            }
            return msg.channel.send(utils.passEmbed(response))
          })
      }
      //delete command
>>>>>>> Stashed changes
			else if(args[1] == "remove" || args[1] == "delete" || args[1] == "destroy"){
				return msg.channel.send(utils.passEmbed(`React ✅ to delete ${character.name}`))
					.then(async response => {
						newReact = await new reactResponse()
						newReact._id = response.id
						newReact.user = msg.member.id
						newReact.settings = {
							type: "deleteCharacter",
							id: character._id
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


		//return character
		embed = utils.passEmbed()
		embed.setTitle(character.name)
		embed.setFooter(character._id)
		embed.setColor(character.colour)
		embed.setDescription(character.description || "")
		var references = ""
		for (var i = 0; i < character.references.length; i++) {
			references += `\n[${character.references[i].name}](${character.references[i].url})`
		}
		if(references != "") embed.addField("References:",references)
    if(character.avatar) embed.setThumbnail(character.avatar)
<<<<<<< Updated upstream
=======
    if(character.proxy.prefix != ""||character.proxy.suffix != "")embed.addField("Proxy:",`\`${character.proxy.prefix}text${character.proxy.suffix}\``)
>>>>>>> Stashed changes
		return msg.channel.send(embed)

	},
};
