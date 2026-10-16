import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';

import { LD_CLIENT_ID, isLaunchDarklyConfigured, FLAG_DEFAULTS } from './launchdarkly';

type LDProviderComponent = ComponentType<{ children: ReactNode }>;

export default function LaunchDarklyProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<LDProviderComponent | null>(null);

  useEffect(() => {
    if (!isLaunchDarklyConfigured) return;

    let cancelled = false;
    asyncWithLDProvider({
      clientSideID: LD_CLIENT_ID as string,
      flags: FLAG_DEFAULTS,
    }).then((P) => {
      if (!cancelled) setProvider(() => P as LDProviderComponent);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Not configured, or still initializing - render children directly.
  // useFlags() returns {} with no provider above it, so consumers' own
  // fallback defaults (e.g. `hideReviews = true`) apply, same safe-hidden
  // behavior as once LaunchDarkly is live.
  if (!Provider) return <>{children}</>;

  return <Provider>{children}</Provider>;
}
