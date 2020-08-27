const logger = require("../lib/logger");
const discogs = require("../clients/discogs_client");
const Album = require("../models/album");
const { nullAlbum } = require("../models/null_responses");

class Discogs {
  constructor(client) {
    this.discogs = client;
  }
  async getAlbumDetails(albums) {
    let response = {};
    const promises = albums.map(async (album) => {
      // let album = new Album(artist.name, albumName);
      let result = await this.discogs.getAlbumId(album);
      try {
        let masterId = result;
        let tempRes = await this.discogs.getAlbumDetails(masterId);
        if (!tempRes) {
          return [album.name, nullAlbum];
        }
        return [album.name, tempRes.data];
      } catch (error) {
        logger.error(error);
        return [album.name, nullAlbum];
      }
    });

    const responses = await Promise.all(promises);
    responses.map((data) => {
      response[data[0]] = data[1];
    });
    return response;
  }
}

module.exports = new Discogs(discogs);
