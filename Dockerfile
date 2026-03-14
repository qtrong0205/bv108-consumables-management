FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_GEMINI_API_KEY
ARG VITE_GEMINI_MODEL=gemini-2.5-flash-lite
ARG VITE_GEMINI_WEB_SEARCH=true

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
ENV VITE_GEMINI_MODEL=${VITE_GEMINI_MODEL}
ENV VITE_GEMINI_WEB_SEARCH=${VITE_GEMINI_WEB_SEARCH}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
