const ServerCache = require("../../middlewares/cache")
const assert = require("assert")
const logger = require("../../lib/logger");
const sinon = require("sinon");

describe("Test Middlewares", () => {
  describe("Test Caching Middleware", () => {
    const serverCache = new ServerCache()
    before("Patches...", () => {
      sinon.replace(logger, "info", sinon.fake());
      serverCache.put("hello", "world")
    })
    describe("get", () => {
      it("Checks fetch exists in cache", () => {
        const res = serverCache.get("hello")
        assert.equal(res, "world")
      })
      it("Checks fetch non-existing in cache", () => {
        const res = serverCache.get("banana")
        assert.strictEqual(res, null)
      })
    })
    describe("put", () => {
      it("Checks put in cache", () => {
        const res = serverCache.put("april", "ludgate")
        assert.deepEqual(res, { "statusCode": 201 })
      })
      it("Checks overwrite in cache", () => {
        const res = serverCache.put("hello", "")
        assert.deepEqual(res, { "statusCode": 201 })
      })
    })
    describe("expressCachingMiddleware", () => {
      const fn = serverCache.expressCachingMiddleware
      req = { originalUrl: "www.s3music.com/original", url: "www.s3music.com" }
      res = {
        send(content) { return content }
      }
      it("Checks cache content exists", () => {
        const returnVal = fn()(req, res, () => { return "Success" })
        assert.equal(returnVal, "")
      })
      it("Checks cache content does not exist", () => {
        serverCache.put("__express__www.s3music.com/origin", "hello")
        req.originalUrl = "www.s3music.com/original"
        const returnVal = fn()(req, res, () => { return "Success" })
        assert.equal(returnVal, "")
      })
      it("Checks cache timeout of 0", () => {
        nullServer.put("__express__www.s3music.com/origin", "hello")
        req.originalUrl = "www.s3music.com/original"
        const returnVal = fn()(req, res, () => { return "Success" })
        assert.equal(returnVal, "success")
      })
    })
  })
})
