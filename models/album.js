const { s3Client } = require("../clients/aws_client.js");
const logger = require("../lib/logger.js");

const { nullAlbum } = require("../models/null_responses.js");

class Album {
  constructor(artist, name, songs = null) {
    this._name = name;
    this._artist = artist;
    this._songs = songs;
    this.details = nullAlbum;
  }
  get name() {
    if (!this._name) {
      throw new Error("Must have a valid name");
    }
    return this._name;
  }

  get artist() {
    if (!this._artist) {
      throw new Error("Must have a valid artist associated with an Album");
    }
    return this._artist;
  }

  get songs() {
    return this._songs;
  }
  set songs(songs) {
    // Validate song updates
    this._songs = songs;
    f;
  }
}

module.exports = Album;
