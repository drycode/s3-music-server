"use-strict";
const stream = require("stream");

const assert = require("assert");
const logger = require("../../lib/logger");
const { s3Client, S3Client } = require("../../clients/aws_client");
const discogs = require("../../clients/discogs_client");
const axios = require("axios");
const sinon = require("sinon");

const Artist = require("../../models/artist");
const Album = require("../../models/album");
const Song = require("../../models/song");

function isReadableStream(obj) {
  return (
    obj instanceof stream.Stream &&
    typeof (obj._read === "function") &&
    typeof (obj._readableState === "object")
  );
}

describe("Test Clients", () => {
  before(() => {
    sinon.replace(logger, "info", sinon.fake());
    sinon.replace(logger, "error", sinon.fake());
    sinon.replace(logger, "debug", sinon.fake());
  });
  describe("Test AWS S3 Client", () => {
    describe("getArtistDetails", () => {
      const artist = new Artist("Led Zeppelin");
      it("Checks exists in cache", async () => {
        let res = await s3Client.getArtistDetails(artist);

        assert.deepStrictEqual(Object.keys(res), [
          "id",
          "type",
          "user_data",
          "master_id",
          "master_url",
          "uri",
          "title",
          "thumb",
          "cover_image",
          "resource_url",
        ]);
      });
      it("Checks NOT exists in cache", async () => {
        const artist = new Artist("abcdefg");
        call = async () => await s3Client.getArtistDetails(artist);
        assert.rejects(call);
      });
    });
    describe("putArtistDetails", () => {
      const tmpFilePath = "zzztmpe382349TEST";
      const artist = new Artist(tmpFilePath);
      it("Checks successful put", async () => {
        let res = await s3Client.putArtistDetails(artist, {
          test: "object",
        });
        assert.deepEqual(res, { status: 200 });
      });
      it("Checks unsuccessful put", async () => {
        call = async () =>
          await s3Client.putArtistDetails(artist, { test: "object" }, "12345");
        assert.rejects(call);
      });
    });
    describe("listArtists", () => {
      it("Checks bucket not empty", async () => {
        let res = await s3Client.listArtists();
        assert.notEqual(res.length, 0);
      });
      it("Checks list object raises exception", () => {});
    });
    describe("listAlbums", () => {
      it("Check Albums for existing Artist", async () => {
        const res = await s3Client.listAlbums(new Artist("John Coltrane"));
        assert(res.includes("A Love Supreme [Verve Reissue]"));
      });
      it("Check Albums for non-existing Artist", async () => {
        const res = await s3Client.listAlbums(new Artist("ALKDJGIE2345"));
        assert(Array.isArray(res));
        assert(res.length === 0);
      });
    });
    describe("listSongs", () => {
      it("Checks listSongs for existing album", async () => {
        let res = await s3Client.listSongs(
          new Album("Dick Oatts", "Standard Issue")
        );
        assert(res.length > 0);
      });
      it("Checks listSongs for non-existing album", async () => {
        let res = await s3Client.listSongs(
          new Album("Sick Doatts", "Standard Issue")
        );
        assert(res.length == 0);
        assert.deepStrictEqual(res, []);
      });
    });
    describe("playMusic", () => {
      it("Checks existing song returns buffer", async () => {
        let bufferStream = s3Client.playMusic(
          new Song("Dick Oatts", "Standard Issue", "All The Things You Are")
          // "Dick Oatts/Standard Issue/03 All The Things You Are.m4a"
        );
        assert(isReadableStream(bufferStream));
      });
      it("Checks non-existing song", async () => {});
    });
    after(() => {
      sinon.restore();
    });
  });
  describe("Test Discogs Client", () => {
    describe("getDiscogsToken", () => {
      it("Checks that the discogs token get's fetched properly", () => {
        assert(typeof discogs.getDiscogsToken(), String);
      });
    });
    describe("getAlbumId", () => {
      let album = new Album("Led Zeppelin", "In Through the Out Door");
      it("Checks existing albumId from Discogs API", async () => {
        let res = await discogs.getAlbumId(album);
        assert.equal(typeof res, "number");
      });

      it("Checks no album exists raises exception", async () => {
        album = new Album("Led Zeppelin", "Baasd;lkj234-9nana");
        const res = await discogs.getAlbumId(album);
        assert.equal(res, null);
      });
      it("Checks proper handling of downstream Promise rejection", async () => {
        var expectedError = new Error("Testing");
        var stubAxios = sinon.stub(axios, "get");
        stubAxios.returns(
          new Promise((resolve, reject) => {
            reject(expectedError);
          })
        );
        try {
          let res = await discogs.getAlbumId(album);
        } catch (exc) {
          assert.equal(exc, expectedError);
        }

        sinon.assert.calledOnce(stubAxios);
        sinon.restore();
      });
    });
    describe("getAlbumDetails", () => {
      it("Checks details from existing album", async () => {
        const res = await discogs.getAlbumDetails(4752);

        assert.deepEqual(Object.keys(res), [
          "status",
          "statusText",
          "headers",
          "config",
          "request",
          "data",
        ]);
      });

      it("Check exception from missing album", async () => {
        const code = 404;
        const fn = async () =>
          await discogs.getAlbumDetails(234859234823502349235829);
        assert.rejects(fn, Error(`Request failed with status code ${code}`));
      });
    });
    describe("getArtistDetails", () => {
      const artist = new Artist("Led Zeppelin");
      it("Checks details from existing artist", async () => {
        const res = await discogs.getArtistDetails(artist);
        assert.deepStrictEqual(Object.keys(res), [
          "id",
          "type",
          "user_data",
          "master_id",
          "master_url",
          "uri",
          "title",
          "thumb",
          "cover_image",
          "resource_url",
        ]);
      });
      it("Checks return null if details not found", async () => {
        var stubAxios = sinon.stub(axios, "get");
        stubAxios.returns({ data: { results: [] } });
        const res = await discogs.getArtistDetails(artist);
        sinon.assert.calledOnce(stubAxios);
        assert.equal(res, null);
        sinon.restore();
      });
    });
  });
});
