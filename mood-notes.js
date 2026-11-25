(() => {
  const host = document.querySelector('.main') || document.body;
  const selector = document.querySelector('.shared-moods');
  if (!selector) return;
  const moods = {
    poland: { name: 'Poland Mood', description: 'POLSKA GUROM! White-and-red flag energy, Polandball chaos, and creativity fuelled by pierogi.' },
    shmel: { name: 'Bee Mood', description: "Warm, curious, and full of personality. A playful expression of Shmel's creative world." },
    professional: { name: 'Professional Mood', description: 'Clear, structured, and confident. Thoughtful typography and a blue-and-white palette put the work first.' },
    environmental: { name: 'Eco Mood', description: 'Soft skies, mint greens, and a little glassy nostalgia. A calm, nature-inspired visual world with room to breathe.' }
  };
  function notesContent(notes) {
    const content = document.createElement('div');
    content.className = 'mood-long-copy';
    for (const [key, title] of [['audience', 'Who is it for?'], ['thinking', 'The thinking'], ['decisions', 'The design decisions'], ['principle', 'The principle']]) {
      const section = document.createElement('section');
      const heading = document.createElement('strong');
      heading.textContent = title;
      const paragraph = document.createElement('p');
      paragraph.textContent = notes[key];
      section.append(heading, paragraph);
      content.append(section);
    }
    return content;
  }
  const panel = document.createElement('section');
  panel.className = 'mood-context';
  panel.setAttribute('aria-label', 'Design moods & strategic thinking');
  panel.innerHTML = '<div class="mood-context-intro" aria-live="polite" aria-atomic="true"><strong class="mood-context-name"></strong><p class="mood-context-description"></p></div><details class="mood-behind"><summary>Behind the design</summary><div class="mood-context-long"></div></details>';
  selector.append(panel);
  const name = panel.querySelector('.mood-context-name');
  const description = panel.querySelector('.mood-context-description');
  const expansion = panel.querySelector('details');
  function render() {
    const skin = host.dataset.skin;
    const mood = moods[skin];
    const notes = window.shmelMoodNotes[skin];
    if (!mood || !notes) return;
    name.textContent = mood.name;
    description.textContent = mood.description;
    expansion.open = false;
    panel.querySelector('.mood-context-long').replaceChildren(notesContent(notes));
    requestAnimationFrame(() => {
      const row = selector.querySelector('.mood-pills');
      const active = row.querySelector('[aria-pressed="true"]');
      if (!active) return;
      const bounds = active.getBoundingClientRect();
      const viewport = row.getBoundingClientRect();
      if (bounds.right > viewport.right) row.scrollLeft += bounds.right - viewport.right + 3;
      if (bounds.left < viewport.left) row.scrollLeft -= viewport.left - bounds.left + 3;
    });
  }
  document.addEventListener('moodchange', render);
  render();

  document.querySelectorAll('[data-mood-notes]').forEach(button => {
    const notes = window.shmelMoodNotes[button.dataset.moodNotes];
    if (!notes) return;
    const details = document.createElement('details');
    details.className = 'concept-notes';
    const summary = document.createElement('summary');
    summary.textContent = 'Explore the thinking';
    const tagline = document.createElement('p');
    tagline.textContent = notes.tagline;
    details.append(summary, tagline, notesContent(notes));
    button.replaceWith(details);
  });
  const pills = [...selector.querySelectorAll('.mood-choice')];
  selector.querySelector('.mood-pills').addEventListener('keydown', event => {
    const index = pills.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % pills.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + pills.length) % pills.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = pills.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    pills[next].focus();
  });
})();
