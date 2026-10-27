FROM node:22.23.4-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22.23.4-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["node_modules/.bin/vite", "preview", "--host", "--port", "4173"]
