const contentfulManagement = require('contentful-management');

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;
const LOCALE = 'en-US';

const isConfigured = Boolean(SPACE_ID && CMA_TOKEN);

// Server-only - this token can create/edit/delete content, so it must never
// reach the frontend bundle (see CONTENTFUL_CMA_TOKEN comment in the
// frontend's .env and scripts/setup-contentful.js).
const client = isConfigured
  ? contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' })
  : null;

const envParams = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID };

module.exports = { client, envParams, isConfigured, LOCALE };
