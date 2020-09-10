const { Album, Artist, Song } = require("../models/models.js");
const PlayQueue = require("../models/playqueue");
const redis = require("redis");
const config = require("../config");
const { promisify } = require("util");
const logger = require("../lib/logger.js");

class Repository {
  constructor(dataClient, metaDataClient, useCache = true) {
    this.data = dataClient;
    this.meta = metaDataClient;
    this.useCache = useCache;
    const client = redis.createClient(config.redis);
    const getAsync = promisify(client.get).bind(client);
    const setAsync = promisify(client.set).bind(client);
    this.cache = { client, getAsync, setAsync };
    this.playQueue = new PlayQueue();
    this.cachingKeys = {
      getArtists: this.buildCacheKey`artists:limit${0}page${1}`,
      getAlbums: this.buildCacheKey`artist:${0}:albums`,
      getAlbum: this.buildCacheKey`artist:${0}:albums:${1}`,
      getSongs: this.buildCacheKey`artist:${0}:albums:${1}:songs`,
    };
  }

  get activePlayQueue() {
    return this.playQueue.isEmpty() == false;
  }

  async getArtists(limit = 10, page = 2) {
    const key = this.cachingKeys.getArtists(limit, page);
    return this.tryCache(key, async () => {
      return await this.data.getArtists(limit, page);
    });
  }

  async getAlbums(artistName) {
    const artist = new Artist(artistName);
    const resolvePromises = async (promises) => {
      return Promise.all(promises);
    };

    let key = this.cachingKeys.getAlbums(artistName);
    let albumNames = await this.tryCache(key, async () => {
      return await this.data.getAlbumNames(artist);
    });

    let res = [];
    artist.albums = albumNames;

    let promises = [];
    albumNames.map((name) => {
      promises.push(this.getAlbum(artist, name));
    });

    let resolved = await resolvePromises(promises);

    return resolved;
  }

  async getAlbum(artist, albumName) {
    let album = new Album(artist.name, albumName);
    const key = this.cachingKeys.getAlbum(artist.name, albumName);
    let details = await this.tryCache(key, async () => {
      return await this.meta.getAlbumDetails(album);
    });
    album.setDetails(details);
    return album;
  }

  async getSongs(artistName, albumName) {
    const album = new Album(artistName, albumName);
    const key = this.cachingKeys.getSongs(artistName, albumName);
    const songs = await this.tryCache(key, async () => {
      return await this.data.getSongsByAlbum(album);
    });
    return songs;
  }

  async getSong(params, res) {
    const song = new Song(params.artist, params.album, params.song);
    const album = new Album(song.artist, song.album);
    this.data.downloadAudioFile(album, song, res);
  }

  dequeueFromPlayQueue() {
    logger.debug(this.playQueue);
    return this.playQueue.dequeue();
  }

  async addToQueue(params) {
    logger.debug(params);
    const cacheRes = await this.cache.getAsync(
      this.cachingKeys.getSongs(params.artist, params.album)
    );
    let details = null;
    if (cacheRes) {
      for (let song in cacheRes) {
        if (cacheRes[song].name == params.song.name) {
          details = cacheRes[song].details;
        }
      }
    }
    const song = new Song(params.artist, params.album, params.song, details);
    this.playQueue.enqueue(song);
  }

  moveInQueue(params) {
    this.playQueue.move(params.oldIndex, params.newIndex);
  }

  removeFromQueueAtIndex(index) {
    this.playQueue.remove(index);
  }

  async tryCache(key, func) {
    if (this.useCache) {
      let cacheRes;
      cacheRes = await this.cache.getAsync(key);
      logger.debug(cacheRes);
      if (cacheRes) {
        logger.info("Using Redis Cache...");
        return JSON.parse(cacheRes);
      } else {
        let res = await func();
        this.cache.setAsync(key, JSON.stringify(res));
        return res;
      }
    } else {
      return await func();
    }
  }

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
