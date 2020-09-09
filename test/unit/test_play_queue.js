const assert = require("assert");
const { Song } = require("../../src/models/models");
const PlayQueue = require("../../src/models/playqueue");
const { first } = require("lodash");

const buildQueue = () => {
  let queue = new PlayQueue();
  for (let i = 0; i < 5; i++) {
    queue.enqueue(
      new Song("Led Zeppelin", "In Through the Out Door", `Song ${i}`)
    );
  }
  return queue;
};

describe("Test PlayQueue", () => {
  describe("enqueue", () => {
    it("Checks 5 items added to the queue", () => {
      let queue = buildQueue();
      assert.equal(queue.size, 5);
      const song = new Song("Hello", "World", "Song");
      queue.enqueue(song);
      assert.equal(queue.size, 6);
      assert.deepStrictEqual(queue.tail.payload, song);
    });
  });
  describe("dequeue", () => {
    it("Checks dequeue from front of list", () => {
      let queue = buildQueue();
      const upNext = queue.dequeue();
      assert.equal(queue.size, 4);
      assert.equal(upNext.name, "Song 0");
    });
  });
  describe("remove", () => {
    it("Checks item can be removed from the middle of the queue", () => {
      let queue = buildQueue();
      queue.remove(2);
      let target = queue.head.next;
      while (target.next) {
        target = target.next;
        assert.notEqual(target.payload.name, "Song 2");
      }
    });
  });

  describe("move", () => {
    it("Checks moving of queue order", () => {
      let queue = buildQueue();
      queue.move(4, 0);
      const firstSong = queue.dequeue();
      assert.equal(firstSong.name, `Song 4`);
    });
  });
});
