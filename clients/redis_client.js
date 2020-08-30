const config = require("../config");
const redis = require("redis");
const assert = require("assert");
const models = require("../models/models");
const logger = require("../lib/logger");

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      port: config.REDIS_PORT,
      host: config.REDIS_HOST,
      password: config.REDIS_PASSWORD,
    });
    // this.client.on("error", function (error) {
    //   console.error(error);
    // });
  }
  healthy() {
    this.client.set("key", "value");
    this.client.get("key", (err, val) => {
      assert.equal(val, "value");
    });
    this.client.del("key");
  }
  get(key, callback) {
    this.client.get(key, callback);
  }
  // get(key) {
  //   return new Promise((resolve, reject) => {
  //     this.client.get(key, (err, res) => {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         logger.info("Getting value from Redis Cache...");
  //         resolve(res);
  //       }
  //     });
  //   });
  // }
  set(key, val, callback) {
    this.client.set(key, val, callback);
  }
  // set(key, val) {
  //   return new Promise((resolve, reject) => {
  //     this.client.set(key, val, (err, res) => {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         logger.info("Setting value in Redis Cache...");
  //         resolve(res);
  //       }
  //     });
  //   });
  // }
}
const client = new RedisClient();

module.exports = client;
