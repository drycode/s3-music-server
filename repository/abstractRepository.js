class Repository {
  constructor(dataClient, metaDataClient) {
    this.data = dataClient;
    this.meta = metaDataClient;
  }
  async getArtists(limit = 10, page = 2) {}
  async getAlbums(artist) {
    const albums = await this.data.getAlbumsByArtist(artist);
    const response = await this.meta.getAlbumDetails(albums);
    return response;
  }
  async getSongs(album) {}
  async getSong(song) {}
}

module.exports = Repository;
