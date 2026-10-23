/**
 * SpotlightCard : React Bits component adapted for Vanilla JS
 * https://reactbits.dev/components/spotlight-card
 * Adds mouse-tracking radial spotlight illumination across borders and surfaces.
 */

export function initSpotlightCards(selector = '.spotlight-card') {
  function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }

  function attachCard(card) {
    if (card._spotlightAttached) return;
    card._spotlightAttached = true;
    card.addEventListener('mousemove', handleMouseMove);
  }

  document.querySelectorAll(selector).forEach(attachCard);

  // Observer for dynamically added cards (like result card or drawers)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        document.querySelectorAll(selector).forEach(attachCard);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
