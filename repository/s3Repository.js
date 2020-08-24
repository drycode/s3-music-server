const { s3Client } = require("../clients/aws_client.js");
const logger = require("../lib/logger.js");
const discogs = require("../clients/discogs_client");
const { nullSong } = require("../models/null_responses.js");
const songMap = require("../middlewares/normalize.js");

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
      .map(async (artist) => {
        return [artist, await this.s3Client.getArtistCache(artist)];
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

  async getAlbumsByArtist(artistName) {
    let response = {};

    let albums = await this.s3Client.listAlbums(artistName);
    const promises = albums.map(async (album) => {
      let result = await this.discogs.getAlbumId(artistName, album);
      try {
        let masterId = result;
        let tempRes = await this.discogs.getAlbumDetails(masterId);
        if (!tempRes) {
          return [album, nullAlbum];
        }
        return [album, tempRes.data];
      } catch (error) {
        logger.error(error);
        return [album, nullAlbum];
      }
    });

    const responses = await Promise.all(promises);
    responses.map((data) => {
      response[data[0]] = data[1];
    });
    return response;
  }

  async getSongsByAlbum(albumPath) {
    let songs = await this.s3Client.listSongs(albumPath);
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const normalizedSong = songMap.putSongTarget(song);
      songs[i] = normalizedSong;
    }
    return songs;
  }

  async downloadAudioFile(artist, album, song, res) {
    const songTarget = songMap.getSongTarget(song);
    const songPath = `${artist}/${album}/${songTarget}`;
    let downloadStream = this.s3Client.playMusic(songPath);
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
