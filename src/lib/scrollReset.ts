// Fired when the user asks to jump back to the top of the page (the
// back-to-top FAB, or clicking "Home" while already on the landing page)
// — Main.tsx listens for this to remount its sections, resetting each
// one's scroll-reveal animation so it plays again on the way back down.
export const SCROLL_RESET_EVENT = 'cbcp:scroll-reset';

export function scrollToTopAndReset() {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Remounting (to reset each section's `whileInView` tracking) has to
  // wait until the scroll has actually finished — if a section remounts
  // while it's still visually in view (the smooth scroll hasn't moved the
  // page yet), its brand new viewport observer sees it as already visible
  // and re-triggers immediately, instead of waiting for the next real
  // scroll down.
  let settled = false;
  const dispatchOnce = () => {
    if (settled) return;
    settled = true;
    window.removeEventListener('scroll', handleScroll);
    window.dispatchEvent(new Event(SCROLL_RESET_EVENT));
  };
  const handleScroll = () => {
    if (window.scrollY <= 1) dispatchOnce();
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  // Fallback in case scroll never fires a near-zero reading (e.g.
  // prefers-reduced-motion skipping the smooth animation entirely).
  setTimeout(dispatchOnce, 1000);
}
