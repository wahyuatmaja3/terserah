/**
 * Magnet : React Bits component adapted for Vanilla JS
 * https://reactbits.dev/components/magnet
 * Pulls elements smoothly towards the cursor within a magnetic proximity range.
 */

export function initMagnet(selector = '.magnet-btn', strength = 0.25) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((el) => {
    let bounds = null;

    function onMouseEnter() {
      bounds = el.getBoundingClientRect();
    }

    function onMouseMove(e) {
      if (!bounds) bounds = el.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    }

    function onMouseLeave() {
      el.style.transform = 'translate3d(0px, 0px, 0)';
      bounds = null;
    }

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
  });
}
