FROM node:20-bullseye-slim

WORKDIR /usr/src/app/backend-nodejs

COPY package*.json ./
RUN npm install

COPY src/ ./src/

EXPOSE 3000

CMD ["tail", "-f", "/dev/null"]