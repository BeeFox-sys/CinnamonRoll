const Discord = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect(config.db+'/rpBot', {useNewUrlParser: true});
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to database")

});

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
  await client.user.setPresence({ game: { name: `${config.prefix}help` }, status: 'online' })
  .catch(console.error);
});

client.on('message', msg => {
	if (!msg.content.startsWith(config.prefix) || msg.author.bot) return;

	const args = msg.content.slice(config.prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if(!command) return

  if (command.guildOnly && msg.channel.type !== 'text') {
  	return msg.reply('I can\'t execute that command inside DMs!');
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${msg.author}!`;
			if (command.usage) {
				reply += `\nThe proper usage would be: \`${config.prefix}${command.name} ${command.usage}\``;
			}

			return msg.channel.send(reply);
    }

  try {
  	command.execute(client, msg, args);
  } catch (error) {
  	console.error(error);
  	msg.reply('there was an error trying to execute that command!');
  }
});

client.login(config.token);
