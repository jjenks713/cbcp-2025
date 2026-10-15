#base image
FROM node:26.11.1
#working directory
WORKDIR /app
#add binaries to $PATH
ENV PATH /app/node_modules/.bin:$PATH
#install and cache app dependencies
COPY package.json /app/
COPY package-lock.json /app/
RUN npm install
#copy app files and build
COPY . /app
RUN npm run build
# start app
CMD [ "npm", "start" ]