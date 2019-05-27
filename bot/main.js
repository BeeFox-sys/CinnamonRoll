const Discord = require('discord.js');
const config = require('./config.json');
const utils = require('./util.js')
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect(config.db, {
        useNewUrlParser: true,
        // retry to connect for 60 times
        reconnectTries: 60,
        // wait 1 second before retrying
        reconnectInterval: 1000
    });
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to database")
});

//Create setting schema
const schemas = require('./schemas.js');
const guildSettings = mongoose.model('guildSettings', schemas.guildSettings)
const reactions = mongoose.model('reactions', schemas.reaction)


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
  console.log(`Logged in as ${client.user.tag} (ID: ${client.user.id})!`);
  console.log(`${client.guilds.size} servers`);
  // console.log(`${client.shard.count} shards`); // for future use once sharding becomes necessary
  if(client.guilds.size < 2) {
    client.user.setActivity(`!!help`, { type: 'LISTENING'});
  }
  else {
    client.user.setActivity(`!!help | in ${client.guilds.size} servers`, { type: 'LISTENING'});
  }
});

client.on('message',async msg => {
  if(msg.author.bot) return
  if(msg.channel.type !== 'text')	return await msg.channel.send(utils.errorEmbed('I only work in servers!'));

  settings = await utils.getGuildSettings(msg.guild.id, guildSettings)
	if (!(msg.content.startsWith(settings.prefix) || msg.content.startsWith(`<@${client.user.id}>`))) return;

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
  if (command.args && args.length < command.argsMin) {
    let reply = `You didn't provide enough arguments!`;
			if (command.usage) {
				reply += `\nThe proper usage would be: \`${settings.prefix}${command.name} ${command.usage}\``;
			}
			return await msg.channel.send(utils.errorEmbed(reply));
    }

  try {
  	await command.execute(client, settings, msg, args);
  } catch (error) {
  	console.error(error);
  	msg.channel.send(utils.errorEmbed('There was an error trying to execute that command!'));
  }
});

//reaction stuff
client.on("messageReactionAdd",async (react,user) =>{
  if(user.id == client.user.id) return

  return reactions.findById(react.message.id, (err,doc) =>{
    if(err){
      console.log(err)
      return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
    }

    if(doc == null) return

    if(doc.settings.type == "deleteLocation"){
      if(react.emoji != "✅") return
      const locations = mongoose.model('locations', schemas.location)

      return locations.deleteOne({_id: doc.settings.id}, (err) =>{
        if(err) {
          console.log(err)
          return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
        }
        react.message.channel.send(utils.passEmbed(`Deleted location`))
        reactions.deleteOne({_id: doc._id}, err =>{
          if(err) return console.log(err)
        })
      })
    }

    if(doc.settings.type == "deleteCharacter"){
      if(react.emoji != "✅" || doc.user != user.id) return
      const characters = mongoose.model('characters', schemas.character)

      return characters.deleteOne({_id: doc.settings.id}, (err) =>{
        if(err) {
          console.log(err)
          return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
        }
        react.message.channel.send(utils.passEmbed(`Deleted character`))
        reactions.deleteOne({_id: doc._id}, err =>{
          if(err) return console.log(err)
        })
      })
    }

    return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
  })

})

client.login(config.token);

//Gracefull exit
process.on( 'SIGINT', function() {
  gracefulExit()
})
process.on( 'SIGTERM', function() {
  gracefulExit()
})


async function gracefulExit(){
  console.log( "\nGracefully shutting down" );
  await reactions.deleteMany({}, () => {
    console.log("Deleting all pending reactions")
  })

  console.log('Goodbye')
  process.exit( );
}
