FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY user-service/src ./user-service/src

COPY ../shared ./shared

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "user-service/src/index.js"]