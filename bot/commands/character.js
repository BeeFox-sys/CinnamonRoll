const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('../util.js');
const schemas = require('../schemas.js');
const charactersModel = mongoose.model('characters', schemas.character)
const guildSettingsModel = mongoose.model('guildsettings', schemas.guildSettings)

module.exports = {
  name: 'character',
  aliases: ['c', 'char'],
  description: `Lists characters, Shows a character, or edits one of your characters`,
  hidden: false,
  args: false,
  argsMin: 0,
  usage: [`**\nLists all characters`,
          `<character>**\nShows one character`,
          `add <name>**\nCreates a new character`,
          `<character> remove**\nDeletes a character`,
          `<character> colour <hex | word>**\nSets a characters colour`,
          `<character> description <description>**\nSets a characters description`, 
          `<character> reference add <name> <url>**\nAdds a reference link to the character`,
          `<character> reference remove <name>**\nRemoves a reference link from the character `, 
          `<character> rename <New name>**\nRenames the character`,
          `<character> avatar <url | attatchment>**\nSets the characters avatar`,
          `<character> brithday <birthday>**\nSets the characters birthday`,
          `<character> nickname <nickname>**\nSets the characters nickname`,
          `<character> proxy <prefix>text<suffix>**\nSets the characters proxy`,
          `<character> pronouns <pronouns>**\nSets the characters pronouns`],
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
        case "references":
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

        case "displayname":
        case "nickname":
          await setDisplayName(character, msg, args)
        return;

        case "pronouns":
          await setPronouns(character, msg, args)
        return;

        case "birthday":
          await setBirthday(character, msg, args)
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
            await showCharacter(character, msg, client)
      }
    }
    else await showCharacter(character, msg, client)
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
async function showCharacter(character, msg, client) {

  user = await client.fetchUser(character.owner)

  embed = utils.passEmbed()
		embed.setTitle(character.name)
		embed.setFooter(`id: ${character._id} | creator: @${user.tag}`)
    embed.setColor(character.colour)
    if(character.avatar || character.references.length > 0) embed.setThumbnail(character.avatar || character.references[0].url)

    if(character.displayName != "") embed.addField("Display Name:",character.displayName, true)
    if(character.pronouns != "") embed.addField("Pronouns:",character.pronouns, true)
    if(character.birthday != "") embed.addField("Birthday:",character.birthday, true)

    if(character.proxy.prefix != ""||character.proxy.suffix != "")embed.addField("Proxy:",`\`${character.proxy.prefix}text${character.proxy.suffix}\``, true)

    if(character.description != "") embed.addField("Description:",character.description)

    var references = ""
		for (var i = 0; i < character.references.length; i++) {
			references += `\n[${character.references[i].name}](${character.references[i].url})`
		}
		if(references != "") embed.addField("References:",references)

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
  var deleteMessage = await msg.channel.send(utils.passEmbed(`React ✅ to delete ${character.name}\`(${character.id})\``))
  await deleteMessage.react("✅")
  await deleteMessage.react("❌")
  var filter = (reaction, user)=>{
    return ['✅',"❌"].includes(reaction.emoji.name) && user.id === msg.author.id;
  }
  deleteMessage.awaitReactions(filter,{max:1, time: 60000, errors:['time']})
    .then(collected => {
      var reaction = collected.first().emoji.name

      deleteMessage.clearReactions()

      if(reaction == "❌") return

      guildSettingsModel.updateOne({_id:settings.id}, {$pull: {characters: character.id}}, (err, doc) =>{
        if(err) {
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("Something went wrong with that reaction")
          )}
      });
      
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

async function setDisplayName(character, msg, args){
  var newName = args.slice(2).join(" ")
  character.displayName = newName
  return await character.save((err, doc) => {
      if(err){
        console.warn(err)
        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
      }
      if(doc.displayName == "") return msg.channel.send(utils.passEmbed(`Cleared Display Name!`))

      return msg.channel.send(utils.passEmbed(`Updated display name to ${doc.displayName}!`))
    })
}

async function setPronouns(character, msg, args){
  var pronouns = args.slice(2).join(" ")
  character.pronouns = pronouns
  return await character.save((err, doc) => {
      if(err){
        console.warn(err)
        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
      }
      if(doc.pronouns == "") return msg.channel.send(utils.passEmbed(`Cleared pronouns!`))
      return msg.channel.send(utils.passEmbed(`Updated pronouns to ${doc.pronouns}!`))
    })
}

async function setBirthday(character, msg, args){
  var birthday = args.slice(2).join(" ")
  character.birthday = birthday
  return await character.save((err, doc) => {
      if(err){
        console.warn(err)
        return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
      }
      if(doc.birthday == "") return msg.channel.send(utils.passEmbed(`Cleared birthday!`))
      return msg.channel.send(utils.passEmbed(`Updated birthday to ${doc.birthday}!`))
    })
}