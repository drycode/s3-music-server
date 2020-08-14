const ServerCache = require("../../middlewares/cache");
const assert = require("assert");
const logger = require("../../lib/logger");
const sinon = require("sinon");
const songMap = require("../../middlewares/normalize");
const { normalizeSongName } = require("../../helpers/utils");

const serverCache = new ServerCache();

describe("Test Middlewares", () => {
  before(() => {
    sinon.replace(logger, "info", sinon.fake());
    sinon.replace(logger, "error", sinon.fake());
  });
  it("Checks cache timeout of 0", () => {
    let nullServer = new ServerCache(0);
    nullServer.put("hello", "world");
    assert.equal(nullServer.get("hello"), null);
  });
  describe("Test Caching Middleware", () => {
    before("Patches...", () => {
      serverCache.put("hello", "world");
    });
    describe("get", () => {
      it("Checks fetch exists in cache", () => {
        const res = serverCache.get("hello");
        assert.equal(res, "world");
      });
      it("Checks fetch non-existing in cache", () => {
        const res = serverCache.get("banana");
        assert.strictEqual(res, null);
      });
    });
    describe("put", () => {
      it("Checks put in cache", () => {
        const res = serverCache.put("april", "ludgate");
        assert.deepEqual(res, { statusCode: 201 });
      });
      it("Checks overwrite in cache", () => {
        const res = serverCache.put("hello", "");
        assert.deepEqual(res, { statusCode: 201 });
      });
    });
    describe("expressCachingMiddleware", () => {
      const fn = serverCache.expressCachingMiddleware();
      const req = {
        originalUrl: "www.s3music.com/original",
        url: "www.s3music.com",
      };
      let res = {
        result: null,
        send: (content) => {},
      };

      it("Checks cache content updated on res.send", () => {
        fn(req, res, () => {});
        let cache = { ...serverCache.data };
        res.send("update_cache");
        let updatedCache = { ...serverCache.data };
        assert.notDeepEqual(cache, updatedCache);
      });
      it("Checks cache content overwritten on res.send", () => {
        fn(req, res, () => {});
        res.send("update_cache");
        let cache = { ...serverCache.data };
        fn(req, res, () => {});
        res.send("updated_again");
        let updatedCache = { ...serverCache.data };
        assert.notDeepEqual(cache, updatedCache);
      });
    });
  });
  describe("Test Normalize Middleware", () => {
    songMap.putSongTarget("Hello-john.mp3");
    describe("getSongTarget", () => {
      it("Checks song exists in songMap", () => {
        const res = songMap.getSongTarget("Hello-john");
        assert.equal(res, "Hello-john.mp3");
      });
      it("Checks song does not exist in songMap", () => {
        const fn = () => songMap.getSongTarget("Hello johnny");
        assert.throws(fn, Error);
      });
    });
    describe("putSongTarget", () => {
      it("Checks valid put in songMap", () => {
        const target = "Hello-john.mp3";
        const res = songMap.putSongTarget(target);
        assert.equal(res, normalizeSongName(target));
      });
    });
  });
});
