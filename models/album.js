const { s3Client } = require("../clients/aws_client.js");
const logger = require("../lib/logger.js");

const { nullAlbum } = require("../models/null_responses.js");

class Album {
  constructor(path) {
    this.reference = path;
  }
}

module.exports = new Album();
