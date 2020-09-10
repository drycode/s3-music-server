const axios = require("axios");
const assert = require("assert");
const {
  nullArtist,
  nullAlbum,
  nullSong,
} = require("../../src/models/null_responses");

const instance = axios.create({
  baseURL: "http://localhost:5000",
});

describe("Test Server Endpoints", () => {
  it("/artists", async () => {
    const res = await instance.get("/artists");
    const artistObjs = Object.keys(res.data);
    const oneArtist = res.data[0];

    assert.equal(res.status, 200);
    assert(artistObjs.length > 0);
    assert.deepEqual(Object.keys(oneArtist.details), Object.keys(nullArtist));
  });
  it("/albums", async () => {
    const res = await instance.get("/artists/John Coltrane/albums");
    const albums = res.data;
    const oneAlbum = res.data[0];

    assert(oneAlbum != false);
    assert.equal(res.status, 200);
    assert(albums.length > 0);
    assert.equal(oneAlbum.artist, "John Coltrane");
    assert.deepEqual(Object.keys(oneAlbum.details), Object.keys(nullAlbum));
  });
  it("/songs", async () => {
    const res = await instance.get(
      "/artists/John Coltrane/albums/A Love Supreme [Verve Reissue]/songs"
    );
    const songs = res.data;
    assert.notEqual(songs.length, 0);
    assert.equal(songs[0].artist, "John Coltrane");
    assert.deepEqual(songs[0].details, nullSong);
  });
  it("POST /playQueue", async () => {
    let res = await instance.post("/playQueue", {
      artist: "Led Zeppelin",
      album: "In Through the Out Door",
      song: "Carouselambra",
    });
    assert.equal(res.status, 201);
    // res = instance.get({});
  });
  it("GET /playQueue", async () => {
    let res = await instance.get("/playQueue");
    assert.equal(res.status, 200);
    assert.equal(res.data.artist, "Led Zeppelin");
    for (let i = 0; i <= 5; i++) {
      res = await instance.get("/playQueue");
    }
    assert.equal(res.status, 204);
  });

  it("PATCH /playQueue", async () => {
    let res;
    for (let i = 0; i <= 4; i++) {
      res = await instance.post("/playQueue", {
        artist: "test",
        album: "test",
        song: `Song ${i}`,
      });
      assert.equal(res.status, 201);
    }
    res = await instance.patch("/playQueue", { oldIndex: 1, newIndex: 4 });
    assert.equal(res.status, 204);
    res = await instance.get("/playQueue");
  });

  it("DELETE /playQueue", async () => {
    let res;
    res = await instance.delete("/playQueue", { index: 0 });
    assert.equal(res.status, 204);
  });
});
