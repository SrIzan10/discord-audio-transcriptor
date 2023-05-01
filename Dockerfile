FROM node:alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN apk add make g++ ffmpeg bash sdl2-dev git
RUN bash ./util/setup.sh
RUN npm install -g typescript

RUN tsc --build

RUN node dist/index.js