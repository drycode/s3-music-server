const { nullSong, nullArtist, nullAlbum } = require("./null_responses.js");
const { normalizeSongName } = require("../helpers/utils");
const logger = require("../lib/logger");
const _ = require("lodash");
class Album {
  constructor(artist, name, songs = null, details = null) {
    this.name = name;
    this.artist = artist;
    this.songs = songs;
    this.details = details;
  }

  setDetails(details) {
    if (!details) {
      this.details = null;
    } else {
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
      this.details = temp;
    }
  }
}

class Artist {
  constructor(name, albums = null, details = null) {
    this.name = name;
    this.albums = albums;
    this.details = details;
  }
  setAlbums(albums) {
    this.albums = albums;
  }

  setDetails(details) {
    if (!details) {
      this.details = null;
    } else {
      const keys = Object.keys(nullArtist);
      let temp = _.pick(details, keys);
      for (let i in keys) {
        let key = keys[i];
        if (_.isArray(details[key]) && _.isObject(details[key][0])) {
          const result = _.map(
            details[key],
            _.partialRight(_.pick, Object.keys(nullArtist[key][0]))
          );
          logger.info(result);
          temp[key] = result;
        }
      }

      this.details = temp;
    }
  }
}

class Song {
  constructor(artist, album, name) {
    this.name = normalizeSongName(name);
    this.album = album;
    this.artist = artist;
    this.details = nullSong;
  }
}

module.exports = { Album, Artist, Song };
