# Stage 1: build the React app into static files
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .

ENV VITE_API_URL=https://expert-decision-replay-platform-backend.onrender.com

# Stage 2: serve those static files with a lightweight web server
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80