(() => {
  const track = document.querySelector('.process-track');
  const section = track.closest('.process');
  const svg = track.querySelector('.scroll-zigzag');
  const path = svg.querySelector('path');
  const bee = track.querySelector('.scroll-bee');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const length = path.getTotalLength();
  const glow = document.createElement('canvas');
  glow.className = 'process-side-glow';
  glow.setAttribute('aria-hidden', 'true');
  section.prepend(glow);
  const context = glow.getContext('2d');

  function drawSideGlow(trackBounds) {
    if (!context || !glow.offsetWidth) return;
    const bounds = glow.getBoundingClientRect();
    const density = Math.min(devicePixelRatio, 2);
    const width = Math.round(bounds.width * density);
    const height = Math.round(bounds.height * density);
    if (glow.width !== width) glow.width = width;
    if (glow.height !== height) glow.height = height;
    context.setTransform(density, 0, 0, density, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);

    const visibleHeight = Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0);
    const fade = Math.max(0, Math.min(1, visibleHeight / (innerHeight * .45)));
    if (!fade) return;

    // Match the blue honeycomb tiles in professional.css.
    const halfWidth = 32;
    const tileHeight = 110.85;
    const rowSpacing = tileHeight / 2;
    const radius = tileHeight / 3;
    const bodyBounds = document.body.getBoundingClientRect();
    const left = bounds.left - bodyBounds.left;
    const top = bounds.top - bodyBounds.top;
    const firstRow = Math.floor((top + Math.max(0, -bounds.top) - radius) / rowSpacing);
    const lastRow = Math.ceil((top + Math.min(bounds.height, innerHeight - bounds.top) + radius) / rowSpacing);
    const waveY = innerHeight * .48 - bounds.top;

    for (let row = firstRow; row <= lastRow; row++) {
      const y = row * rowSpacing + radius - top;
      if (y < radius || y > bounds.height - radius) continue;

      const stagger = row % 2 === 0 ? halfWidth : 0;
      const firstColumn = stagger - (left % 64);
      const tileWidth = halfWidth * 2;
      for (let x = firstColumn; x <= bounds.width - halfWidth; x += tileWidth) {
        if (x < halfWidth) continue;

        const distanceLeft = trackBounds.left - (bounds.left + x);
        const distanceRight = bounds.left + x - trackBounds.right;
        const distance = Math.max(distanceLeft, distanceRight);
        if (distance < halfWidth + 6) continue;

        const waveOffset = (distanceRight > 0 ? 90 : -45) + distance * .45;
        const strength = fade * Math.max(0, 1 - Math.abs(y - waveY - waveOffset) / 200) ** 2;
        if (strength < .025) continue;

        context.beginPath();
        context.moveTo(x, y - radius + 2);
        context.lineTo(x + 30, y - radius / 2 + 1);
        context.lineTo(x + 30, y + radius / 2 - 1);
        context.lineTo(x, y + radius - 2);
        context.lineTo(x - 30, y + radius / 2 - 1);
        context.lineTo(x - 30, y - radius / 2 + 1);
        context.closePath();
        context.fillStyle = `rgba(92, 146, 248, ${strength * .25})`;
        context.strokeStyle = `rgba(62, 118, 227, ${strength * .38})`;
        context.fill();
        context.stroke();
      }
    }
  }

  let pending = false;
  function update() {
    pending = false;
    const bounds = track.getBoundingClientRect();
    drawSideGlow(bounds);
    if (!svg.getClientRects().length) return;
    const progress = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, (innerHeight * .55 - bounds.top) / bounds.height));
    const point = path.getPointAtLength(progress * length);
    const svgBounds = svg.getBoundingClientRect();
    const x = svgBounds.left - bounds.left + point.x / 211 * svgBounds.width + 12;
    const y = svgBounds.top - bounds.top + point.y / 1244 * svgBounds.height - bee.clientHeight / 2;
    bee.style.transform = `translate(${x}px, ${y}px)`;
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.addEventListener('languagechange', schedule);
  document.addEventListener('moodchange', schedule);
  reducedMotion.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(track);
  track.querySelectorAll('details').forEach(details => details.addEventListener('toggle', schedule));
  document.fonts.ready.then(schedule);
  schedule();
})();
