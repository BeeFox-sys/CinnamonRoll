const Discord = require('discord.js');
const utils = require('../util.js')

module.exports = {
	name: 'guide',
	aliases: ["gettingstarted","getstarted"],
	description: 'An interactive tool for setting up CinnamonRoll',
	hidden: true,
	args: false,
	argsMin: 0,
	usage: [],
	example: [],
	async execute(client, guildSettings, msg, args) {
		var message = await msg.channel.send(utils.warnEmbed(
`There are several guides to choose from, please react with the corresponding reaction
👤: Character creation
👥: Advanced character creation
🗺: Location Creation
🔧: Server setup guide`))
		await message.react("👤")
		await message.react("👥")
		await message.react("🗺")
		await message.react("🔧")
		var reactionFilter = (reaction, user)=>{
			return ['👤','🗺','🔧',"👥"].includes(reaction.emoji.name) && user.id === msg.author.id;
		}
		await message.awaitReactions(reactionFilter, {max:1,time:60000*2, errors:['time']})
		.then(collected => {
			const reaction = collected.first().emoji.name;
			switch (reaction) {
				case '👤':
					characterCreationGuide(msg,guildSettings,message)
					break;

				case '🗺':
					locationCreationGuide(msg,guildSettings,message)
				break;

				case '🔧':
					guildSetupGuide(msg,guildSettings,message)
				break;
				
				case '👥':
					advancedCharacterCreation(msg,guildSettings,message)
				break;
			
				default:
					break;
			}
		})
	},
};

async function guidePage(msg, guide, pageNum, message){
	var page = guide[pageNum]

	if(!message) message = await msg.channel.send(utils.warnEmbed(page.content).setTitle(page.title))
	else await message.edit(utils.warnEmbed(page.content).setTitle(page.title))

	await message.clearReactions()

	if(pageNum != 0) await message.react("◀")
	if(pageNum != guide.length-1) await message.react("▶")
	await message.react("❌")

	var reactionFilter =  (reaction, user)=>{
		return ['▶','◀','❌'].includes(reaction.emoji.name) && user.id === msg.author.id;
	  }
	await message.awaitReactions(reactionFilter, {max:1,time:60000*10, errors:['time']})
	.then(collected => {
		const reaction = collected.first().emoji.name;

		if(reaction == "❌"){
			message.clearReactions()
		}
		
		if(reaction == "◀"){
			guidePage(msg, guide, pageNum-1, message)
		}
		if(reaction == "▶"){
			guidePage(msg, guide, pageNum+1, message)
		}
	})
	.catch(async collected =>{
		await message.clearReactions()
	})
}


async function characterCreationGuide(msg, guildSettings, message){

	characterCreation = [
		{
		title:"Getting Started!",
		content:
`Welcome to the interactive character creation guide!
To change pages use the reaction buttons ◀ and ▶.
You can react with ❌ to stop the guide
Press ▶ to continue`
		},{
			title:"Creating a character!",
			content:
`The first step to any good roleplay is to create a character!
Type \`${guildSettings.prefix}character add <name>\`, replacing \`<name>\` with your new characters name!
This will create a new character with that name!`
		},{
			title:"Creating a character!",
			content:
`Now that we have a character, you'll notice that there is a string of five letters.
These letters are the characters id, and each and every character has a completly uneiqe one!
Try running the commands \`${guildSettings.prefix}character <name>\` and \`${guildSettings.prefix}character <id>\` where \`<name>\` is your characters name (if it is longer then one word, put \`"\` around) and where \`<id>\` is the id you were just given!
Fun fact! There are 11,881,376 diffrent possible ids!`
		},{
			title:"Editing a character!",
			content:
`Wow, That looks pretty empty. Why don't we add some stuff!
When editing a character, all your commands will start with \`${guildSettings.prefix}character <name>\` or \`${guildSettings.prefix}character <id>\`. But for simplicity's sake, and because ids will always work, we will be using \`${guildSettings.prefix}character <id>\` in this guide.
There are many things you can set for your character! You can set your characters, nickname, birthday, pronouns, avatar, colour, and description!
Feel free to try them out! An example command is \`${guildSettings.prefix}character <id> description This is an awsome character!\``
		},{
			title:"Character Refrences",
			content:
`You can also add refrence links to your character! This is done by using the refrence add command
\`${guildSettings.prefix}character <id> reference add <name> <link>\`
This will add a refrence with the name \`<name>\` and it links to \`<link>\`
It will look like this on your character's profile: [This is a refrence](https://duckduckgo.com/?q=cinnamon+roll&iar=images)
Tip! If your character doesn't have an avatar and their first refrence links to an image, they'll use that as their avatar until you set one!`
		},{
			title:"Character Proxies",
			content:
`Now we are into the *scary stuff*
I'm joking! Don't worry.
Now that your character is looking a bit more fleshed out, wouldn't it be awsome if they could speak?
Try running \`${guildSettings.prefix}character <id> proxy +text+\``
		},{
			title:"Character Proxies",
			content:
`Great! now type a message starting and ending with \`+\`
+Like this!+`
		},{
			title:"It's alive!!!",
			content:
`Whoah! Look at that!
You can choose what to type before and after your message to!
\`Character:text\` will make it so if you type Character: at the start of a message, it will be proxied!
\`text-Character\` will do the same, but with -Character at the end of your message
\`text\` or leaving it blank will disable proxying
And you can customise it all you like! by just changing what is in front of, and after, \`text\` in the proxy command`
		},{
			title:"Thats all folks!",
			content:
`And thats everything!
If you still need some help you can [head to the support server](https://discord.gg/PrKWQP2), or you could use \`${guildSettings.prefix}help character\` for a quick refresher of all the commands and how they work!
Thanks for sticking with me through all that! I hope you have a nice time playing and an amazing day!
You can press ❌ to end the guide, ◀ to go back and navagate through the pages, or if you leave it be the guide will end in 10 minutes.
Have a great day!`
		}
	]

	guidePage(msg, characterCreation, 0, message)
}

async function locationCreationGuide(msg, guildSettings, message) {
	locationCreation = [
		{
			title:"Coming Soon!",
			content: `This guide is being worked on`
		}
	]
	
	guidePage(msg, locationCreation, 0, message)
}

async function guildSetupGuide(msg, guildSettings, message) {
	guildSetup = [
		{
			title:"Coming Soon!",
			content: `This guide is being worked on`
		}
	]
	
	guidePage(msg, guildSetup, 0, message)
}

async function advancedCharacterCreation(msg, guildSettings, message) {
	advancedCharacter = [
		{
			title:"Coming Soon!",
			content: `This guide is being worked on`
		}
	]
	
	guidePage(msg, advancedCharacter, 0, message)
}