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
    res = await instance.get("/playQueue");
    assert.equal(res.status, 200);
    assert.equal(res.data.artist, "Led Zeppelin");
    for (let i = 0; i <= 5; i++) {
      res = await instance.get("/playQueue");
    }
    assert.equal(res.status, 204);
  });

  // app.patch("/playQueue", (req, res) => {
  //   repo.moveInQueue(req.body);
  //   res.status(204).send();
  // });

  // app.delete("/playQueue", (req, res) => {
  //   repo.removeFromQueueAtIndex(req.body.index);
  //   res.status(204).send();
  // });
});
