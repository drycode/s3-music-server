const { s3Client } = require("../clients/aws_client.js");
const logger = require("../lib/logger.js");

const { nullSong } = require("../models/null_responses.js");
const songMap = require("../middlewares/normalize.js");

class Song {
  constructor(artist, album, name) {
    this._name = name;
    this._album = album;
    this._artist = artist;
    this.details = nullSong;
  }

  get name() {
    return this._name;
  }

  get album() {
    return this._album;
  }

  get artist() {
    return this._artist;
  }
}

module.exports = Song;
