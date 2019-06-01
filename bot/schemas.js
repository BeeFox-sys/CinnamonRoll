const mongoose = require('mongoose');
const Schema = mongoose.Schema
const config = require('./config.json')


module.exports = {

  guildSettings: new mongoose.Schema({
    _id: String,
    prefix: {type:String, default: config.defaultPrefix},
    locations: [{ type: String, ref: 'locations' }],
    characters: [{ type: String, ref:'characters' }],
    admin: [String],
    gameName: String,
    enableImport: {type: Boolean, default: true},
    locationLock: {type: Boolean, default: false}
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
    displayName: {type:String, default:""},
    pronouns: {type:String, default:""},
    avatar: {type:String, default:""},
    proxy:{
      prefix: {type:String, default:""},
      suffix: {type:String, default:""}
    },
    birthday: {type:String, default:""},
    colour: {type:String, default:""},
    description: {type:String, default:""},
    inventory: [{
      itemName: String,
      quantity: Number
    }],
    references: [{
      name: String,
      url: String
    }]
  }),

  reaction: new mongoose.Schema({
    _id: String,
    user: String,
    settings: Object   //Settings object must have `type` tag
  }),

  message: new mongoose.Schema({
    _id: String,
    owner: String,
    character: { type: String, ref:'characters' },
    timestamp: {type: Date, default: Date.now}
  })
}
