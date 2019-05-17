const Discord = require('discord.js');
const config = require('./config.json');
const utils = require('./util.js')
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect(config.db, {useNewUrlParser: true});
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to database")
});

//Create setting schema
const schemas = require('./schemas.js');
const guildSettings = mongoose.model('guildSettings', schemas.guildSettings)

const client = new Discord.Client();

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./bot/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}


client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message',async msg => {

  settings = await utils.getGuildSettings(msg.guild.id, guildSettings)
	if (!(msg.content.startsWith(settings.prefix) || msg.content.startsWith(`<@${client.user.id}>`))|| msg.author.bot) return;

  var args
  if(msg.content.startsWith(`<@${client.user.id}>`)){
    args = msg.content.slice(`<@${client.user.id}> `.length).split(/ +/);
    if(args[0] == '') {
      args[0] = 'help'
    }
  } else {
    args = msg.content.slice(settings.prefix.length).split(/ +/);
  }

	const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  if(!command) return
  if (command.guildOnly && msg.channel.type !== 'text') {
  	return await msg.reply('I can\'t execute that command inside DMs!');
  }
  if (command.args && args.length < command.argsMin) {
    let reply = `You didn't provide enough arguments, ${msg.author}!`;
			if (command.usage) {
				reply += `\nThe proper usage would be: \`${settings.prefix}${command.name} ${command.usage}\``;
			}
			return await msg.channel.send(reply);
    }

  try {
  	await command.execute(client, settings, msg, args);
  } catch (error) {
  	console.error(error);
  	msg.reply('there was an error trying to execute that command!');
  }
});

client.login(config.token);
