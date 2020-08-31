const { Album } = require("../models/models.js");
const redis = require("redis");
const config = require("../config");
const { promisify } = require("util");
const logger = require("../lib/logger.js");

class Repository {
  constructor(dataClient, metaDataClient, TTL = 100) {
    this.data = dataClient;
    this.meta = metaDataClient;
    this.TTL = TTL * 1000;

    const client = redis.createClient({
      port: config.REDIS_PORT,
      host: config.REDIS_HOST,
      password: config.REDIS_PASSWORD,
    });
    const getAsync = promisify(client.get).bind(client);
    const setAsync = promisify(client.set).bind(client);
    this.cache = { client, getAsync, setAsync };

    this.cachingKeys = {
      getArtists: this.buildCacheKey`artists:limit${0}page${1}`,
      getAlbums: this.buildCacheKey`artist:${0}:albums`,
      getAlbum: this.buildCacheKey`artist:${0}:albums:${1}`,
      getSongs: this.buildCacheKey`artist:${0}:albums:${1}:songs`,
    };
  }
  async getArtists(limit = 10, page = 2) {
    const key = this.cachingKeys.getArtists(limit, page);
    return this.tryCache(key, async () => {
      return await this.data.getArtists(limit, page);
    });
  }

  async getAlbums(artist) {
    const resolvePromises = async (promises) => {
      return Promise.all(promises);
    };

    let key = this.cachingKeys.getAlbums(artist.name);
    let albumNames = await this.tryCache(key, async () => {
      return await this.data.getAlbumsByArtist(artist);
    });
    let res = {};
    artist.albums = albumNames;

    let promises = [];
    albumNames.map((name) => {
      promises.push(this.getAlbum(artist, name));
    });

    let resolved = await resolvePromises(promises);

    for (let i = 0; i < resolved.length; i++) {
      res[albumNames[i]] = resolved[i];
    }

    return res;
  }

  async getAlbum(artist, albumName) {
    let album = new Album(artist.name, albumName);
    const key = this.cachingKeys.getAlbum(artist.name, albumName);
    let details = this.tryCache(key, async () => {
      return await this.meta.getAlbumDetails(album);
    });
    return details;
  }

  async getSongs(album) {
    const key = this.cachingKeys.getSongs(album.artist, album.name);
    const songs = this.tryCache(key, async () => {
      return await this.data.getSongsByAlbum(album);
    });
    return songs;
  }

  async getSong(song, res) {
    return this.data.downloadAudioFile(song, res);
  }

  async tryCache(key, func) {
    let cacheRes = await this.cache.getAsync(key);
    logger.debug(cacheRes);
    if (cacheRes) {
      logger.info("Using Redis Cache...");
      return JSON.parse(cacheRes);
    } else {
      let res = await func();
      this.cache.setAsync(key, JSON.stringify(res));
      return res;
    }
  }

  // buildCacheKey(strings, artist, album = null, song = null) {
  //   {
  //     let str0 = strings[0]; // "artist"
  //     let str1 = strings[1]; // "album"
  //     let str2 = string[2]; // "song"

  //     let artistStr = artist;

  //     let albumStr = album;
  //     if (!album) {
  //       albumStr = "null";
  //     }

  //     let songStr = song;
  //     if (!song) {
  //       songStr = "null";
  //     }

  //     // We can even return a string built using a template literal
  //     return `${str0}${artistStr}${str1}${albumStr}${str2}`;
  //   }
  // }
  buildCacheKey(strings, ...keys) {
    return function (...values) {
      let dict = values[values.length - 1] || {};
      let result = [strings[0]];
      keys.forEach(function (key, i) {
        let value = Number.isInteger(key) ? values[key] : dict[key];
        result.push(value, strings[i + 1]);
      });
      return result.join("");
    };
  }
}

module.exports = Repository;
