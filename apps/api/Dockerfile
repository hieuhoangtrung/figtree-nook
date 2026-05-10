FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Generate Prisma client
RUN npx prisma generate --schema=../../packages/db/prisma/schema.prisma 2>/dev/null || true
EXPOSE 4000
CMD ["node", "src/index.js"]
