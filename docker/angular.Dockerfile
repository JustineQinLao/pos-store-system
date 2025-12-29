FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4584

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4584"]
