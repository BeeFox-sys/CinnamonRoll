module.exports = {
  name: 'invite',
  decription: 'Generates an invite link for the bot',
  perms: [''],
  guildOnly: false,
  args: false,
  usage:'',
  async execute(client, guildSettings, msg, args) {
    const oauth_app = await client.fetchApplication();
    const client_id = oauth_app.id;
    /*
    Give the bot permissions integer '536996928' which allows the following permissions:

    Manage webhooks - so the bot can make [NPC] posts
    View channels - so the bot can read text channels (and see voice channels) throughout the server
    Send messages - so the bot can send messages throughout the server
    Manage messages - e.g. for deleting OP's commands
    Embed links - e.g. to post links in [NPC] posts
    Attach files - let it send files and images too
    Read messages history - might need this later on for message lookup/context-aware stuff
    Add reactions - let the bot react to messages e.g. for controlling embed panels
    */
    const permissions = '536996928';

    // Construct the URL with proper client ID and permissions integer
    const url = `https://discordapp.com/oauth2/authorize?client_id=${client_id}&scope=bot&permissions=${permissions}`;
    // Finally, send the message with the invite link
    return msg.channel.send(`\u2705 Use this link to add CinnamonRP to your server:\n${url}`);
  },
};