import { createContext, useContext, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';

import { LD_CLIENT_ID, isLaunchDarklyConfigured, FLAG_DEFAULTS } from './launchdarkly';

type LDProviderComponent = ComponentType<{ children: ReactNode }>;

// False until LaunchDarkly has its real flag values (or failed / isn't
// configured, in which case the defaults are final). Until then useFlags()
// returns {}, so anything that *acts* on a flag - like redirecting away
// from a hidden route - should wait for this instead of acting on the
// default. See useFlagsReady.
const FlagsReadyContext = createContext(!isLaunchDarklyConfigured);

export const useFlagsReady = () => useContext(FlagsReadyContext);

export default function LaunchDarklyProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<LDProviderComponent | null>(null);
  const [ready, setReady] = useState(!isLaunchDarklyConfigured);

  useEffect(() => {
    if (!isLaunchDarklyConfigured) return;

    let cancelled = false;
    asyncWithLDProvider({
      clientSideID: LD_CLIENT_ID as string,
      flags: FLAG_DEFAULTS,
    })
      .then((P) => {
        if (!cancelled) setProvider(() => P as LDProviderComponent);
      })
      .catch((err) => {
        // Unreachable/blocked - carry on with the defaults rather than
        // leaving flag-gated pages waiting forever.
        // eslint-disable-next-line no-console
        console.warn('[launchdarkly] init failed, using flag defaults:', err);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Not configured, or still initializing - render children directly.
  // useFlags() returns {} with no provider above it, so consumers' own
  // fallback defaults (e.g. `hideReviews = true`) apply, same safe-hidden
  // behavior as once LaunchDarkly is live.
  const content = Provider ? <Provider>{children}</Provider> : <>{children}</>;

  return <FlagsReadyContext.Provider value={ready}>{content}</FlagsReadyContext.Provider>;
}
