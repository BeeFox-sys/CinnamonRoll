const DiceRoller = require('../Libs/DiceRoller.js');
const Discord = require('discord.js');

module.exports = {
	name: 'roll',
	aliases: ['r', 'dice', 'd'],
	description: 'Ping!',
  perms: [''],
	guildOnly: false,
	args: true,
	usage: '<standard dice notation>',
	example: '2d6+3',
	execute(msg, args) {
    if(!msg.member.hasPermission(this.perms)) return;
		const roll = new DiceRoller()
		if(!roll.validate(args[0])) return msg.channel.send("Somethings wrong with your notation, check the help command for an example")
		results = roll.roll(args[0])

		embed = new Discord.RichEmbed()
		if(results.rolls.join("+").length > 1800){
			rolls = results.total - results.modifier
			embed.addField(`Rolls Total:`,`\`${rolls}\``)
			embed.setFooter(`Rolls added together to avoid message limit`)
		} else {
			embed.addField(`Rolls:`,`\`${results.rolls.join("+")}\``)
		}
		embed.addField(`Modifier:`,`\`${results.modifier}\``)
		embed.addField(`Total:`,`\`${results.total}\``,)
		embed.setAuthor(msg.member.displayName, msg.author.avatarURL)
		embed.setColor("#43b581")
		return msg.channel.send(embed)
	},
};
