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
  **<character> proxy [example match]**
  Sets the proxy tags for \`<character>\` by the example match given.
  Proxy tags enable you to speak as your character by typing text between the set tags.
  Try out square brackets as proxy tags by using \`[text]\` as the example match.
  **<character> avatar [attachment | url]**
  Sets the avatar for \`<character>\` to the attached image or the image at the URL
  **<character> colour <hex | word>**
  Sets \`<character>\`'s colour to a hex code or a word
  **<character> description <description>**
  Sets \`<character>\`'s description to \`<description>\`
  **<character> reference add <name> <url>**
  Adds a reference to \`<character>\`
  **<character> reference remove <name>**
  Removes a reference from \`<character>\`
  **<character> rename <name>**
  Renames \`<character>\``,
  hidden: false,
  args: false,
  argsMin: 0,
  usage: [`[character]`,`add <name>`,`<character> remove`,`<character> colour <hex | word>`,`<character> description <description>`, `<character> reference add <name> <url>`,`<character> reference remove <name>`, `<character> rename <New name>`,`<character> avatar <url | attatchment>`],
  example: '',
	async execute(client, guildSettings, msg, args) {
    const charactersList = guildSettings.characters.sort((a,b)=>{
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
    if(args.length == 0) {
      await listCharacters(guildSettings, charactersList, msg)
      return
    }

    else if (args[0] == "add" || args[0] == "new" || args[0] == "create") {
      await addCharacter(guildSettings, msg, args)
      return
    }


		//Find Character
		args = utils.quoteFinder(args)
		var name = args[0]
		var character = utils.findObjInArray(name, charactersList)
		if(character == null) return msg.channel.send(utils.errorEmbed(`Character \"${name}\" does not exist`))

		//Character editing commands
		if(args.length > 1 && character.owner == msg.member.id){
      switch (args[1].toLowerCase()) {

        //Colour: <character> colour <hex | word>
        case "colour":
        case "color":
          await setColour(character, msg, args)
        return;

        //Description: <character> description <description>
        case "description":
        case "describe":
        case "desc":
          await setDescription(character, msg, args)
        return;

        // Reference: <character> reference <add | remove>
        case "reference":
        case "ref":
          await setReference(guildSettings, character, msg, args)
        return;

        case "avatar":
        case "icon":
          await setAvatar(character, msg, args)
        return;

        case "rename":
        case "name":
          await setName(character, msg, args)
        return;

        case "proxy":
        case "tags":
          await setProxy(character, msg, args)
        return;

        case "remove":
        case "delete":
          await removeCharacter(character, msg)
        return;

        default:
          return msg.channel.send(utils.errorEmbed("That is not a valid subcommand"))
      }
    }

		// Finally, if no extra args, return character card
		await showCharacter(character, msg)
	},
};



// List all characters
async function listCharacters(guildSettings, charactersList, msg) {
  if(charactersList.length == 0){
    return msg.channel.send(utils.errorEmbed(`This server has no characters\nCreate one with \`${guildSettings.prefix}character add <name>\``))
  }
  var response = utils.passEmbed()
  response.setTitle(`Characters for ${guildSettings.gameName || msg.guild.name}`)
  response.description = ""

  var part = 1

  for (var index = 0; index < charactersList.length; index++) {
    var character = charactersList[index]
    response.description += `\n**${character.name}** \`(${character._id})\`<@${character.owner}>`
    if(response.description.length > 1800){
      part += 1
      await msg.channel.send(response)
      response = utils.passEmbed()
      response.setTitle(`Characters for ${guildSettings.gameName || msg.guild.name} part ${part}`)
      response.description = ""
    }
  }
  return msg.channel.send(response)
}


// Show character card
async function showCharacter(character, msg) {
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
    if(character.avatar || character.references.length > 0) embed.setThumbnail(character.avatar || character.references[0].url)

    if(character.proxy.prefix != ""||character.proxy.suffix != "")embed.addField("Proxy:",`\`${character.proxy.prefix}text${character.proxy.suffix}\``)

		return msg.channel.send(embed)
}


// Add a character
async function addCharacter(guildSettings, msg, args) {
  if(args.length > 1) {
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
        console.warn(err)
        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
      }
      await guildSettings.characters.push(doc._id)
      await guildSettings.save()
      return msg.channel.send(utils.passEmbed(`Created **${doc.name}** \`(${doc._id})\``))
    })
  }
  return msg.channel.send(utils.errorEmbed("You must set a name!"))
}


// Set character colour
async function setColour(character, msg, args) {
  var colour = args.splice(2).join("_").toUpperCase()
  if(utils.valadateColour(colour)){
  	character.colour = colour
  	if(colour == "DEFAULT") character.colour = ""
  	return await character.save((err,  doc)=>{
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


// Set character description
async function setDescription(character, msg, args) {
  var desc = args.splice(2).join(" ")
  character.description = desc
  return await character.save((err,  doc)=>{
    if(err) {
      console.warn(err)
      return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
    }
    if(!character.description) {
      return msg.channel.send(utils.passEmbed(`Cleared description!`))
    }
    else {
    return msg.channel.send(utils.passEmbed(`Set new description!`))
    }
  })
}


// Set character references
async function setReference(guildSettings, character, msg, args) {
  if(args.length > 2) {
    switch (args[2].toLowerCase()) {
      case 'add':
      case 'new':
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
        var find = character.references.filter(ref => ref.name == name)
        if(find.length == 0) return msg.channel.send(utils.errorEmbed(`Reference \"${name}\" doesn't exist!`))
        var index = character.references.indexOf(find[0])
        character.references.splice(index,1)
        return character.save((err) => {
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
  return msg.channel.send(utils.errorEmbed(`You must specify whether you want to add or remove a reference!\nIf you want to view \`${character.name}\`'s current references, type \`${guildSettings.prefix}character ${character.name}\``))
}


// Set character avatar
async function setAvatar(character, msg, args) {
  var attachments = utils.attachmentsToFileOptions(msg.attachments)
  if(!attachments){character.avatar = args[2] || undefined}
  else {character.avatar = attachments[0].attachment}
  return await character.save((err,  doc)=>{
    if(err) {
      console.warn(err)
      return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
    }
    if(character.avatar == undefined) {
      return msg.channel.send(utils.passEmbed(`Cleared avatar!`))
    }
    else {
    return msg.channel.send(utils.passEmbed(`Updated avatar!`))
    }
  })
}


// Set character name (rename)
async function setName(character, msg, args) {
  if(args.length < 3) return msg.channel.send(utils.errorEmbed("A character must have a name!"))
  var newName = args.slice(2).join(" ")
  character.name = newName
  return await character.save(err => {
      if(err){
        console.warn(err)
        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
      }
      return msg.channel.send(utils.passEmbed(`Updated name to ${character.name}!`))
    })
}


// Set character proxy tags
async function setProxy(character, msg, args) {
  var proxy = args.slice(2).join(" ");
  var response;
  if(args.length > 2){
    proxy = proxy.split("text")

    var prefix = proxy[0].trim() || ""
    var suffix = proxy[1].trim() || ""
    if(prefix == "" && suffix == "") return msg.channel.send(utils.errorEmbed("Cannot have an empty proxy!\nExample proxy setting: `-text-`"))
    objReturn = {
      prefix: prefix,
      suffix: suffix
    }
    response = `Updated proxy\nExample message :\`${prefix}Hello World${suffix}\``
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
      console.warn(err)
      return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
    }
    return msg.channel.send(utils.passEmbed(response))
  })
}


// Remove/delete character
async function removeCharacter(character, msg) {
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