const logger = require("../lib/logger.js");

class ServerCache {
  constructor(TTL = 100) {
    this.data = new Map();
    this.TTL = TTL * 1000;
    // this.get = this.get.bind(this)
    // this.put = this.put.bind(this)
    // this.expressCachingMiddleware = this.expressCachingMiddleware.bind(this)
  }

  getCachedReq(path) {
    let cacheResult = this.data[path];
    if (cacheResult && cacheResult.last_updated > Date.now() - this.TTL) {
      logger.info("Retrieving cached response...");
      return cacheResult.data
    }
    return null
  }

  putCachedReq(path, value) {
    logger.info("Updating cache...");
    this.data[path] = {};
    this.data[path].data = value;
    this.data[path].last_updated = Date.now();
    return { "statusCode": 201 }
  }

  expressCachingMiddleware() {
    return (req, res, next) => {
      let key = "__express__" + req.originalUrl || req.url;
      let cacheContent = this.getCachedReq(key);
      if (cacheContent) {
        res.send(cacheContent);
      } else {
        res.sendResponse = res.send;
        res.send = (body) => {
          this.putCachedReq(key, body);
          res.sendResponse(body);
        };
        next();
      }
    };
  };
}

module.exports = ServerCache;
