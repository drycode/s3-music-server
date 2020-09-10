const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const logger = require("./src/lib/logger.js");
const Repository = require("./src/repository/repository.js");
const s3Repo = require("./src/repository/s3Repository");
const discRepo = require("./src/repository/discogsRepository");
const ServerCache = require("./src/middlewares/cache.js");

const expressPino = require("express-pino-logger");
const { Artist, Song, Album } = require("./src/models/models.js");

const defaultCacheTTL = process.env.CACHE_TTL || 300;

const expressLogger = expressPino({ logger });
const repo = new Repository(s3Repo, discRepo, process.env.USE_REDIS);
const app = express();

const cacheMiddleware = new ServerCache(defaultCacheTTL)
  .expressCachingMiddleware;

app.use(expressLogger, express.json());
app.get("", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/healthy", (req, res) => {
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
    response = await repo.getAlbums(req.params.artist);
    res.send(response);
  }
);

app.get(
  "/artists/:artist/albums/:album/songs",
  cacheMiddleware(defaultCacheTTL),
  async (req, res) => {
    response = await repo.getSongs(req.params.artist, req.params.album);
    res.send(response);
  }
);

app.get("/artists/:artist/albums/:album/songs/:song/play", (req, res) => {
  repo.getSong(req.params, res);
});

app.get("/playQueue", (req, res) => {
  logger.debug(repo.activePlayQueue);
  if (repo.activePlayQueue) {
    const song = repo.dequeueFromPlayQueue();
    res.status(200).send(song);
  } else {
    res.status(204).send("The Play Queue is empty.");
  }
});

app.post("/playQueue", (req, res) => {
  try {
    repo.addToQueue(req.body);
    res.status(201).send("Successfully added song to Play Queue. ");
  } catch (err) {
    res.status(422).send(err);
  }
});

app.patch("/playQueue", (req, res) => {
  repo.moveInQueue(req.body);
  res.status(204).send();
});

app.delete("/playQueue", (req, res) => {
  repo.removeFromQueueAtIndex(req.body.index);
  res.status(204).send();
});

app.listen(5000, function () {
  console.log("makin music on 5000");
});
