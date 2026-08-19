
FROM node:22 AS base

WORKDIR /app

COPY package.json ./

COPY package-lock.json ./

RUN npm install

COPY . .

FROM base AS builder

RUN npm i -g rimraf

RUN npm run build

FROM builder AS development

CMD ["node", "dist/main.js"]
