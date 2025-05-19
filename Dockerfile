FROM node:lts-bookworm AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY / ./
EXPOSE 3333
CMD ["npm", "start"]