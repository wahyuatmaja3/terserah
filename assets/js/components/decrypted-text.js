/**
 * DecryptedText : React Bits component adapted for Vanilla JS
 * https://reactbits.dev/text-animations/decrypted-text
 * Scrambles and sequentially decrypts text characters on demand.
 */

const CHAR_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*?';

export function animateDecryptedText(element, targetText, options = {}) {
  if (!element) return;
  const {
    speed = 28,
    maxIterations = 14,
    revealDelay = 25,
  } = options;

  let currentText = element.textContent || '';
  const textLen = targetText.length;
  let revealedIndices = new Set();
  let iterations = 0;
  let interval = null;

  clearInterval(element._decryptInterval);

  interval = setInterval(() => {
    iterations++;

    // Reveal one character at a time based on time
    const revealCount = Math.floor(iterations / (revealDelay / speed));
    for (let i = 0; i < revealCount && i < textLen; i++) {
      revealedIndices.add(i);
    }

    const scrambled = targetText
      .split('')
      .map((char, index) => {
        if (char === ' ' || char === '\n') return char;
        if (revealedIndices.has(index)) {
          return targetText[index];
        }
        return CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
      })
      .join('');

    element.textContent = scrambled;

    if (revealedIndices.size >= textLen || iterations > maxIterations * 3) {
      clearInterval(interval);
      element.textContent = targetText;
      element._decryptInterval = null;
    }
  }, speed);

  element._decryptInterval = interval;
}
