const { nullArtist } = require("./null_responses.js");

class Artist {
  constructor(name, albums = null) {
    this._name = name;
    this._albums = albums;
    this.details = nullArtist;
  }
  get name() {
    return this._name;
  }
  get albums() {
    return this._albums;
  }
  set albums(albums) {
    // Validate album update
    this._albums = albums;
  }
}

module.exports = Artist;
