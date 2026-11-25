(() => {
  const dialog = document.querySelector('#portfolio-dialog');
  const content = dialog.querySelector('.portfolio-content');
  const layoutControls = dialog.querySelector('.portfolio-layout-controls');
  const fullButton = layoutControls.querySelector('.portfolio-full');
  const sectionsButton = layoutControls.querySelector('.portfolio-sections');
  const closeButton = dialog.querySelector('.portfolio-close');
  let sectionIndex = 0;
  let sectionMode = false;

  function updateSections() {
    content.classList.toggle('portfolio-section-mode', sectionMode);
    fullButton.setAttribute('aria-pressed', String(!sectionMode));
    sectionsButton.setAttribute('aria-pressed', String(sectionMode));
    content.querySelectorAll('.portfolio-group').forEach((group, index) => {
      group.hidden = sectionMode && index !== sectionIndex;
    });
    content.scrollTop = 0;
  }

  fullButton.addEventListener('click', () => {
    sectionMode = false;
    updateSections();
  });
  sectionsButton.addEventListener('click', () => {
    sectionMode = true;
    updateSections();
  });
  const view = dialog.querySelector('.portfolio-view');
  const heading = dialog.querySelector('#portfolio-title');
  const canvas = dialog.querySelector('.portfolio-canvas');
  const large = dialog.querySelector('.portfolio-large');
  const caption = dialog.querySelector('.portfolio-view-caption');
  const output = dialog.querySelector('output');
  const back = dialog.querySelector('.portfolio-back');
  const titles = { complex: 'Complex Cases', design: 'Design Gallery', research: 'Research and Numbers', video: 'Video and Photo' };
  let selected = null;
  let imageTrigger = null;
  let zoom = 1;
  function fitImage() {
    if (!selected || view.hidden) return;
    const roomWidth = Math.max(100, canvas.clientWidth - 48);
    const roomHeight = Math.max(100, canvas.clientHeight - 48);
    const scale = Math.min(roomWidth / selected.width, roomHeight / selected.height, 1) * zoom;
    large.style.width = `${selected.width * scale}px`;
    large.style.height = `${selected.height * scale}px`;
    output.value = `${Math.round(zoom * 100)}%`;
    dialog.querySelector('[data-zoom="out"]').disabled = zoom <= .5;
    dialog.querySelector('[data-zoom="in"]').disabled = zoom >= 3;
  }
  function openImage(item, button, title) {
    content.querySelectorAll('video').forEach(video => video.pause());
    imageTrigger = button;
    selected = item;
    zoom = 1;
    large.src = item.src;
    large.alt = item.alt;
    caption.textContent = title;
    content.hidden = true;
    view.hidden = false;
    fitImage();
    canvas.scrollTo(0, 0);
    back.focus();
  }
  function renderImages(images, title) {
    const grid = document.createElement('div');
    grid.className = 'portfolio-grid';
    images.forEach((item, index) => {
      const figure = document.createElement('figure');
      figure.className = 'portfolio-frame';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.setAttribute('aria-label', `Enlarge ${item.alt}`);
      const img = document.createElement('img');
      Object.assign(img, { src: item.src, alt: item.alt, loading: 'lazy', width: item.width, height: item.height });
      trigger.append(img);
      const label = document.createElement('figcaption');
      label.textContent = `${title} · ${index + 1}`;
      trigger.addEventListener('click', () => openImage(item, trigger, label.textContent));
      figure.append(trigger, label);
      grid.append(figure);
    });
    return grid;
  }

  function addVideoPlayButton(video) {
    const player = document.createElement('div');
    player.className = 'gallery-video-player';
    video.replaceWith(player);

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'gallery-video-play';
    play.textContent = 'Play video';
    play.setAttribute('aria-label', `Play ${video.getAttribute('aria-label')}`);

    const status = document.createElement('p');
    status.className = 'gallery-video-status';
    status.setAttribute('role', 'status');
    const source = video.querySelector('source');
    const openVideo = document.createElement('a');
    openVideo.href = source.src;
    openVideo.target = '_blank';
    openVideo.rel = 'noopener';
    openVideo.textContent = 'Open MP4';

    const showError = () => {
      status.replaceChildren('This video could not be played here. ', openVideo);
    };
    play.addEventListener('click', async () => {
      status.textContent = '';
      try {
        if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) video.load();
        await video.play();
      } catch (error) {
        if (error.name !== 'AbortError') showError();
      }
    });
    video.addEventListener('playing', () => {
      if (document.activeElement === play) video.focus();
      play.hidden = true;
      status.textContent = '';
    });
    video.addEventListener('error', showError);
    source.addEventListener('error', showError);
    player.append(video, play, status);
  }

  document.querySelectorAll('.work-open').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.portfolio;
      const groups = window.shmelPortfolio[category] ?? [];
      const isVideo = category === 'video';
      const isComplex = category === 'complex';
      const isBee = button.closest('.main').dataset.skin === 'shmel';
      const beeSections = category === 'design' && isBee;
      dialog.classList.toggle('portfolio-bee-sections', beeSections);
      dialog.classList.toggle('portfolio-video', isVideo);
      dialog.classList.toggle('portfolio-bee-cases', isComplex && isBee);
      layoutControls.hidden = !beeSections;
      sectionMode = beeSections;
      const previewIndex = groups.findIndex(group => group.title === '3D projects');
      sectionIndex = beeSections ? Math.max(0, previewIndex) : 0;
      heading.textContent = titles[category];
      content.replaceChildren();
      content.hidden = false;
      view.hidden = true;
      const note = document.createElement('p');
      note.className = 'portfolio-note';
      note.textContent = category === 'research'
        ? 'Research topics from the presentation. Select the slide for a closer look.'
        : 'Select a framed image to take a closer look. Use the zoom controls to explore the details.';
      if (isVideo) {
        content.append(document.querySelector('#video-and-photo').content.cloneNode(true));
      } else if (!isComplex) {
        content.append(note);
      }
      groups.forEach((group, groupIndex) => {
        const section = document.createElement(isComplex ? 'details' : 'section');
        section.className = 'portfolio-group';
        const title = document.createElement('h3');
        title.textContent = group.title;
        if (isComplex) {
          section.classList.add('portfolio-case');
          const summary = document.createElement('summary');
          const cover = group.cover ?? group.images[0];
          const coverImage = document.createElement('img');
          Object.assign(coverImage, { src: cover.src, alt: '', loading: 'lazy', width: cover.width, height: cover.height });
          summary.append(coverImage, title);
          section.append(summary);
        } else {
          section.append(title);
        }
        if (group.caseTemplate) {
          const caseStudy = document.getElementById(group.caseTemplate).content.cloneNode(true);
          const imageSlot = caseStudy.querySelector('[data-case-images]');
          if (imageSlot) {
            imageSlot.replaceWith(renderImages(group.images, 'Designs'));
          } else {
            const [photo, ...interiors] = group.images;
            caseStudy.querySelector('[data-case-designs]').replaceWith(renderImages(group.designs, 'Designs'));
            caseStudy.querySelector('[data-case-interiors]').replaceWith(renderImages(interiors, 'Interior design'));
            caseStudy.querySelector('[data-case-photo]').replaceWith(renderImages([photo], 'Cocktail photography'));
          }
          section.addEventListener('toggle', () => {
            if (!section.open) section.querySelectorAll('video').forEach(video => video.pause());
          });
          section.append(caseStudy);
          content.append(section);
          return;
        }
        if (category === 'research') {
          const research = document.querySelector('#research-copy');
          section.append(research.content.cloneNode(true));
        } else if (group.description) {
          const description = document.createElement('p');
          description.className = 'portfolio-description';
          description.textContent = group.description;
          section.append(description);
        }
        section.append(renderImages(group.images, group.title));
        if (beeSections) {
          const navigation = document.createElement('div');
          navigation.className = 'portfolio-section-navigation';
          const makeArrow = (direction, label, symbol) => {
            const arrow = document.createElement('button');
            arrow.type = 'button';
            arrow.setAttribute('aria-label', label);
            arrow.textContent = symbol;
            arrow.addEventListener('click', () => {
              sectionIndex = (groupIndex + direction + groups.length) % groups.length;
              updateSections();
              content.querySelector('.portfolio-group:not([hidden]) .portfolio-section-navigation')
                .querySelector(direction < 0 ? 'button:first-child' : 'button:last-child').focus();
            });
            return arrow;
          };
          navigation.append(makeArrow(-1, 'Previous section', '?'), makeArrow(1, 'Next section', '?'));
          section.append(navigation);
        }
        content.append(section);
      });
      content.querySelectorAll('video').forEach(addVideoPlayButton);
      updateSections();
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      content.scrollTop = 0;
    });
  });
  back.addEventListener('click', () => {
    view.hidden = true;
    content.hidden = false;
    selected = null;
    imageTrigger?.focus();
  });
  dialog.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    zoom = button.dataset.zoom === 'fit' ? 1 : Math.max(.5, Math.min(3, zoom + (button.dataset.zoom === 'in' ? .25 : -.25)));
    fitImage();
  }));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    document.documentElement.style.overflow = '';
    selected = null;
    content.querySelectorAll('video').forEach(video => video.pause());
    if (dialog.classList.contains('portfolio-video')) content.replaceChildren();
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  new ResizeObserver(fitImage).observe(canvas);
})();
