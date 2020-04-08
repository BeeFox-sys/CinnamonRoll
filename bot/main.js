const Discord = require('discord.js');
const config = require('../config.json');
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
db.once('open', function () {
  console.warn("Connected to database")
});

// Create settings schema
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

client.on('ready', async () => {
  console.warn(`Logged in as ${client.user.tag} (ID: ${client.user.id})!`);
  console.warn(`${client.guilds.cache.size} servers`);
  // console.warn(`${client.shard.count} shards`); // for future use once sharding becomes necessary
  await setPresence()
});

client.on('reconnecting', () => {
  console.warn("Lost connection to the Discord gateway!\nAttempting to resume the websocket connection...")
});

client.on('message', async msg => {
  if (msg.author.bot) return
  if (msg.channel.type !== 'text') return await msg.channel.send(utils.errorEmbed('I only work in servers!'));

  // Remove 0 Width spaces
  msg.content = msg.content.replace(/[\u200B-\u200D\uFEFF]/g, '')

  var settings = await utils.getGuildSettings(client, msg.guild.id, guildSettings)
  await proxyMethod.execute(client, settings, msg)
  if (!(msg.content.startsWith(settings.prefix) || msg.content.startsWith(`<@${client.user.id}>`) || msg.content.startsWith(`<@!${client.user.id}>`))) return;

  var args
  if (msg.content.startsWith(`<@${client.user.id}>`)) {
    args = msg.content.slice(`<@${client.user.id}> `.length).split(/ +/);
    if (args[0] == '') {
      args[0] = 'help'
    }
  }
  else if (msg.content.startsWith(`<@!${client.user.id}>`)) {
    args = msg.content.slice(`<@!${client.user.id}> `.length).split(/ +/);
    if (args[0] == '') {
      args[0] = 'help'
    }
  }
  else {
    args = msg.content.slice(settings.prefix.length).split(/ +/);
  }

  //Check permissions
  var channelPerms = await msg.channel.permissionsFor(client.user)
  var missing = []
  config.permissions.commands.forEach(flag => {
    if(!channelPerms.has(flag)){
      missing.push(flag)
    }
  });
  if(missing.length > 0){
    var serverOwner = await client.users.fetch(msg.guild.owner)
      if(!missing.includes("SEND_MESSAGES")){
        return msg.channel.send(`Missing permissions: \n${missing.join("\n")}`)
      } else {
        return serverOwner.send(`Missing permissions in **${msg.guild.name}**: \n${missing.join("\n")}`).catch((err)=>{
          return utils.logTraceback(new Error(`Missing permissions in ${msg.guild.id}\nServer owner is ${serverOwner.tag}`),client, msg)
        })
      }
  }

  //Find command
  var commandName = args.shift()
  if (!commandName) {
    commandName = args.shift()
  }
  if (!commandName) return
  commandName = commandName.toLowerCase()

  const command = await client.commands.get(commandName)
    || await client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  if (!command) {
    await msg.channel.send(utils.errorEmbed(`Unknown command \`${commandName}\`. For a list of commands, type \`${settings.prefix} help\`, or just mention me!`))
    return
  }
  if (command.args && args.length < command.argsMin) {
    let reply = `You didn't provide enough arguments!`;
    if (command.usage) {
      reply += `\nThe proper usage would be: `;
      for (let i = 0; i < command.usage.length; i++) {
        const usage = command.usage[i];
        reply += `\n**${settings.prefix}${command.name} ${usage}`
      }
    }
    return await msg.channel.send(utils.errorEmbed(reply));
  }

  try {
    // Execute command
    await command.execute(client, settings, msg, args);
    // Catch any errors
  } catch (err) {
    // Log error to console
    console.error(err.stack);
    // Notify the user there was an error
    msg.channel.send(utils.errorEmbed('There was an error trying to execute that command!'));
    // Post error to logging channel if it exists
    utils.logTraceback(err, client, msg)
  }
});

// Reaction event handling

reactions = require('./reactions.js')
reactions.execute(client)

client.on("messageUpdate",async (old,msg)=>{
  var messages = msg.channel.messages
  var latest = messages.cache.last();
  if(latest.id != msg.id) return
  var settings = await utils.getGuildSettings(client, msg.guild.id, guildSettings)
  await proxyMethod.execute(client, settings, msg)
})

client.on("guildCreate", async () => {
  await setPresence()
})

client.on("guildDelete", async () => {
  await setPresence()
})


// Finally, login with the configured token
client.login(config.token);

// Graceful exit
process.on('SIGINT', function () {
  gracefulExit()
})
process.on('SIGTERM', function () {
  gracefulExit()
})



// Set bot user presence status
async function setPresence() {
  if (client.guilds.size < 2) {
    client.user.setActivity(`Mention me for help!`, { type: 'PLAYING' });
  }
  else {
    client.user.setActivity(`Mention for help! | in ${client.guilds.size} servers`, { type: 'PLAYING' });
  }
}


// Log out of Discord and exit gracefully
function gracefulExit() {
  console.warn("\nGracefully shutting down...");
  client.destroy();
  console.warn("Goodbye");
  process.exit();
}