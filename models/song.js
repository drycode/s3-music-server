const { s3Client } = require("../clients/aws_client.js");
const logger = require("../lib/logger.js");

const { nullSong } = require("../models/null_responses.js");
const songMap = require("../middlewares/normalize.js");

class Song {}

module.exports = new Song();
