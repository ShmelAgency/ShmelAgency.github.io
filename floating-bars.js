(() => {
  const root = document.documentElement;
  const navigation = document.querySelector('.shared-top-row');
  const moods = document.querySelector('.shared-moods');
  if (!navigation || !moods) return;
  const header = navigation.closest('.shared-header');
  const links = [...navigation.querySelectorAll('.shared-nav a')];
  links.forEach(link => {
    const href = link.getAttribute('href');
    const role = href.includes('#contact') ? 'contact' : href.includes('#services') ? 'services'
      : href.includes('about.html') ? 'about' : href.includes('faq.html') ? 'faq' : 'hive';
    const labels = { hive: 'Hive', contact: 'Contact', services: 'Services', about: 'About us!', faq: 'FAQ' };
    link.dataset.navRole = role;
    const cube = document.createElement('span');
    cube.className = 'nav-cube';
    const face = document.createElement('span');
    face.className = 'nav-cube-front';
    face.textContent = labels[role];
    const upper = document.createElement('span');
    upper.className = 'nav-cube-top';
    upper.setAttribute('aria-hidden', 'true');
    upper.textContent = labels[role];
    cube.append(face, upper);
    link.replaceChildren(cube);
  });
  const disclosure = document.createElement('div');
  disclosure.className = 'mood-disclosure';
  moods.before(disclosure);
  disclosure.append(moods);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let disclosureAnimation = null;
  moods.id = 'mood-selector-content';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mood-collapse-toggle';
  toggle.setAttribute('aria-controls', moods.id);
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'What mood are you in?');
  toggle.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg>';
  header.append(toggle);
  let scrolled = false;
  let manuallyOpen = false;
  let manuallyClosed = false;
  let compact = false;
  let barAnimation = null;
  let fullNavigationHeight = navigation.getBoundingClientRect().height;
  let expandedHeight = moods.getBoundingClientRect().height;
  function updateDisclosure() {
    header.classList.toggle('is-scrolled', scrolled);
    const open = !compact && (scrolled ? manuallyOpen : !manuallyClosed);
    if (!open && moods.contains(document.activeElement)) toggle.focus({ preventScroll: true });
    const height = disclosure.getBoundingClientRect().height;
    const opacity = moods.hidden ? '0' : getComputedStyle(disclosure).opacity;
    disclosureAnimation?.cancel();
    disclosureAnimation = null;
    moods.inert = !open;
    moods.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close mood selector' : 'Open mood selector');
    if (reducedMotion.matches) {
      moods.hidden = !open;
      schedule();
      return;
    }
    moods.hidden = false;
    const fullHeight = disclosure.getBoundingClientRect().height;
    const animation = disclosure.animate([
      { height: `${height}px`, opacity, transform: `translateY(${height ? 0 : -10}px)` },
      { height: `${open ? fullHeight : 0}px`, opacity: open ? 1 : 0, transform: `translateY(${open ? 0 : -10}px)` }
    ], { duration: open ? 300 : 240, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'both' });
    disclosureAnimation = animation;
    animation.finished.then(() => {
      if (disclosureAnimation !== animation) return;
      moods.hidden = !open;
      animation.cancel();
      disclosureAnimation = null;
      schedule();
    }, () => {   });
    schedule();
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    manuallyOpen = !open;
    manuallyClosed = open;
    updateDisclosure();
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || moods.hidden) return;
    manuallyOpen = false;
    manuallyClosed = true;
    updateDisclosure();
    toggle.focus({ preventScroll: true });
  });
  function onScroll() {
    const next = scrollY > 80;
    const remaining = document.documentElement.scrollHeight - innerHeight - scrollY;
    const threshold = Math.min(560, innerHeight * .65);
    const nextCompact = scrollY > 160 && remaining < threshold + (compact ? 100 : 0);
    if (next === scrolled && nextCompact === compact) return;
    if (nextCompact !== compact) {
      const width = navigation.getBoundingClientRect().width;
      barAnimation?.cancel();
      compact = nextCompact;
      if (compact && (moods.contains(document.activeElement) ||
        document.activeElement === toggle ||
        navigation.querySelector('.language-bar')?.contains(document.activeElement) ||
        links.some(link => link.contains(document.activeElement) && !['hive', 'contact'].includes(link.dataset.navRole)))) {
        links.find(link => link.dataset.navRole === 'contact').focus({ preventScroll: true });
      }
      header.classList.toggle('is-footer-compact', compact);
      const targetWidth = navigation.getBoundingClientRect().width;
      if (!reducedMotion.matches) {
        barAnimation = navigation.animate([{ width: `${width}px` }, { width: `${targetWidth}px` }], {
          duration: 380, easing: 'cubic-bezier(.22,.7,.2,1)'
        });
      }
    }
    scrolled = next;
    manuallyOpen = false;
    updateDisclosure();
  }
  addEventListener('scroll', onScroll, { passive: true });
  function measure() {
    const navigationHeight = navigation.getBoundingClientRect().height;
    if (!compact) fullNavigationHeight = navigationHeight;
    const moodHeight = disclosure.getBoundingClientRect().height;
    if (!moods.hidden) expandedHeight = moods.getBoundingClientRect().height;
    root.style.setProperty('--navigation-bar-height', `${navigationHeight}px`);
    root.style.setProperty('--mood-bar-height', `${moodHeight}px`);
 
    root.style.setProperty('--floating-bars-height', `${16 + fullNavigationHeight + expandedHeight}px`);
    root.style.setProperty('--visible-bars-height', `${16 + navigationHeight + moodHeight + toggle.getBoundingClientRect().height}px`);
  }
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; measure(); });
  }
  const observer = new ResizeObserver(schedule);
  [navigation, moods, disclosure, toggle].forEach(element => observer.observe(element));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) updateDisclosure();
  });
  document.addEventListener('languagechange', schedule);
  document.fonts.ready.then(schedule);
  measure();
  updateDisclosure();
  onScroll();
})();
