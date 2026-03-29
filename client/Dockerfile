# Build stage — set API URL at build time (Render: pass ARGs in dashboard)
FROM node:20 AS build

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install -g npm@10.2.4 && npm install
COPY . .

ARG REACT_APP_API_BASE_URL
ARG REACT_APP_API_BASE_IMG_URL
ARG REACT_APP_SECRET_KEY
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_IMG_URL=$REACT_APP_API_BASE_IMG_URL
ENV REACT_APP_SECRET_KEY=$REACT_APP_SECRET_KEY

RUN npm run build

# Runtime — Nginx listens on $PORT (Render injects PORT; default 3000 locally)
FROM nginx:stable-alpine

RUN apk add --no-cache gettext

COPY docker/nginx.default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /usr/src/app/build /usr/share/nginx/html

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
