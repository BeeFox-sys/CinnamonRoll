const Discord = require('discord.js');
const utils = require('../util.js')
const { DiceRoller } = require('rpg-dice-roller');


module.exports = {
	name: 'roll',
	aliases: ['r', 'dice', 'd'],
	description: 'Roll a dice',
	hidden: false,
	args: true,
	argsMin: 1,
	usage: ['<standard dice notation>**\nRolls the specified dice\n[An in-depth Guide](https://github.com/GreenImp/rpg-dice-roller#supported-notation)'],
	example: '2d6+3',
	async execute(client, guildSettings, msg, args) {
		try {
			const roll = new DiceRoller()
			var results = await roll.roll(args.join(" "))

			var embed = utils.passEmbed()
			if (results.output.toString().length > 1800) {
				embed.setFooter(`Roll list removed to avoid message limit`)
				embed.addField(`Total:`, `${results.total}`)
			} else {
				embed.setDescription(`\`${results.output.toString()}\``)
				embed.setTitle('Rolls:')
			}
			embed.setAuthor(msg.member.displayName, msg.author.avatarURL)
			return msg.channel.send(embed)
		} catch (err) {
			console.warn(err)
			utils.logTraceback(err, client, msg)
			if (err.message.startsWith("Undefined symbol") || err.name == "TypeError") {
				msg.channel.send(utils.errorEmbed("There is something not quite right here, [Please check the guide](https://github.com/GreenImp/rpg-dice-roller#supported-notation)"))
			}
		}
	},
};
