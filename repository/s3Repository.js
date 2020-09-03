const { s3Client } = require("../clients/aws_client.js");
const logger = require("../lib/logger");
const discogs = require("../clients/discogs_client");

const songMap = require("../middlewares/normalize.js");
const { Artist, Song } = require("../models/models.js");
const { nullSong } = require("../models/null_responses.js");

class S3Repository {
  constructor(s3_client, discogs_client) {
    this.s3Client = s3_client;
    this.discogs = discogs_client;
  }

  async getArtists(limit = 10, page = 2) {
    let response = [];
    let data = await this.s3Client.listArtists();

    const promises = data
      .slice(limit * page, limit * page + limit)
      .map(async (name) => {
        let artist = new Artist(name);
        return [artist, await this.s3Client.getArtistDetails(artist)];
      });

    const responses = await Promise.all(promises);

    responses.map((data) => {
      logger.debug(data[1]);
      let artist = data[0];
      artist.setDetails(data[1]);
      response.push(artist);
    });
    return response;
  }

  async getAlbumNames(artist) {
    let albumNames = await this.s3Client.listAlbums(artist);
    return albumNames;
  }

  async getSongsByAlbum(album) {
    let songs = await this.s3Client.listSongs(album);
    const matchAlbumDetailsToSong = (songName) => {
      const tracklist = album.details?.tracklist;
      if (tracklist) {
        for (let i in tracklist) {
          if (tracklist[i].title == songName) {
            return tracklist[i];
          }
        }
      }
      return nullSong;
    };
    let res = [];
    for (let i = 0; i < songs.length; i++) {
      const songName = songs[i];
      songMap.putSongTarget(songName);
      let song = new Song(album.artist, album.name, songName);
      // Add switch case. If songs.length == album.details.tracklist.length, map directly, otherwise use name lookup
      switch (songs.length == album.details?.tracklist.length) {
        case true:
          song.details = album.details.tracklist[i];
        case false:
          song.details = matchAlbumDetailsToSong(song.name);
      }

      res.push(song);
    }

    return res;
  }

  async downloadAudioFile(song, res) {
    let downloadStream = this.s3Client.playMusic(song);
    logger.info("Request for song initiated");
    res.set("content-type", "audio/mp3");
    res.set("accept-ranges", "bytes");

    downloadStream.on("error", (err) => {
      if (err.code === "NoSuchKey") {
        logger.error(err.name + `: ${song.name}`);
        logger.info(songMap);
        setTimeout(() => {
          downloadStream.emit("end");
        }, 20);
      }
    });

    downloadStream.on("data", (chunk) => {
      res.write(chunk);
    });

    downloadStream.on("end", () => {
      res.end();
    });
  }
}

module.exports = new S3Repository(s3Client, discogs);
