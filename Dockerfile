FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install

COPY . .
RUN sed -i 's/\r$//' ./run
RUN npm run build

RUN chmod +x ./run

ENTRYPOINT ["./run"]