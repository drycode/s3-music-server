# S3 MusicPlayer

> A simple AWS S3 / Node / React application for playing personal music

![last-commit][last-commit]
![open-issues][open-url]

As a professional musician and teacher, I have several terrabytes of proprietary audio data. In an attempt to keep my storage costs low, and keep my data highly available, I put together a web application which will allow me to store recordings for a reasonable price in AWS S3 (Infrequent Access). 

Design Considerations
* I choose to use NodeJS for the backend because it seemed like an appropriate language to serve streaming content. Also, as someone with more experience in Python and synchronous programming patterns, I am using this as an opportunity to practice event-driven programming 

## Running the server

```
~ npm start
```

## High Level Architecture

- Request made to S3 to get list of Artists -> Albums -> Songs
- Subsequent calls made to the (Discogs API)[https://www.discogs.com/developers] to get metadata about a particular piece of data found in S3
  - Both an in memory (for Artist, Album, and Song details) and S3 cache (for Artist details) sit in front of the Discogs API.
  - The artists cache is very large, and is scheduled to update once a day. The Discogs API throttles access per user to 60 API calls per minute, which is infeasible to use if we expect to view more than a few dozen artists and their albums / songs.

## Controllers

_defines your app routes and their logic. You main route might be index.js but you might also have a route called for example ‘/user’ so you might want to make a JS file that just handles that._

## Helpers

_code and functionality to be shared by different parts of the project_

## Middlewares

_Express middlewares which process the incoming requests before handling them down to the routes_

- Caching Middleware being used to create an in memory cache of each request, stored by request

## Views

_provides templates which are rendered and served by your routes_

## Testing
```bash
npm test
```

[open-url]: https://img.shields.io/github/issues-raw/danyoungmusic93/S3PlayMusic.svg
[last-commit]: https://img.shields.io/github/last-commit/danyoungmusic93/S3PlayMusic.svg
