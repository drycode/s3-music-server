const { nullSong, nullArtist, nullAlbum } = require("./null_responses.js");
const { normalizeSongName } = require("../helpers/utils");
const logger = require("../lib/logger");
const _ = require("lodash");
class Album {
  constructor(artist, name, songs = null, details = null) {
    this._name = name;
    this._artist = artist;
    this._songs = songs;
    this._details = details;
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

  get details() {
    return this._details;
  }

  set details(details) {
    const keys = Object.keys(nullAlbum);
    let temp = _.pick(details, keys);
    for (let i in keys) {
      let key = keys[i];
      if (_.isArray(details[key]) && _.isObject(details[key][0])) {
        const result = _.map(
          details[key],
          _.partialRight(_.pick, Object.keys(nullAlbum[key][0]))
        );
        logger.info(result);
        temp[key] = result;
      }
    }

    this._details = temp;
    // this._details = _.pick(details, Object.keys(nullAlbum));
  }
}

class Artist {
  constructor(name, albums = null) {
    this._name = name;
    this._albums = albums;
    this.details = nullArtist;
  }
  get name() {
    return this._name;
  }
  get albums() {
    return this._albums;
  }
  set albums(albums) {
    // Validate album update
    this._albums = albums;
  }
}

class Song {
  constructor(artist, album, name) {
    this._name = normalizeSongName(name);
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

module.exports = { Album, Artist, Song };
