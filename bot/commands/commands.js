const { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'help',
	aliases: ['h', 'commands'],
	description: 'List all of my commands or info about a specific command.',
  perms: [''],
	guildOnly: false,
	args: false,
	usage: '[command]',
	execute(client, guildSettings, msg, args) {
    if(!msg.member.hasPermission(this.perms)) return;
    const data = [];
    const { commands } = msg.client;

    if (!args.length) {

      data.push("```")
      data.push(commands.map(command => command.name).join('\n'))
      data.push("```")

      embed = new Discord.RichEmbed()
        .setTitle("Commands:")
        .setDescription(data)
        .setFooter(`You can send \`${prefix}help [command name]\` to get info on a specific command!`)
        .setColor("#ffaa00")

      return msg.channel.send(embed)
    }
    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
    	return msg.reply('that\'s not a valid command!');
    }

    data.push(`**Name:** ${command.name}`);

    embed = new Discord.RichEmbed()
      .setFooter(`You can send \`${prefix}help [command name]\` to get info on a specific command!`)
      .setColor("#ffaa00")
    if (command.aliases) embed.addField(`Aliases:`, `${command.aliases.join(', ')}`);
    if (command.description) embed.addField(`Description:`,`${command.description}`);
    if (command.usage) embed.addField(`Usage:`,`${prefix}${command.name} ${command.usage}`);
    if (command.example) embed.addField(`Example:`,`${prefix}${command.name} ${command.example}`);


    msg.channel.send(embed);

	},
};
