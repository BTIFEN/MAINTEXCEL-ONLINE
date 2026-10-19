# MAINTeX — image pour Google Cloud Run.
# Construction de l'interface, puis
# image d'exécution Node minimale sans les fichiers sources de l'interface.

# bun.lock est périmé : google-auth-library y manque. Depuis bun 1.4, une
# installation refuse un verrou qui ne correspond pas au package.json, et la
# construction s'arrête. Plutôt que de dépendre d'un drapeau dont le nom change
# d'une version de bun à l'autre, on ne copie PAS le verrou dans l'image :
# sans verrou, il n'y a rien à geler, et bun résout depuis package.json.
#
# Contrepartie assumée : la construction n'est plus reproductible au paquet
# près. Elle ne l'était déjà plus, puisque le verrou était ignoré. À rétablir
# — copie du verrou ET gel — le jour où bun.lock sera régénéré.
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json ./
RUN bun install --production

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
