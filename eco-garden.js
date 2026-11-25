(() => {
  const host = document.querySelector('.main') || document.body;
  const footer = document.querySelector('.hive-footer');
  if (!footer || !document.querySelector('.talk-panel')) return;
  const hill = document.createElement('div');
  hill.className = 'eco-flower-hill';
  hill.setAttribute('aria-hidden', 'true');
  hill.innerHTML = '<img src="Assets/images/aero-flower-hill.svg" alt="" width="300" height="230">';
  footer.prepend(hill);
  const bee = document.createElement('div');
  bee.className = 'eco-traveler';
  bee.setAttribute('aria-hidden', 'true');
  bee.innerHTML = '<img src="Assets/images/shmel-floating-bee.svg" alt="" width="142" height="140">';
  host.append(bee);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  function update() {
    pending = false;
    if (host.dataset.skin !== 'environmental') return;
    const bounds = hill.getBoundingClientRect();
    const flowerX = bounds.left + bounds.width * .64;
    const flowerY = bounds.top + bounds.height * .348;
    const landingScroll = Math.max(1, flowerY + scrollY - innerHeight * .72);
    const progress = clamp(scrollY / landingScroll);
    const approach = clamp((progress - .76) / .24);
    const ease = approach * approach * (3 - 2 * approach);
    const flightX = innerWidth * .9 + Math.sin(progress * Math.PI * 5) * Math.min(42, innerWidth * .045);
    const flightY = innerHeight * .36 + Math.sin(progress * Math.PI * 7) * 55;
    const landed = reducedMotion.matches || progress >= .995;
    const x = landed ? flowerX : flightX + (flowerX - flightX) * ease;
    const y = landed ? flowerY - 13 : flightY + (flowerY - 13 - flightY) * ease;
    const angle = landed ? -12 : Math.cos(progress * Math.PI * 5) * 14 * (1 - ease);
    bee.style.transform = `translate3d(${x - bee.offsetWidth * .5}px,${y - bee.offsetHeight * .5}px,0) rotate(${angle}deg)`;
    bee.classList.toggle('is-landed', landed);
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  document.addEventListener('languagechange', schedule);
  new ResizeObserver(schedule).observe(document.body);
  new MutationObserver(schedule).observe(host, { attributes: true, attributeFilter: ['data-skin'] });
  document.fonts.ready.then(schedule);
  schedule();
})();
