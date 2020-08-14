"use-strict";
const stream = require("stream");

const assert = require("assert");
const logger = require("../../lib/logger");
const { s3Client, S3Client } = require("../../clients/aws_client");
const discogs = require("../../clients/discogs_client");
const axios = require("axios");
const sinon = require("sinon");

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
    describe("getArtistCache", () => {
      it("Checks exists in cache", async () => {
        let res = await s3Client.getArtistCache("Led Zeppelin");

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
        call = async () => await s3Client.getArtistCache("abcdefg");
        assert.rejects(call);
      });
    });
    describe("putArtistCache", () => {
      const tmpFilePath = "zzztmpe382349TEST";
      it("Checks successful put", async () => {
        let res = await s3Client.putArtistCache(tmpFilePath, {
          test: "object",
        });
        assert.deepEqual(res, { status: 200 });
      });
      it("Checks unsuccessful put", async () => {
        call = async () =>
          await s3Client.putArtistCache(
            tmpFilePath,
            { test: "object" },
            "12345"
          );
        assert.rejects(call);
      });
    });
    describe("listArtists", () => {
      it("Checks bucket not empty", async () => {
        let res = await s3Client.listArtists();
        assert.notEqual(res.length, 0);
      });
      it("Checks list object raises exception", () => {
        var expectedError = new Error("Testing");
        let stubS3 = sinon.stub(s3Client.client, "listObjectsV2");
        stubS3.returns((err, data) => {
          throw expectedError;
        });
        try {
          let res = s3Client.listArtists();
        } catch {
          assert.rejects(expectedError);
        }

        sinon.assert.calledOnce(stubS3);
        sinon.restore();
      });
    });
    describe("listAlbums", () => {
      it("Check Albums for existing Artist", async () => {
        const res = await s3Client.listAlbums("John Coltrane");
        assert(res.includes("A Love Supreme [Verve Reissue]"));
      });
      it("Check Albums for non-existing Artist", async () => {
        const res = await s3Client.listAlbums("ALKDJGIE2345");
        assert(Array.isArray(res));
        assert(res.length === 0);
      });
    });
    describe("playMusic", () => {
      it("Checks existing song returns buffer", async () => {
        let bufferStream = s3Client.playMusic(
          "Dick Oatts/Standard Issue/03 All The Things You Are.m4a"
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
      it("Checks existing albumId from Discogs API", async () => {
        res = await discogs.getAlbumId(
          "Led Zeppelin",
          "In Through the Out Door"
        );
        assert.equal(typeof res, "number");
      });
      it("Throws TypeError if invalid args passed", async () => {
        const fn = async () => await discogs.getAlbumId("Led Zeppelin");
        const fn2 = async () => await discogs.getAlbumId(null, "banana");
        assert.rejects(fn, TypeError);
        assert.rejects(fn2, TypeError);
      });
      it("Checks no album exists raises exception", async () => {
        res = await discogs.getAlbumId("Led Zeppelin", "Baasd;lkj234-9nana");
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
          let res = await discogs.getAlbumId(
            "Led Zeppelin",
            "In Through the Out Door"
          );
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
      it("Checks details from existing artist", async () => {
        const res = await discogs.getArtistDetails("Led Zeppelin");
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
        const res = await discogs.getArtistDetails("Led Zeppelin");
        sinon.assert.calledOnce(stubAxios);
        assert.equal(res, null);
        sinon.restore();
      });
    });
  });
});
