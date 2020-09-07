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

## Helpers

_code and functionality to be shared by different parts of the project_

## Middlewares

_Express middlewares which process the incoming requests before handling them down to the routes_

- Caching Middleware being used to create an in memory cache of each request, stored by request

## Views

_provides templates which are rendered and served by your routes_

## Development

```sh
~ npm start
```

## Testing

```bash
npm test
```

[open-url]: https://img.shields.io/github/issues-raw/danyoungmusic93/S3PlayMusic.svg
[last-commit]: https://img.shields.io/github/last-commit/danyoungmusic93/S3PlayMusic.svg
[postman]: https://documenter.getpostman.com/view/6396321/TVCiU78X
