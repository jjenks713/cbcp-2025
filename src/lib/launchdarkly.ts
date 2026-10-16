// LaunchDarkly client-side ID is not a secret (it's meant to ship in the
// client bundle, same as the EmailJS public key) but isn't set up yet, so
// everything here degrades gracefully when it's blank - same pattern as
// contentful.ts / CBCPContact.tsx's isConfigured checks.
const LD_CLIENT_ID = process.env.REACT_APP_LAUNCHDARKLY_CLIENT_ID;
export const isLaunchDarklyConfigured = Boolean(LD_CLIENT_ID);

export { LD_CLIENT_ID };

// Flags default to hidden (true) until the underlying feature is actually
// ready - used both as LaunchDarkly's bootstrap values (shown before the
// real evaluation loads, or if LD is unreachable) and as the fallback when
// LaunchDarkly isn't configured at all.
export const FLAG_DEFAULTS = {
  'hide-reviews': true,
  'hide-cbcp-shop': true,
} as const;
