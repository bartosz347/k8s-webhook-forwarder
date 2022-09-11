ARG IMAGE=node:16.17.0-alpine

FROM $IMAGE as build

WORKDIR /app

COPY package*.json .
RUN npm ci

COPY src ./src
COPY tsconfig.json .

RUN npm run build


FROM $IMAGE as run

WORKDIR /app

COPY package*.json .
RUN npm ci --omit=dev

COPY --from=build /app/dist .

USER node
EXPOSE 8000

CMD ["node", "app.js"]
