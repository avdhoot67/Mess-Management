FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_READ_ONLY_DEMO=false
ENV VITE_READ_ONLY_DEMO=$VITE_READ_ONLY_DEMO
ARG VITE_LIVE_APP_URL=
ENV VITE_LIVE_APP_URL=$VITE_LIVE_APP_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime

ARG NGINX_CONFIG=nginx.conf
COPY ${NGINX_CONFIG} /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
