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
# CRA bakes REACT_APP_* vars into the JS bundle at build time, so they have to
# arrive as build args here rather than as Cloud Run container env vars (those
# only affect the already-built static files' runtime process, too late to
# matter). Passed in via --build-arg from the Cloud Build trigger config, not
# committed to .env, since this repo is public.
ARG REACT_APP_CONTENTFUL_SPACE_ID
ARG REACT_APP_CONTENTFUL_ENVIRONMENT
ARG REACT_APP_CONTENTFUL_DELIVERY_TOKEN
ARG REACT_APP_EMAILJS_SERVICE_ID
ARG REACT_APP_EMAILJS_TEMPLATE_ID
ARG REACT_APP_EMAILJS_PUBLIC_KEY
ENV REACT_APP_CONTENTFUL_SPACE_ID=$REACT_APP_CONTENTFUL_SPACE_ID
ENV REACT_APP_CONTENTFUL_ENVIRONMENT=$REACT_APP_CONTENTFUL_ENVIRONMENT
ENV REACT_APP_CONTENTFUL_DELIVERY_TOKEN=$REACT_APP_CONTENTFUL_DELIVERY_TOKEN
ENV REACT_APP_EMAILJS_SERVICE_ID=$REACT_APP_EMAILJS_SERVICE_ID
ENV REACT_APP_EMAILJS_TEMPLATE_ID=$REACT_APP_EMAILJS_TEMPLATE_ID
ENV REACT_APP_EMAILJS_PUBLIC_KEY=$REACT_APP_EMAILJS_PUBLIC_KEY
RUN npm run build

#serve stage - static files only, no dev server/webpack in the final image
FROM node:26.11.1-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
# Cloud Run injects $PORT; -s rewrites unknown paths to index.html for react-router
CMD ["sh", "-c", "serve -s build -l ${PORT:-8080}"]