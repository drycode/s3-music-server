const logger = require("../lib/logger");
const discogs = require("../clients/discogs_client");
const { nullAlbum } = require("../models/null_responses");

class Discogs {
  constructor(client) {
    this.discogs = client;
  }
  async getAlbumDetails(album) {
    try {
      let masterId = await this.discogs.getAlbumId(album);
      logger.debug("Master ID: " + masterId);
      let tempRes = await this.discogs.getAlbumDetails(masterId);

      if (!tempRes) {
        return nullAlbum;
      }
      logger.debug(album + ": valid  details found");
      return tempRes.data;
    } catch (error) {
      logger.error("DiscogsRepo.getAlbumDetails: " + error);
      return nullAlbum;
    }
  }
}

module.exports = new Discogs(discogs);
