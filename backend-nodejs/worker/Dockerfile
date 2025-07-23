FROM node:20-alpine

WORKDIR /worker

COPY package*.json ./
RUN npm install

COPY . .

CMD ["tail", "-f", "/dev/null"]