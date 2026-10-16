import { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

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
  // Flag keys are camelCased by the SDK by default (hide-cbcp-shop -> hideCbcpShop).
  // Both default to hidden (true) until LaunchDarkly is configured/loaded
  // or the underlying features are actually ready - see src/lib/launchdarkly.ts
  const { hideCbcpShop = true, hideReviews = true } = useFlags();

  useEffect(() => {
    const handleReset = () => setResetKey((k) => k + 1);
    window.addEventListener(SCROLL_RESET_EVENT, handleReset);
    return () => window.removeEventListener(SCROLL_RESET_EVENT, handleReset);
  }, []);

  return (
    <>
      <CBCPHero />

      <div key={resetKey}>
        <CBCPLatestArt />
        <CBCPSocialBrands />
        <CBCPAbout />
        {!hideCbcpShop && <CBCPShop />}
        <CBCPArtStyles />
        <CBCPArtwork />
        <CBCPArtist />
        <CBCPFaqs />
        {!hideReviews && <CBCPTestimonials />}
        <CBCPContact />
      </div>

      <BackToTop />
    </>
  );
}
