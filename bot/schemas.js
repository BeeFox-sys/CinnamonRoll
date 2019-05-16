const mongoose = require('mongoose');
const Schema = mongoose.Schema


module.exports = {

  guildSettings: new mongoose.Schema({
    _id: String,
    prefix: String,
    locations: [String],
    characters: [String],
    admin: [String]
  }),

  location: new mongoose.Schema({
    _id: String,
    owner: String,
    name: String,
    images: [String],
    description: String
  }),

  character: new mongoose.Schema({
    _id: String,
    owner: String,
    name: String,
    displayName: String,
    birthday: String,
    colour: String,
    avatar: String,
    description: String,
    inventory: [{
      itemName: String,
      quantity: Number
    }]
  })
}
