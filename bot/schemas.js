const mongoose = require('mongoose');
const Schema = mongoose.Schema


module.exports = {

  guildSettings: new mongoose.Schema({
    _id: String,
    prefix: String,
    locations: [{ type: Schema.Types.ObjectId, ref:'location' }],
    characters: [{ type: Schema.Types.ObjectId, ref:'character' }],
    admin: [String],
    colour: Number,
    gameName: String
  }),

  location: new mongoose.Schema({
    _id: String,
    owner: String,
    guild: String,
    name: String,
    colour: String,
    references: [{
      name: String,
      url: String
    }],
    description: String
  }),

  character: new mongoose.Schema({
    _id: String,
    owner: String,
    guild: String,
    name: String,
    displayName: String,
    proxy:{
      prefix: String,
      suffix: String
    },
    birthday: String,
    colour: Number,
    avatar: String,
    description: String,
    inventory: [{
      itemName: String,
      quantity: Number
    }],
    references: [{
      name: String,
      url: String
    }]
  })
}
