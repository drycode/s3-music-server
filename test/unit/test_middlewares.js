const ServerCache = require("../../middlewares/cache");
const assert = require("assert");
const logger = require("../../lib/logger");
const sinon = require("sinon");

const serverCache = new ServerCache();

describe("Test Middlewares", () => {
  it("Checks cache timeout of 0", () => {
    let nullServer = new ServerCache(0);
    nullServer.put("hello", "world");
    assert.equal(nullServer.get("hello"), null);
  });
  describe("Test Caching Middleware", () => {
    before("Patches...", () => {
      sinon.replace(logger, "info", sinon.fake());
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
});
