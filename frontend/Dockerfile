# Build the React app, then serve it with nginx, which also load-balances the API.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty = same origin: the browser calls /api and /socket.io on nginx.
ENV VITE_BACKEND_URL=""
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
