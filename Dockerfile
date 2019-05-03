# Creates the LCMS Connector Tool.
# docker run --rm -it -p 5000:5000 -e LCMS_CONNECTOR_SERVER_MODE=true -e LCMS_CONNECTOR_KAFKA_MODE=true -e LCMS_CONNECTOR_DEBUG_MODE=true -e LCMS_CONNECTOR_SERVER_PORT=5000 -e LCMS_CONNECTOR_EXCERCISE='DRIVER+ Dry Run Training' -e LCMS_CONNECTOR_PASSWORD='PW' -v C:\dev\projects\DRIVER\LCMS-adapter\certs:/app/certs lcms-connector

FROM node:11-alpine AS builder
ENV CHROME_BIN="/usr/bin/chromium-browser" PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN apk add --no-cache --virtual .gyp python make g++ udev ttf-freefont chromium
RUN mkdir -p /code/gui
COPY package.json /code/package.json
COPY gui/package.json /code/gui/package.json
WORKDIR /code
RUN npm i
WORKDIR /code/gui
RUN npm i
COPY . /code/
WORKDIR /code
RUN npm run build:server
WORKDIR /code/gui
RUN npm run build
RUN ls /code/gui/dist/

FROM node:11-alpine
ENV CHROME_BIN="/usr/bin/chromium-browser" PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN apk add --no-cache udev ttf-freefont chromium
RUN mkdir -p /app/bin
RUN mkdir -p /app/gui/dist
COPY --from=builder /code/dist /app/bin
COPY --from=builder /code/config.json /app/config.json
COPY --from=builder /code/gui/index.html /app/gui/index.html
COPY --from=builder /code/gui/dist /app/gui/dist
COPY --from=builder /code/node_modules /app/node_modules
WORKDIR /app
EXPOSE 5000
CMD ["node", "./bin/run.js"]