const assert = require("assert");

const { normalizeSongName, sleep } = require("../../helpers/utils");

describe("Test Helpers", function () {
  describe("normalizeSongName", () => {
    it("Should return a normalized string", () => {
      assert.equal(normalizeSongName("Hello.mp3"), "Hello");
      assert.equal(normalizeSongName("04 New Monastery.mp3"), "New Monastery");
      assert.equal(normalizeSongName("06 T.C..mp3"), "T.C.");
      assert.equal(normalizeSongName("07 15_8.mp3"), "15/8");
      assert.equal(
        normalizeSongName("03 You Are the Night and the Music.m4a"),
        "You Are the Night and the Music"
      );
      assert.equal(
        normalizeSongName("03 All The Things You Are.m4a"),
        "All The Things You Are"
      );
      assert.equal(
        normalizeSongName("03 Led Zeppelin - Fool In The Rain.mp3"),
        "Led Zeppelin - Fool In The Rain"
      );
      assert.equal(
        normalizeSongName("02 Giant Steps [Alternate Take] 11.mp3"),
        "Giant Steps [Alternate Take] 11"
      );
    });
  });
  describe("sleep", () => {
    it("Checks that sleep returns a Promise of setTimeout", async () => {
      let res = await sleep(0);
    });
  });
});
