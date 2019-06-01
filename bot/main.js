const Discord = require('discord.js');
const config = require('./config.json');
const utils = require('./util.js')
const fs = require('fs');
const proxyMethod = require('./proxy.js')
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
  console.warn("Connected to database")
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
  console.warn(`Logged in as ${client.user.tag} (ID: ${client.user.id})!`);
  console.warn(`${client.guilds.size} servers`);
  // console.warn(`${client.shard.count} shards`); // for future use once sharding becomes necessary
  if(client.guilds.size < 2) {
    client.user.setActivity(`Mention me for help!`, { type: 'LISTENING'});
  }
  else {
    client.user.setActivity(`Mention for help! | in ${client.guilds.size} servers`, { type: 'LISTENING'});
  }
});

client.on('message',async msg => {
  if(msg.author.bot) return
  if(msg.channel.type !== 'text')	return await msg.channel.send(utils.errorEmbed('I only work in servers!'));

  //Remove 0 Width spaces
  msg.content = msg.content.replace(/[\u200B-\u200D\uFEFF]/g, '')

  settings = await utils.getGuildSettings(msg.guild.id, guildSettings)
  await proxyMethod.execute(client, settings, msg)
	if (!(msg.content.startsWith(settings.prefix) || msg.content.startsWith(`<@${client.user.id}>`) || msg.content.startsWith(`<@!${client.user.id}>`))) return;

  var args
  if(msg.content.startsWith(`<@${client.user.id}>`)) {
    args = msg.content.slice(`<@${client.user.id}> `.length).split(/ +/);
    if(args[0] == '') {
      args[0] = 'help'
    }
  }
  else if (msg.content.startsWith(`<@!${client.user.id}>`)) {
    args = msg.content.slice(`<@!${client.user.id}> `.length).split(/ +/);
    if(args[0] == '') {
      args[0] = 'help'
    }
  }
  else {
    args = msg.content.slice(settings.prefix.length).split(/ +/);
  }

  var commandName = args.shift().toLowerCase();
  if(!commandName) {
    commandName = args.shift().toLowerCase();
  }

  const command = await client.commands.get(commandName)
    || await client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  if(!command) return
  if (command.args && args.length < command.argsMin) {
    let reply = `You didn't provide enough arguments!`;
			if (command.usage) {
				reply += `\nThe proper usage would be: `;
        for (let i = 0; i < command.usage.length; i++) {
          const usage = command.usage[i];
          reply += `\n\`${settings.prefix}${command.name} ${usage}\``
        }
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

const messages = mongoose.model('messages', schemas.message)

client.on("messageReactionAdd",async (react,user) =>{

  //Get Message data
  if(react.emoji == "❓"){
    messages.findOne({_id:react.message.id},async (err, doc) =>{
      if(err){
        console.warn(err)
        return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
      }
      if(doc == null) return
      react.remove(user.id)
      var owner = await client.fetchUser(doc.owner)
      var response = utils.passEmbed()
      response.addField("Owner Username:",owner.tag,true)
      response.addField("Owner id:",owner.id,true)
      response.setFooter(`Message sent at`)
      response.setTimestamp(doc.timestamp)

      try{
        await user.send(response)
      } catch(e) {
        var failmsg = await react.message.channel.send(`Pst <@${user.id}>... I can't dm you`)
        await utils.wait(5000)
        console.log(failmsg)
        failmsg.delete()
      }
    })
  }
})

//React to old messages
const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd'
};

client.on('raw', async event => {
	if (!events.hasOwnProperty(event.t)) return;
  const { d: data } = event;
  const user = client.users.get(data.user_id);
  const channel = client.channels.get(data.channel_id) || await user.createDM();
  
  if (channel.messages.has(data.message_id)) return;
  
  const message = await channel.fetchMessage(data.message_id);
  const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
  const reaction = message.reactions.get(emojiKey);
  client.emit(events[event.t], reaction, user);
});




client.on("guildCreate", ()=> {
  if(client.guilds.size < 2) {
  client.user.setActivity(`Mention me for help!`, { type: 'LISTENING'});
}
else {
  client.user.setActivity(`Mention for help! | in ${client.guilds.size} servers`, { type: 'LISTENING'});
}
})

client.on("guildDelete", ()=> {
  if(client.guilds.size < 2) {
  client.user.setActivity(`Mention me for help!`, { type: 'LISTENING'});
}
else {
  client.user.setActivity(`Mention for help! | in ${client.guilds.size} servers`, { type: 'LISTENING'});
}
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
  console.warn( "\nGracefully shutting down" );

  console.warn('Goodbye')
  process.exit( );
}
