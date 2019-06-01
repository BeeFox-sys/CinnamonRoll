const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd'
};
const Discord = require('discord.js');
const mongoose = require('mongoose');
const schemas = require('./schemas.js');
const messages = mongoose.model("messages", schemas.message)



module.exports.execute = async (client) => {

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

}