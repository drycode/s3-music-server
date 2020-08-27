const { s3Client } = require("../clients/aws_client.js");
const logger = require("../lib/logger");
const discogs = require("../clients/discogs_client");
const { nullSong } = require("../models/null_responses.js");
const songMap = require("../middlewares/normalize.js");
const Artist = require("../models/artist.js");
const Album = require("../models/album.js");

const { nullAlbum } = require("../models/null_responses.js");

class S3Repository {
  constructor(s3_client, discogs_client) {
    this.s3Client = s3_client;
    this.discogs = discogs_client;
  }

  async getArtists(limit = 10, page = 2) {
    let response = {};
    let data = await this.s3Client.listArtists();

    const promises = data
      .slice(limit * page, limit * page + limit)
      .map(async (name) => {
        let artist = new Artist(name);
        return [name, await this.s3Client.getArtistDetails(artist)];
      });

    const responses = await Promise.all(promises);

    responses.map((data) => {
      // TODO: Clean up
      logger.debug(data[1]);
      delete data[1].master_id;
      delete data[1].master_url;
      delete data[1].uri;
      delete data[1].user_data;
      response[data[0]] = data[1];
    });
    return response;
  }

  /**
   * TODO: Currently very slow when returning several albums by a single artist because of the discogs calls
   * Solution 1: Cache in S3 and call the S3 cache and Discogs API's concurrently, take whatever comes
   *   back with a valid response first
   * Solution 2: Redis Cache with discogs failover
   */
  async getAlbumsByArtist(artist) {
    let albums = [];
    let albumNames = await this.s3Client.listAlbums(artist);
    albumNames.map((albumName) => {
      albums.push(new Album(artist, albumName));
    });
    return albums;
  }

  async getSongsByAlbum(album) {
    let songs = await this.s3Client.listSongs(album);
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      songMap.putSongTarget(song);
    }
    return songs;
  }

  async downloadAudioFile(song, res) {
    const artist = song.artist;
    const album = song.album;
    const songName = song.name;

    let downloadStream = this.s3Client.playMusic(song);
    logger.info("Request for song initiated");
    res.set("content-type", "audio/mp3");
    res.set("accept-ranges", "bytes");

    downloadStream.on("error", (err) => {
      if (err.code === "NoSuchKey") {
        logger.error(err);
        setTimeout(() => {
          downloadStream.emit("end");
        }, 20);
      }
    });

    downloadStream.on("data", (chunk) => {
      res.write(chunk);
      logger.debug("Rendering chunk...");
    });

    downloadStream.on("end", () => {
      logger.info("Download Complete.");
      res.end();
    });
  }
}

module.exports = new S3Repository(s3Client, discogs);
