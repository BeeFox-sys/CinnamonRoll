const { Permissions } = require('discord.js');
const utils = require('../util.js');
const config = require("../../config.json");

module.exports = {
  name: 'info',
  aliases: ['invite', 'github', 'support', 'server'],
  decription: 'Shows information about the bot',
  hidden: false,
  args: false,
  usage: ["**"],
  async execute(client, guildSettings, msg, args) {
    // Fetch the bot info and get the client ID
    const oauthApp = await client.fetchApplication();
    const clientID = oauthApp.id;
    /*
    Give the bot the following permission flags:

    Manage webhooks - so the bot can make [NPC] posts
    View channels - so the bot can read text channels (and see voice channels) throughout the server
    Send messages - so the bot can send messages throughout the server
    Manage messages - e.g. for deleting OP's commands
    Embed links - e.g. to post links in [NPC] posts
    Attach files - let it send files and images too
    Read messages history - might need this later on for message lookup/context-aware stuff
    Add reactions - let the bot react to messages e.g. for controlling embed panels
    */
    const flags = [
      "MANAGE_WEBHOOKS",
      "VIEW_CHANNEL",
      "SEND_MESSAGES",
      "MANAGE_MESSAGES",
      "EMBED_LINKS",
      "ATTACH_FILES",
      "READ_MESSAGE_HISTORY",
      "ADD_REACTIONS"
    ];
    // Resolve the flags to a permissions integer
    const permissions = Permissions.resolve(flags);

    // Construct the URL with proper client ID and permissions integer
    const inviteUrl = `https://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=${permissions}`;

    // Misc links
    const githubUrl = "https://github.com/PlatypodeCode/CinnamonRoll";

    const infoMessage = `CinnamonRoll is a bot designed for roleplay on Discord. It allows you to create characters and set up message proxying, set scenes and define locations, post as NPCs, roll dice and more.\n\nType \`${guildSettings.prefix}help\` for a list of commands and \`${guildSettings.prefix}help [command]\` to find out how they work!\n\nWe also have a support server for help, announcements, discussion, suggestions, etc`;

    const serverUrl = "https://discord.gg/PrKWQP2";

     // Generate Embed
    const embed = utils.passEmbed()
      .addField("CinnamonRoll", infoMessage)
      .addField("Add the bot!", `[Click here to add CinnamonRoll to your server](${inviteUrl})`)
      .addField("See the code!", `[Click here to view the GitHub for CinnamonRoll](${githubUrl})`)
      .addField("Get help!", `[Click here to join our support server](${serverUrl})`);
    if (config.owner.name != "") embed.setFooter(`Instance Owner: ${config.owner.name}`)

    // Finally, send the embed with all the content
    return msg.channel.send(embed);
  }
};