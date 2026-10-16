#build stage
FROM node:26.11.1 AS build
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

#serve stage - static files only, no dev server/webpack in the final image
FROM node:26.11.1-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
# Cloud Run injects $PORT; -s rewrites unknown paths to index.html for react-router
CMD ["sh", "-c", "serve -s build -l ${PORT:-8080}"]