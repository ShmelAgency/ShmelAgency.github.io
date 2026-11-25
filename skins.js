const main = document.querySelector('.main') || document.body;
const choices = [...document.querySelectorAll('.mood-choice')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const palettes = { shmel: '#10100d', professional: '#f7f8fc', environmental: '#effaf5', poland: '#fffaf7' };
// Decorative countryball sticker; visible only in Poland Mood.
const polandSticker = document.createElement('div');
polandSticker.className = 'poland-meme-sticker';
polandSticker.setAttribute('aria-hidden', 'true');
polandSticker.innerHTML = '<div class="polandball"><span></span><span></span></div><strong>POLSKA GUROM!</strong><small>pierogi-powered creativity</small>';
document.body.append(polandSticker);
let activeTransition = null;
let revealAnimation = null;
let revealLayer = null;
let skinRequest = 0;

function applySkin(skin) {
  if (!Object.hasOwn(palettes, skin)) skin = 'shmel';
  main.dataset.skin = skin;
  document.documentElement.dataset.skin = skin;
  document.documentElement.style.colorScheme = skin === 'shmel' ? 'dark' : 'light';
  document.body.style.backgroundColor = palettes[skin];
  try { sessionStorage.setItem('shmel-mood', skin); } catch {   }
  document.querySelectorAll('[data-copy-shmel]').forEach(element => {
    const copyKey = { shmel: 'copyShmel', professional: 'copyProfessional', environmental: 'copyEnvironmental', poland: 'copyPoland' }[skin];
    element.textContent = element.dataset[copyKey] || element.dataset.copyProfessional || element.dataset.copyShmel;
  });
  choices.forEach((choice) => {
    const selected = choice.dataset.skin === skin;
    choice.classList.toggle('is-selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  document.dispatchEvent(new CustomEvent('moodchange', { detail: { skin } }));
}

let savedSkin = 'shmel';
try { savedSkin = sessionStorage.getItem('shmel-mood') || 'shmel'; } catch {   }
if (savedSkin === 'environmental' || savedSkin === 'poland') savedSkin = 'shmel';
applySkin(savedSkin);

choices.forEach((button) => {
  button.addEventListener('click', async () => {
    const skin = button.dataset.skin;
    if (skin === (main.dataset.skin || 'shmel')) return;
    const request = ++skinRequest;
 
    if (activeTransition) {
      activeTransition.skipTransition();
      await activeTransition.finished.catch(() => {});
      if (request !== skinRequest) return;
      activeTransition = null;
    }
    revealAnimation?.cancel();
    revealLayer?.remove();
    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
 
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) / Math.cos(Math.PI / 6) + 2;
    const hexagon = (size) => `polygon(${Array.from({ length: 6 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 3;
      return `${x + Math.cos(angle) * size}px ${y + Math.sin(angle) * size}px`;
    }).join(', ')})`;
    const frames = [
      { clipPath: hexagon(0) },
      { clipPath: hexagon(radius) }
    ];
    const options = { duration: 700, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'both' };
    if (reducedMotion.matches) {
      applySkin(skin);
      return;
    }
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => applySkin(skin));
      activeTransition = transition;
      try {
        await transition.ready;
        if (request !== skinRequest) {
          transition.skipTransition();
          return;
        }
        revealAnimation = document.documentElement.animate(frames, {
          ...options, pseudoElement: '::view-transition-new(root)'
        });
        await transition.finished;
      } catch {
        transition.skipTransition();
        if (request === skinRequest) applySkin(skin);
      } finally {
        if (activeTransition === transition) activeTransition = null;
      }
    } else {
 
      const layer = document.createElement('div');
      layer.className = 'skin-reveal';
      layer.setAttribute('aria-hidden', 'true');
      layer.style.background = palettes[skin];
      layer.style.clipPath = hexagon(0);
      layer.style.setProperty('--reveal-x', `${x}px`);
      layer.style.setProperty('--reveal-y', `${y}px`);
      document.body.append(layer);
      revealLayer = layer;
      const animation = layer.animate(frames, options);
      revealAnimation = animation;
      try {
        await animation.finished;
        if (request !== skinRequest) return;
        applySkin(skin);
        await layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished;
      } catch {   }
      finally { layer.remove(); }
    }
  });
});

const menuDialog = document.querySelector('#menu-dialog');
document.querySelector('.menu-toggle')?.addEventListener('click', () => menuDialog.showModal());
document.querySelector('.menu-dialog-close')?.addEventListener('click', () => menuDialog.close());
menuDialog?.addEventListener('click', (event) => {
  const bounds = menuDialog.getBoundingClientRect();
  if (event.target === menuDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) menuDialog.close();
});
