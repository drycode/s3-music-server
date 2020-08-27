const config = require("../config");
const redis = require("redis");

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      port: config.REDIS_PORT,
      host: config.REDIS_HOST,
      password: config.REDIS_PASSWORD,
    });
  }
  healthy() {
    this.client.on("error", function (error) {
      console.error(error);
    });

    this.client.set("key", "value", redis.print);
    this.client.get("key", redis.print);
    this.client.quit();
  }
}
// module.exports = new RedisClient();
const client = new RedisClient();
client.healthy();
