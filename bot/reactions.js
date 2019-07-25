const events = {
  MESSAGE_REACTION_ADD: 'messageReactionAdd'
};
const mongoose = require('mongoose');
const schemas = require('./schemas.js');
const messages = mongoose.model("messages", schemas.message)


module.exports.execute = async (client) => {

  client.on("messageReactionAdd", async (react, user) => {

    switch (react.emoji.name) {
      case "❓":
        getMessageData(react, user, client)
        break;

      case "❌":
        deleteMessage(react, user, client)
        break;


      default:
        break;
    }
  })

  // React to old messages
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

async function getMessageData(react, user, client) {
  messages.findOne({ _id: react.message.id }, async (err, doc) => {
    if (err) {
      console.warn(err)
      utils.logTraceback(err, client)
      return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
    }
    if (doc == null) return
    react.remove(user.id)
    var owner = await client.fetchUser(doc.owner)
    var response = utils.passEmbed()
    response.addField("Owner Username:", owner.tag, true)
    response.addField("Owner id:", owner.id, true)
    response.setFooter(`Message sent`)
    response.setTimestamp(doc.timestamp)
    response.addField("Message Display Name", react.message.author.username, true)
    response.addField("Character ID:", doc.character || "Message is an NPC spawned message")
    response.addField("Message Content:", react.message.content)

    try {
      await user.send(response)
    } catch (e) {
      var failmsg = await react.message.channel.send(`Pst <@${user.id}>... I can't DM you`)
      await utils.wait(5000)
      console.log(failmsg)
      failmsg.delete()
    }
  })
}

function deleteMessage(react, user, client) {
  messages.findOne({ _id: react.message.id }, async (err, doc) => {
    if (err) {
      console.warn(err)
      utils.logTraceback(err, client)
      return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
    }
    if (doc == null) return
    if (user.id != doc.owner) return
    messages.deleteOne({ _id: doc._id }, err => {
      if (err) {
        console.warn(err)
        utils.logTraceback(err, client)
        return react.message.channel.send(utils.errorEmbed("Something went wrong with that reaction"))
      }
      return react.message.delete()
    })
  })
}
