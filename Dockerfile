FROM node:alpine

WORKDIR /app

RUN apk add make g++ ffmpeg bash sdl2-dev
RUN bash ./util/setup.sh

COPY package.json ./

RUN npm install

COPY . .

RUN tsc --build

RUN node dist/index.js