FROM node:23-alpine

WORKDIR /Swarch2A_API_Gateway

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "start"]