FROM node:14.9.0-buster
COPY src /src
COPY package-lock.json package.json server.js  ./
COPY .env.docker .env
RUN npm install 
EXPOSE 5000
CMD node server.js