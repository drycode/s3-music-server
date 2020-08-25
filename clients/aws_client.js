const AWS = require("aws-sdk");
const config = require("../config");
const logger = require("../lib/logger");
const songMap = require("../middlewares/normalize");
const { normalizeArtistName } = require("../helpers/utils");
const Album = require("../models/album");
const { S3 } = require("aws-sdk");

class S3Client {
  constructor(cacheTTL = 60) {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({
      profile: config.profile,
    });
    this.client = new AWS.S3();
    this.artistNames = [];
    this.albumNames = [];
    this.songPaths = [];
    this.baseParams = {
      Bucket: config.bucket /* required */,
      Delimiter: "/",
    };
    this.TTL = cacheTTL * 1000;
    this.lastRefreshed = Date.now();
  }

  /**
   * Calls listObjects on the music bucket and parses a list of "artistNames"
   */
  listArtists() {
    if (!this.cacheTimedOut() && this.artistNames.length > 0) {
      return new Promise((resolve) => resolve(this.artistNames));
    }
    return new Promise((resolve, reject) => {
      this.client.listObjectsV2(this.baseParams, (err, res) => {
        if (err) {
          reject(err);
        } else {
          logger.debug("S3 List Objects Call made: listing artists");
          for (let i in res.CommonPrefixes) {
            this.artistNames.push(res.CommonPrefixes[i].Prefix);
          }
          resolve(this.artistNames);
        }
      });
    });
  }

  /**
   * Calls listObjects with an artistName prefix to compile a list of "albumNames"
   * for a particular artist
   * @param {Object} artist The artist object as defined in models/artist.js
   */
  listAlbums(artist) {
    const artistPath = S3Client.buildArtistPath(artist);
    let params = this.baseParams;
    params.Prefix = artistPath;
    return new Promise((resolve, reject) => {
      logger.info(`S3 List Objects Call made: listing ${artist} albums`);
      this.client.listObjectsV2(params, (err, res) => {
        if (err) {
          logger.error(err);
          reject(err);
        }
        this.albumNames = [];
        res.CommonPrefixes.forEach((obj) => {
          let albumName = obj.Prefix.split("/");
          albumName = albumName[albumName.length - 2];
          this.albumNames.push(albumName);
        });
        resolve(this.albumNames);
      });
    });
  }

  /**
   * Calls listObjects with an artistName/albumName prefix to fetch songs for a given
   * artist and album
   * @param {Object} album The album object as defined in models/album.js
   */
  listSongs(album) {
    const albumPath = S3Client.buildAlbumPath(album);
    let params = this.baseParams;
    params.Prefix = albumPath;
    return new Promise((resolve, reject) => {
      this.client.listObjectsV2(params, (err, res) => {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          this.songPaths = [];
          res.Contents.forEach((obj) => {
            let songName = obj.Key.split("/");
            songName = songName[songName.length - 1];
            if (songName) {
              songMap.putSongTarget(songName);
              this.songPaths.push(songName);
            }
          });
          resolve(this.songPaths);
        }
      });
    });
  }

  /**
   * Returns a read stream object for an audio file.
   * @param {Object} song The song object as defined in models/song.js
   */
  playMusic(song) {
    const songTarget = S3Client.buildSongPath(song);
    let params = { Bucket: config.bucket, Key: songTarget };
    return this.client.getObject(params).createReadStream();
  }

  /**
   * Requests the artist information from the s3 cache
   * @param {Object} artist The artist object as defined in models/artist.js
   * @param {*} cacheBucket The name of the bucket used for caching the DiscogsAPI response
   */
  getArtistDetails(artist, cacheBucket = "discogs-api-cache") {
    return new Promise((resolve, reject) => {
      // try {
      let key = S3Client.buildArtistDetailsPath(artist);
      this.client.getObject({ Bucket: cacheBucket, Key: key }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(res.Body.toString("utf-8")));
        }
      });
    });
  }

  /**
   *
   * @param {Object} artist The artist object as defined in models/artist.js
   * @param {Object} jsonObj The jsonFile in object form to be pushed to s3
   * @param {*} cacheBucket The name of the bucket used for caching the DiscogsAPI response
   */
  putArtistDetails(artist, jsonObj, cacheBucket = "discogs-api-cache") {
    const params = {
      Bucket: cacheBucket,
      Key: S3Client.buildArtistDetailsPath(artist),
      Body: Buffer.from(JSON.stringify(jsonObj), "binary"),
    };

    return new Promise((resolve, reject) => {
      this.client.putObject(params, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve({ status: 200 });
      });
    });
  }

  cacheTimedOut() {
    if (this.lastRefreshed + this.TTL > Date.now()) {
      return false;
    }
    return true;
  }

  static buildArtistDetailsPath(artist) {
    return `artists/${normalizeArtistName(artist.name)}.json`;
  }

  static buildArtistPath(artist) {
    return artist.name + "/";
  }

  static buildAlbumPath(album) {
    return `${album.artist}/${album.name}/`;
  }

  static buildSongPath(song) {
    let songName;
    try {
      songName = songMap.getSongTarget(song.name);
    } catch {
      const _ = this.listSongs(new Album(song.artist, song.album));
      songName = songMap.getSongTarget(song.name);
    }
    return `${song.artist}/${song.album}/${songName}`;
  }
}

const s3Client = new S3Client();

module.exports = { s3Client, S3Client };
