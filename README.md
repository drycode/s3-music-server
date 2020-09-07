# S3 MusicPlayer

> This NodeJS application serves music stored directly in AWS S3, and utilizes the Discogs API for metadata about artists, albums, and songs

![last-commit][last-commit]
![open-issues][open-url]

As a professional musician and teacher, I have several terrabytes of proprietary audio data. In an attempt to keep my storage costs low, and keep my data highly available, I put together a web application which will allow me to store recordings for a reasonable price in AWS S3 (Infrequent Access).

I choose to use NodeJS for the backend because it seemed like an appropriate language to serve streaming content. Also, as someone with more experience with synchronous programming patterns, I am using this as an opportunity to practice event-driven programming and Javascript.

## API Documentation

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/fabe0a9dee129999687d)

## High Level Architecture

- The application runs on docker in AWS ECS Fargate, with an Elasticache (Redis) layer for performance
- The [Repository Pattern](https://deviq.com/repository-pattern/) was implemented to separate the Domain Layer from the underlying clients. This will allow for further extensibility of data layer storage solutions, and meta data acquisition from non-S3 and non-discogs sources.

```
_____________________________
    Frontent UI
_____________________________
    Authentication Layer

## SERVER
_____________________________
    Server Layer
        * Request / Response handling
        * HTTP server
        * Caching and Authentication
_____________________________
    Repository Layer
        * A layer of abstraction above the client layer
        * Uses the domain models to get artist / album / song data
_____________________________
    Models
        * Not dependent on the low-level clients
        * Expresses the domain model as a JS object
_____________________________
    Client Layer
        * Serves as the interface layer for accessing raw data from the Data layer
        * The client depends on the domain model, and not the other way around

## SERVER
_____________________________
    Data Layer (S3 / Discogs)
        * S3 Stores Music and Account information
        * Discogs stores metadata about albums, songs, and artists
```

## Caching

- Both an in-memory cache (for Artist, Album, and Song details) and S3 cache (for Artist details) sit in front of the Discogs API.
- The artists cache is very large, and is scheduled to update once a day.
- The Discogs API throttles access per user to 60 API calls per minute. Therefore, further over-eager loading strategies might need to be implemented to anticipate users' behaviors to reduce the load on the Discogs API
- The in-memory cache is both implemented as an Elasticache (Redis) store, and as a simple express middleware. The redundent express middleware cache assists in development in situations where a Redis cache is not available.

## Middlewares

_Express middlewares which process the incoming requests before handing them down to the routes_

- Caching Middleware being used to create an in memory cache of each request
- A songMap is being built to keep track of references between the presentation Song Name and the Song Path, or the denormalized name and extension of the file in S3.

## Development

- You'll first need to [register with the Discogs API](https://www.discogs.com/developers/#page:authentication) and retrieve an access token.
- Also make sure that you have an S3 bucket setup with music stored by keys that follow this form: `artist/album/song.ext`

_Running with docker (PREFERRED)_

```sh
➜ git clone https://github.com/drypycode/s3-music-server.git
➜ touch s3-music-server/.env.docker
➜ docker-compose up
```

`.env.docker`

```sh
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DISCOGS_TOKEN=
CACHE_TTL=
USE_REDIS=
```

_Running without docker_

```sh
➜ git clone https://github.com/drypycode/s3-music-server.git
➜ touch s3-music-server/.env
➜ npm start
```

`.env`

```sh
AWS_PROFILE_NAME=
DISCOGS_ACCESS_TOKEN_PATH=
DISCOGS_TOKEN=
CACHE_TTL=
USE_REDIS=
```

## Testing

_The default `npm test` command is all encompassing of regression, integration, and unit. If you would like to run one and not the others, use `mocha test/<type>`_

Be sure to start the development server before running regression tests.

```sh
➜ npm test
```

[open-url]: https://img.shields.io/github/issues-raw/danyoungmusic93/S3PlayMusic.svg
[last-commit]: https://img.shields.io/github/last-commit/danyoungmusic93/S3PlayMusic.svg
[postman]: https://documenter.getpostman.com/view/6396321/TVCiU78X
