FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json App.ts ./
COPY src ./src
RUN DATABASE_URL="mysql://placeholder:placeholder@127.0.0.1:3306/indeportes_schedules" npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./src/generated
EXPOSE 10115
CMD ["npm", "start"]
