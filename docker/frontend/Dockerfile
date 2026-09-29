# Build Stage
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_STORAGE_BASE_URL=/storage
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STORAGE_BASE_URL=$VITE_STORAGE_BASE_URL
RUN printf "VITE_API_BASE_URL=%s\nVITE_STORAGE_BASE_URL=%s\n" "$VITE_API_BASE_URL" "$VITE_STORAGE_BASE_URL" > .env.docker
RUN npm run build-only -- --mode docker

# Production Stage
FROM nginx:alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
