FROM node:20-alpine

WORKDIR /backend-nodejs

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["tail", "-f", "/dev/null"]