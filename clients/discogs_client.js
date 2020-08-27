const fs = require("fs");
const config = require("../config");
const axios = require("axios");
const logger = require("../lib/logger");

// axios.defaults.headers.common['Authorization'] = `Discogs token=${accessKey}`

class DiscogsClient {
  constructor(accessTokenPath = config.discogsAccessTokenPath) {
    this.axios = axios;
    this.accessKey = this.getDiscogsToken(accessTokenPath);
    this.axios.defaults.headers.common[
      "Authorization"
    ] = `Discogs token=${this.accessKey}`;
  }

  getDiscogsToken(accessTokenPath) {
    const accessKey = fs
      .readFileSync(accessTokenPath, "utf-8")
      .split(" = ")[1]
      .trim();
    return accessKey;
  }

  /**
   * Returns the album Id for discogs API's best guess, or first result, given the params
   */
  async getAlbumId(album) {
    let albumName = album.name;
    let artistName = album.artist;
    // const checkArgs = () => {
    //   let missingArgs = 2;
    //   if (!artistName || !albumName) {
    //     missingArgs = !artistName ? (missingArgs += 1) : missingArgs;
    //     missingArgs = !albumName ? (missingArgs += 1) : missingArgs;
    //     return missingArgs;
    //   }
    //   return null;
    // };
    artistName = encodeURI(artistName);
    albumName = encodeURI(albumName);

    // const missingArgs = checkArgs();
    const promise = new Promise((resolve, reject) => {
      // if (missingArgs) {
      //   reject(
      //     new TypeError(
      //       `getAlbumId requires at least 2 arguments, but only ${missingArgs} were passed`
      //     )
      //   );
      // }
      this.axios
        .get(
          `https://api.discogs.com/database/search?q=${albumName}&type=album&artist=${artistName}`
        )
        .then((res) => {
          const topResult = res.data.results[0];
          if (topResult) {
            resolve(topResult.id);
          }
          resolve(null);
        })
        .catch((err) => {
          reject(err);
        });
    });
    return promise;
  }

  getAlbumDetails(masterId) {
    return new Promise((resolve, reject) => {
      this.axios
        .get(`https://api.discogs.com/masters/${masterId}`)
        .then((data) => {
          resolve(data);
          logger.debug(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Returns the best guess artist details from the discogs API
   */
  async getArtistDetails(artist) {
    const artistName = artist.name;
    let { data } = await this.axios.get(
      `https://api.discogs.com/database/search?q=${artistName}&type=artist`
    );
    if (data.results.length > 0) {
      return data.results[0];
    } else {
      return null;
    }
  }
}

discogs = new DiscogsClient();

module.exports = discogs;
