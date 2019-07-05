const Discord = require('discord.js');
const mongoose = require('mongoose');
const utils = require('../util.js');
const schemas = require('../schemas.js');
const charactersModel = mongoose.model('characters', schemas.character);
const guildSettingsModel = mongoose.model('guildsettings', schemas.guildSettings);
const fuzzyjs = require("fuzzyset.js")

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
          `<character> birthday <birthday>**\nSets the characters birthday`,
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
      args.shift()
      await addCharacter(guildSettings, msg, args)
      return
    }


		//Find Character
		args = utils.quoteFinder(args)
		var name = args.shift().toLowerCase()
		var character = utils.findObjInArray(name, charactersList)
		if(character == null) {
      var characterNames = charactersList.map(character => character.name)
      var characterFuzz = FuzzySet(characterNames)
      var suggestedCharacters = characterFuzz.get(name)
      var message = `Character \"${name}\" does not exist`
      if(suggestedCharacters){
        suggestedCharacters = suggestedCharacters.map(suggestion => suggestion[1])
        message += `\nDid you mean:\n${suggestedCharacters.join(`\n`)}`
      }
      return msg.channel.send(utils.errorEmbed(message))
    }

		//Character editing commands
		if(args.length > 0 && character.owner == msg.member.id){
      switch (args.shift().toLowerCase()) {

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

        case "bag":
          updateBag(character, msg, args, client)
        break;

        case "stat":
        case "stats":
          updateStat(character, msg, args, client)
        break;

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
    if (character.proxy.prefix || character.proxy.suffix !== "") {
      response.description += `\n[\`${character._id}\`] **${character.name}** (\`${character.proxy.prefix}text${character.proxy.suffix}\`) <@${character.owner}>`
    } else response.description += `\n[\`${character._id}\`] **${character.name}** <@${character.owner}>`
    
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
async function showCharacter(character, msg, client, message) {

  user = await client.fetchUser(character.owner)

  var embed = utils.passEmbed()
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

		if(!message) message = await msg.channel.send(embed)
    else await message.edit(embed)
    if(character.bag.length > 0) await message.react("🎒")
    if(character.stats.length > 0) await message.react("🎲")
    var reactionFilter = (reaction, user) => {return ["🎒","🎲"].includes(reaction.emoji.name) && user.id === msg.author.id;}
    message.awaitReactions(reactionFilter, {max:1,time:60000*2, errors:["time"]})
      .then(async collection => {
        var reaction = collection.first()
        await message.clearReactions()
        switch (reaction.emoji.name) {
          case "🎒":
              showCharacterBag(character, msg, client, message)
            break;

          case "🎲":
              showCharacterStats(character, msg, client, message)
            break;
        
          default:
            break;
        }
      })
      .catch(async err => {
        await message.clearReactions()
      })
}

async function showCharacterBag(character, msg, client, message) {

  user = await client.fetchUser(character.owner)

  var embed = utils.passEmbed()
    .setTitle(`${character.displayName || character.name}'s Bag`)
    .setFooter(`id: ${character._id} | creator: @${user.tag}`)
    .setColor(character.colour)
  if(character.avatar || character.references.length > 0) embed.setThumbnail(character.avatar || character.references[0].url)
  
  invString = ``
  for (let index = 0; index < character.bag.length; index++) {
    const item = character.bag[index];
    invString += `${item.quantity} | ${item.name}\n`    
  }

  embed.setDescription(invString || `Their bag is empty!`)

  if(!message) message = await msg.channel.send(embed)
    else await message.edit(embed)  

    await message.react("👤")
    if(character.stats.length > 0)await message.react("🎲")
    var reactionFilter = (reaction, user) => {return ["👤","🎲"].includes(reaction.emoji.name) && user.id === msg.author.id;}
    message.awaitReactions(reactionFilter, {max:1,time:60000*2, errors:["time"]})
      .then(async collection => {
        var reaction = collection.first()
        await message.clearReactions()
        switch (reaction.emoji.name) {
          case "👤":
              showCharacter(character, msg, client, message)
            return;

          case "🎲":
              showCharacterStats(character, msg, client, message)
            return;
        
          default:
            return;
        }
      })
      .catch(async err => {
        await message.clearReactions()
      })
}

async function showCharacterStats(character, msg, client, message) {

  user = await client.fetchUser(character.owner)

  var embed = utils.passEmbed()
    .setTitle(`${character.displayName || character.name}'s Stats`)
    .setFooter(`id: ${character._id} | creator: @${user.tag}`)
    .setColor(character.colour)
  if(character.avatar || character.references.length > 0) embed.setThumbnail(character.avatar || character.references[0].url)
  
  for (let index = 0; index < character.stats.length; index++) {
    const stat = character.stats[index];
    embed.addField(stat.name,stat.value,true)
  }

  if(!message) message = await msg.channel.send(embed)
    else await message.edit(embed)  

    await message.react("👤")
    if(character.bag.length > 0) await message.react("🎒")
    var reactionFilter = (reaction, user) => {return ["👤","🎒"].includes(reaction.emoji.name) && user.id === msg.author.id;}
    message.awaitReactions(reactionFilter, {max:1,time:60000*2, errors:["time"]})
      .then(async collection => {
        var reaction = collection.first()
        await message.clearReactions()
        switch (reaction.emoji.name) {
          case "👤":
              showCharacter(character, msg, client, message)
            break;

          case "🎒":
              showCharacterInv(character, msg, client, message)
            break;
        
          default:
            break;
        }
      })
      .catch(async err => {
        await message.clearReactions()
      })
}

// Add a character
async function addCharacter(guildSettings, msg, args, message) {
  if(args.length > 0) {
    var newCharacter = await new charactersModel()
    newCharacter.name = args.join(" ")
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
  var colour = args.join("_").toUpperCase().replace(/^"(.+(?="$))"$/, '$1')
  if(utils.valadateColour(colour)){
  	character.colour = colour
  	if(colour == "DEFAULT") character.colour = ""
  	return await character.save((err,  doc)=>{
  		if(err) {
  			console.warn(err)
  			return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
  		}
  		return msg.channel.send(utils.passEmbed(`Set colour to **${utils.toTitleCase(doc.colour.replace(/_/g," ")) || "default"}**`).setColor(doc.colour))
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
  var desc = args.join(" ").replace(/^"(.+(?="$))"$/, '$1')
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
  if(args.length > 0) {
    switch (args.shift().toLowerCase()) {
      case 'add':
      case 'new':
        if(args.length < 2) return msg.channel.send(utils.errorEmbed("A reference must have a name and a link"))
        var name = utils.quoteFinder(args).shift()
        var url = args.shift()
        if(name.length > 30) return msg.channel.send(utils.errorEmbed("Name cannot be longer then 30 characters"))
        var find = character.references.filter(ref => ref.name == name)
        if(find.length != 0) return msg.channel.send(utils.errorEmbed("That reference already exists!"))
        if (utils.validateUrl(url) !== true) return msg.channel.send(utils.errorEmbed(`\`${url}\` is not a valid URL. Make sure the website exists and that the link starts with \`http://\` or \`https://\`.`))
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
        if(args.length < 1) return msg.channel.send(utils.errorEmbed("Must supply a reference to delete"))
        var name = utils.quoteFinder(args)
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
  return msg.channel.send(utils.errorEmbed(`You must specify whether you want to add or remove a reference!\nIf you want to view \`${character.name}\`'s current references, type \`${guildSettings.prefix}character "${character.name}"\``))
}


// Set character avatar
async function setAvatar(character, msg, args) {
  var attachments = utils.attachmentsToFileOptions(msg.attachments)
  if(!attachments){character.avatar = args[0] || undefined}
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
  if(args.length < 1) return msg.channel.send(utils.errorEmbed("A character must have a name!"))
  var newName = args.join(" ").replace(/^"(.+(?="$))"$/, '$1')
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
  var proxy = args.join(" ");
  var response;
  if(args.length > 0){
    if(proxy.includes("text") == false) {
      await msg.channel.send(utils.errorEmbed(`Example match must contain the string \`text\`.\nExample proxy setting: \`-text-\``))
      return
    }
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
  var newName = args.join(" ").replace(/^"(.+(?="$))"$/, '$1')
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
  var pronouns = args.join(" ").replace(/^"(.+(?="$))"$/, '$1')
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
  var birthday = args.join(" ").replace(/^"(.+(?="$))"$/, '$1')
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

//inv <item> <quantity>
async function updateBag(character, msg, args, client){
  var item = args.shift()
  if(item == undefined) return showCharacterBag(character, msg, client)
  item = item
  itemIndex = character.bag.findIndex((element) => {return element.name == item})
  var quantity = args[0]
  if(quantity == "clear"){
    if(itemIndex != -1){
      character.bag.splice(itemIndex, 1)
      return character.save((err, doc)=>{
        if(err){
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
        }
        return msg.channel.send(utils.passEmbed(`Removed ${item} from ${character.displayName || character.name}'s bag`))
      })
    } 
    return msg.channel.send(utils.passEmbed(`That item is not in ${character.displayName || character.name}'s bag`))
  }
  quantity = +quantity
  if(quantity + 0 != quantity) return msg.channel.send(utils.errorEmbed("Quantity must be a number or clear!"))
  
  var newItem = {
    name: item,
    quantity: quantity
  }

  if(itemIndex != -1) {
    newItem.quantity += character.bag[itemIndex].quantity
    character.bag[itemIndex] = newItem
  }
  else {
    character.bag.push(newItem)
    itemIndex = character.bag.length-1
  }

  if(character.bag[itemIndex].quantity < 1){
    character.bag.splice(itemIndex, 1)
      return character.save((err, doc)=>{
        if(err){
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
        }
        return msg.channel.send(utils.passEmbed(`Put ${quantity} ${item} into ${character.displayName || character.name}'s bag\nThere is none left!`))
      })
  }

  return character.save((err, doc)=>{
    if(err){
      console.warn(err)
      return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
    }
    return msg.channel.send(utils.passEmbed(`Put ${quantity} ${item} into ${character.displayName || character.name}'s bag\nThere is now ${doc.bag[itemIndex].quantity} in their bag`))
  })
}


//inv <item> <quantity>
async function updateStat(character, msg, args, client){
  var item = args.shift()
  if(item == undefined) return showCharacterStats(character, msg, client)
  item = item
  itemIndex = character.stats.findIndex((element) => {return element.name == item})
  var value = args[0]
  if(value == "clear"){
    if(itemIndex != -1){
      character.stats.splice(itemIndex, 1)
      return character.save((err, doc)=>{
        if(err){
          console.warn(err)
          return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
        }
        return msg.channel.send(utils.passEmbed(`Removed ${item} stat from ${character.displayName || character.name}'s stat sheet`))
      })
    } 
    return msg.channel.send(utils.passEmbed(`That stat is not on ${character.displayName || character.name}'s stat sheet`))
  }
  value = +value
  if(value + 0 != value) return msg.channel.send(utils.errorEmbed("Value must be a number or clear!"))
  
  var newStat = {
    name: item,
    value: value
  }

  if(itemIndex != -1) {
    character.stats[itemIndex] = newStat
  }
  else {
    if(character.stats.length > 20) return msg.channel.send(utils.errorEmbed("Can't have more then 20 stats! Clear one to add more!"))
    character.stats.push(newStat) 
    itemIndex = character.stats.length-1
  }

  return character.save((err, doc)=>{
    if(err){
      console.warn(err)
      return msg.channel.send(utils.errorEmbed("There was an error trying to execute that command"))
    }
    return msg.channel.send(utils.passEmbed(`Set ${character.displayName || character.name}'s ${doc.stats[itemIndex].name} stat to ${doc.stats[itemIndex].value}`))
  })
}