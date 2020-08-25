const { nullArtist } = require("./null_responses.js");

class Artist {
  constructor(name) {
    this._name = name;
    this.details = nullArtist;
  }
  get name() {
    return this._name;
  }
}

module.exports = Artist;
