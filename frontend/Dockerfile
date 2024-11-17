FROM node:20.18.0-alpine3.19 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:stable-alpine3.20-perl AS deployment
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist .
ENTRYPOINT ["nginx", "-g", "daemon off;"]
