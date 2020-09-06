const express = require("express");
const expressOasGenerator = require("express-oas-generator");

const path = require("path");

const logger = require("./lib/logger.js");
const Repository = require("./repository/repository.js");
const s3Repo = require("./repository/s3Repository");
const discRepo = require("./repository/discogsRepository");
const ServerCache = require("./middlewares/cache.js");

const expressPino = require("express-pino-logger");
const { Artist, Song, Album } = require("./models/models.js");

const defaultCacheTTL = process.env.CACHE_TTL || 300;

const expressLogger = expressPino({ logger });
const repo = new Repository(s3Repo, discRepo, process.env.USE_REDIS || true);

const app = express();

const cacheMiddleware = new ServerCache(defaultCacheTTL)
  .expressCachingMiddleware;

app.use(expressLogger);
app.get("", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/test", (req, res) => {
  res.send({ express: "Hello from express" });
});

app.get("/artists", cacheMiddleware(defaultCacheTTL), async (req, res) => {
  if (req.query.limit & req.query.page) {
    response = await repo.getArtists(
      parseInt(req.query.limit),
      parseInt(req.query.page)
    );
  } else {
    response = await repo.getArtists();
  }
  res.send(response);
});

app.get(
  "/artists/:artist/albums",
  cacheMiddleware(defaultCacheTTL),
  async (req, res) => {
    const artist = new Artist(req.params.artist);
    response = await repo.getAlbums(artist);
    res.send(response);
  }
);

app.get(
  "/artists/:artist/albums/:album/songs",
  cacheMiddleware(defaultCacheTTL),
  async (req, res) => {
    const album = new Album(req.params.artist, req.params.album);
    response = await repo.getSongs(album);
    res.send(response);
  }
);

app.get("/artists/:artist/albums/:album/songs/:song/play", (req, res) => {
  const song = new Song(req.params.artist, req.params.album, req.params.song);
  repo.getSong(song, res);
});

app.listen(5000, function () {
  console.log("makin music on 5000");
});
