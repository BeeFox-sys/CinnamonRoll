const DiceRoller = require('../Libs/DiceRoller.js');
const Discord = require('discord.js');
const utils = require('../util.js')


module.exports = {
	name: 'roll',
	aliases: ['r', 'dice', 'd'],
	description: 'Roll a dice',
	hidden: false,
	args: true,
	argsMin: 1,
	usage: ['<standard dice notation>**\nRolls the specified dice'],
	example: '2d6+3',
	execute(client, guildSettings, msg, args) {
    if(!msg.member.hasPermission(this.perms)) return;
		const roll = new DiceRoller()
		if(!roll.validate(args[0])) return msg.channel.send(utils.errorEmbed("Somethings wrong with your notation, check the help command for an example"))
		results = roll.roll(args[0])

		embed = utils.passEmbed()
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
		return msg.channel.send(embed)
	},
};
