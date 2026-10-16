# API server image for Cloud Run. Built with server/ as the build context
# (see server/cloudbuild.yaml). No secrets are baked in: MONGODB_URI,
# JWT_SECRET and CONTENTFUL_CMA_TOKEN arrive at runtime as Cloud Run env
# vars sourced from Secret Manager.
FROM node:24.14.1-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

# Cloud Run injects $PORT (8080 by default); src/index.js listens on it.
USER node
CMD ["node", "src/index.js"]
