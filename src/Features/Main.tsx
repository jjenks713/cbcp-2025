import { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useShopEnabled } from '../hooks/use-shop-link';
import ContentColumn from '../components/ContentColumn';

import BackToTop from '../components/back-to-top';
import { SCROLL_RESET_EVENT } from '../lib/scrollReset';
import CBCPHero from './sections/CBCPHero';
import CBCPLatestArt from './sections/CBCPLatestArt';
import CBCPSocialBrands from './sections/CBCPSocialBrands';
import CBCPAbout from './sections/CBCPAbout';
import CBCPShop from './sections/CBCPShop';
import CBCPArtStyles from './sections/CBCPArtStyles';
import CBCPArtwork from './sections/CBCPArtwork';
import CBCPArtist from './sections/CBCPArtist';
import CBCPFaqs from './sections/CBCPFaqs';
import CBCPTestimonials from './sections/CBCPTestimonials';
import CBCPContact from './sections/CBCPContact';

export default function Main() {
  // Bumped on back-to-top / "Home while already home" — remounting the
  // section tree resets each section's MotionViewport (via `once: true`
  // scroll-reveal) so the animations are fresh again on the way back down.
  const [resetKey, setResetKey] = useState(0);
  // Flag keys are camelCased by the SDK by default (hide-reviews -> hideReviews).
  // Defaults to hidden (true) until LaunchDarkly is configured/loaded or
  // the feature is actually ready - see src/lib/launchdarkly.ts. The shop
  // flag goes through useShopEnabled, shared with every shop link.
  const { hideReviews = true } = useFlags();
  const shopEnabled = useShopEnabled();

  useEffect(() => {
    const handleReset = () => setResetKey((k) => k + 1);
    window.addEventListener(SCROLL_RESET_EVENT, handleReset);
    return () => window.removeEventListener(SCROLL_RESET_EVENT, handleReset);
  }, []);

  return (
    <>
      <CBCPHero />

      <div key={resetKey}>
        {/* Content sections sit in the readable column; the banners
            between them (artist, testimonials, contact) span the full
            width over the background pattern. */}
        <ContentColumn>
          <CBCPLatestArt />
          <CBCPSocialBrands />
          <CBCPAbout />
          {shopEnabled && <CBCPShop />}
          <CBCPArtStyles />
          <CBCPArtwork />
        </ContentColumn>
        <CBCPArtist />
        <ContentColumn>
          <CBCPFaqs />
        </ContentColumn>
        {!hideReviews && <CBCPTestimonials />}
        <CBCPContact />
      </div>

      <BackToTop />
    </>
  );
}
