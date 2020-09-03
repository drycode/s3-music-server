const sinon = require("sinon");
const Repository = require("../../repository/repository");
const assert = require("assert");
const logger = require("../../lib/logger");
const { Artist, Album, Song } = require("../../models/models");
const s3Repo = require("../../repository/s3Repository");
const discRepo = require("../../repository/discogsRepository");

const repo = new Repository(s3Repo, discRepo);

describe("Test Repository", () => {
  beforeEach(() => {
    sinon.replace(logger, "info", sinon.fake());
    sinon.replace(logger, "error", sinon.fake());
    sinon.replace(logger, "debug", sinon.fake());
  });
  describe("getArtists", () => {
    it("Checks artists returned", async () => {
      res = await repo.getArtists();
      assert.equal(Object.keys(res).length, 10);
    });
    it("Checks pagination returns different artists of appropriate length", async () => {
      let promises = [repo.getArtists(10, 1), repo.getArtists(10, 2)];
      let responses = await Promise.all(promises);
      let [res1, res2] = responses;
      assert.notDeepStrictEqual(res1, res2);
    });
    it("Checks data is mutated properly before returning to caller", async () => {
      const keys = [
        "id",
        "type",
        "title",
        "thumb",
        "cover_image",
        "resource_url",
      ];
      let res = await repo.getArtists();
      assert(typeof res == "object");

      const artistDetails = res[0].details;

      assert.deepEqual(Object.keys(artistDetails), keys);
    });
  });
  describe("getAlbum", () => {
    it("Checks album with details is successfully fetched", async () => {
      const artist = new Artist("Led Zeppelin");
      const res = await repo.getAlbum(artist, "Coda");
      assert.equal(res.name, "Coda");
    });
  });
  describe("getAlbums", () => {
    it("Checks albums by valid artist", async () => {
      const artist = new Artist("Led Zeppelin");
      const res = await repo.getAlbums(artist);
      assert(res.length > 0);
      assert.equal(res[0].artist, "Led Zeppelin");
      assert(res[0].details);
    });
    it("Checks invalid artist", async () => {
      const artist = new Artist("a;lkasdbg");
      const res = await repo.getAlbums(artist);
      assert.deepEqual(res, []);
    });
  });
  describe("getSongsByAlbum", async () => {
    it("Checks valid album", async () => {
      const album = new Album("Led Zeppelin", "Led Zeppelin I");
      const res = await repo.getSongs(album);
      assert(Object.keys(res).length > 0);
    });
    it("Checks invalid album", async () => {
      const album = new Album(";lkasd", "asdlkjg");
      const res = await repo.getSongs(album);
      assert.deepStrictEqual(res, []);
    });
  });
  describe("downloadAudioFile", () => {
    it("Checks download valid song", async () => {
      const album = new Album("Led Zeppelin", "In Through The Out Door");
      await repo.getSongs(album);
      const song = new Song(
        "Led Zeppelin",
        "In Through The Out Door",
        "Led Zeppelin - Fool In The Rain"
      );
      const res = repo.getSong(song, {
        set: () => {},
        write: () => {},
        end: () => {},
      });
      assert(typeof res == "object");
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  after(() => {
    sinon.restore();
    repo.cache.client.end(true);
  });
});
