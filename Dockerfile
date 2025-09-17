FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY client/ .

RUN npm ci --only=productio
RUN npm run build

FROM node:22-alpine AS backend-builder

WORKDIR /app

COPY server/ .

RUN npm ci --only=productio

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=frontend-builder /app/dist /app/dist
COPY --from=backend-builder /app /app/server

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "server/index.js"]
