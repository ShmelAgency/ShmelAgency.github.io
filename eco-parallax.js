(() => {
  const host = document.querySelector('.main') || document.body;
  const layer = document.createElement('div');
  layer.className = 'eco-ribbons';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="eco-ribbon eco-ribbon-first"></div><div class="eco-ribbon eco-ribbon-second"></div>';
  host.prepend(layer);
  const ribbons = [...layer.children];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  function update() {
    pending = false;
    if (host.dataset.skin !== 'environmental') return;
    const motion = !reducedMotion.matches;
    const scale = innerWidth < 769 ? .75 : 1;
    host.style.setProperty('--eco-sky-shift', `${motion ? Math.min(360, scrollY * .35) * scale : 0}px`);
    ribbons.forEach((ribbon, index) => {
      const offset = ribbon.offsetTop;
 
      const speed = index ? -.24 : .42;
      const distance = Math.max(-420, Math.min(520, (scrollY - offset + innerHeight * .5) * speed));
      ribbon.style.transform = `translate3d(0,${motion ? distance * scale : 0}px,0)`;
    });
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  document.addEventListener('languagechange', schedule);
  new MutationObserver(schedule).observe(host, { attributes: true, attributeFilter: ['data-skin'] });
  schedule();
})();
