FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY admin-service/src ./admin-service/src

COPY ../shared ./shared

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "admin-service/src/index.js"]