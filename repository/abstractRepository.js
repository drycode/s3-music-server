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
  }
  async getArtists(limit = 10, page = 2) {
    const key = `limit${limit}page${page}`;
    return this.tryCache(key, this.data.getArtists(limit, page));
  }

  async getAlbums(artist) {
    let albumNames = await this.tryCache(
      artist.name,
      this.data.getAlbumsByArtist(artist)
    );
    let res = {};
    // let albumNames = await this.data.getAlbumsByArtist(artist);
    artist.albums = albumNames;

    let promises = [];
    albumNames.map((name) => {
      let album = new Album(artist.name, name);
      promises.push(this.meta.getAlbumDetails(album));
    });

    let resolved = await this.resolvePromises(promises);

    for (let i = 0; i < resolved.length; i++) {
      res[albumNames[i]] = resolved[i];
    }

    return res;
  }

  async resolvePromises(promises) {
    return Promise.all(promises);
  }

  async getAlbum(artist, albumName) {
    let album = new Album(artist.name, albumName);
    let details = await this.meta.getAlbumDetails(album);
    return details;
  }

  async getSongs(album) {
    const songs = await this.data.getSongsByAlbum(album);
    return songs;
  }

  async getSong(song, res) {
    return this.data.downloadAudioFile(song, res);
  }

  async tryCache(key, func) {
    let cacheRes = await this.cache.getAsync(key);
    logger.debug(cacheRes);
    if (cacheRes) {
      logger.info("Using Redis Cache: " + func.name);
      return JSON.parse(cacheRes);
    } else {
      let res = await func;
      this.cache.setAsync(key, JSON.stringify(res));
      return res;
    }
  }
}

module.exports = Repository;
