FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json App.ts prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="mysql://local:local@localhost:3306/indeportes_contractors" npm run db:generate
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma.config.ts ./prisma.config.ts
COPY prisma ./prisma
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/dist ./dist
EXPOSE 10114
CMD ["npm", "start"]
