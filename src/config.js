const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

function getDiscogsToken(accessTokenPath) {
  const accessKey = fs
    .readFileSync(accessTokenPath, "utf-8")
    .split(" = ")[1]
    .trim();
  return accessKey;
}

const CONFIG = {
  bucket: process.env.S3_BUCKET,
  profile: process.env.AWS_PROFILE_NAME,
  discogsAccessToken:
    process.env.DISCOGS_TOKEN ||
    getDiscogsToken(process.env.DISCOGS_ACCESS_TOKEN_PATH),
  redis: {
    // port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    // password: process.env.REDIS_PASSWORD,
  },
};

module.exports = CONFIG;
