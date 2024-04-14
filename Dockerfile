FROM node

WORKDIR /app

COPY package*.json

COPY . .

EXPOSE 8000

CMD ["npm", "start"]