FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=10000
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/web/dist ./web/dist
COPY --from=build /app/openapi ./openapi
EXPOSE 10000
CMD ["npm", "start"]
