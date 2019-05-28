const utils = require('../util');
const config = require("../config.json")

module.exports = {
  name: 'info',
  aliases: ['invite', 'github', 'support', 'server'],
  decription: 'Shows information about the bot',
  hidden: false,
  args: false,
  usage:'',
  async execute(client, guildSettings, msg, args) {
    // Fetch the bot info and get the client ID
    const oauth_app = await client.fetchApplication();
    const client_id = oauth_app.id;
    /*
    Give the bot permissions integer "536996928" which allows the following permissions:

    Manage webhooks - so the bot can make [NPC] posts
    View channels - so the bot can read text channels (and see voice channels) throughout the server
    Send messages - so the bot can send messages throughout the server
    Manage messages - e.g. for deleting OP's commands
    Embed links - e.g. to post links in [NPC] posts
    Attach files - let it send files and images too
    Read messages history - might need this later on for message lookup/context-aware stuff
    Add reactions - let the bot react to messages e.g. for controlling embed panels
    */
    const permissions = "536996928";

    // Construct the URL with proper client ID and permissions integer
    const inviteUrl = `https://discordapp.com/oauth2/authorize?client_id=${client_id}&scope=bot&permissions=${permissions}`;
    //Misc links
    const githubUrl = "https://github.com/PlatypodeCode/CinnamonRP";
    // Generate Embed
    const infoMessage = "CinnamonRP is a bot designed for roleplay on Discord. It allows you to create characters and set up message proxying, set scenes and define locations, post as NPCs, roll dice and more.\n\nType \`!!help\` for a list of commands and \`!!help [command]\` to find out how they work!\n\nWe also have a support server for help, announcements, discussion, suggestions, etc";
    const serverUrl = "https://discord.gg/NjrSpBY";
    const embed = utils.passEmbed()
      .addField("CinnamonRP", infoMessage)
      .addField("Add the bot!",`[Click here to add CinnamonRP to your server](${inviteUrl})`)
      .addField("See the code!",`[Click here to view the GitHub for CinnamonRP](${githubUrl})`)
      .addField("Get help!", `[Click here to join our support server](${serverUrl})`);
      if(config.owner != "") embed.setFooter(`Instance Owner: ${config.owner}`)
    // Finally, send the message with the invite link
    return msg.channel.send(embed);
  },
};
