/**
 * ClickSpark : React Bits component adapted for high-performance Vanilla JS
 * https://reactbits.dev/animations/click-spark
 * Creates an energetic burst of glowing particle sparks wherever the user clicks.
 */

export function initClickSpark(options = {}) {
  const {
    sparkColor = '#f97316',
    sparkSize = 10,
    sparkCount = 8,
    duration = 450,
    extraScale = 1.0,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.id = 'click-spark-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let sparks = [];
  let animId = null;

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  class Spark {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = (Math.random() * 3 + 2) * extraScale;
      this.size = (Math.random() * sparkSize + 4) * extraScale;
      this.color = sparkColor;
      this.createdAt = performance.now();
      this.lifespan = duration;
    }

    draw(now) {
      const elapsed = now - this.createdAt;
      const progress = elapsed / this.lifespan;
      if (progress >= 1) return false;

      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentDist = this.speed * elapsed * 0.15;
      const curX = this.x + Math.cos(this.angle) * currentDist;
      const curY = this.y + Math.sin(this.angle) * currentDist + (progress * progress * 15);
      const curSize = this.size * (1 - easeProgress);
      const alpha = 1 - progress;

      ctx.save();
      ctx.beginPath();
      ctx.arc(curX, curY, Math.max(0.5, curSize), 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      return true;
    }
  }

  function loop(now) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    sparks = sparks.filter(s => s.draw(now));

    if (sparks.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      animId = null;
    }
  }

  window.addEventListener('pointerdown', (e) => {
    // Exclude dragging map
    if (e.target.closest('#map') && e.pointerType === 'touch') return;

    for (let i = 0; i < sparkCount; i++) {
      sparks.push(new Spark(e.clientX, e.clientY));
    }
    if (!animId) {
      animId = requestAnimationFrame(loop);
    }
  });
}
