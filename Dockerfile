# MAINTeX — image pour Google Cloud Run.
# Construction de l'interface, puis
# image d'exécution Node minimale sans les fichiers sources de l'interface.

# bun.lock est périmé (google-auth-library y manque). Depuis bun 1.4,
# « --production » implique un verrou figé : la construction échoue alors sur
# l'écart que la première étape vient elle-même d'écrire. On désactive donc le
# gel explicitement, des deux côtés.
# À remettre en verrou figé le jour où bun.lock sera régénéré.
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --no-frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production --no-frozen-lockfile

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js ./
COPY server ./server
COPY shared ./shared
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "server.js"]
