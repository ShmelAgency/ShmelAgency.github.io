

const briefText = (value) => window.shmelI18n?.t(value) || value;
const projectForm = document.querySelector('#project-menu');
projectForm.querySelectorAll('.category-choice').forEach((checkbox) => {
  checkbox.addEventListener('click', (event) => event.stopPropagation());
});
projectForm.querySelector('.describe-problem').addEventListener('click', () => {
  projectForm.querySelector('.describe-problem').closest('.service-dropdown').querySelector('.category-choice').checked = true;
  const notes = document.querySelector('#project-notes');
  notes.setCustomValidity('');
  notes.focus();
});
projectForm.addEventListener('input', () => document.querySelector('#project-notes').setCustomValidity(''));

function renderBriefPages(data) {
  const pages = [];
  const professional = document.querySelector('.main')?.dataset.skin === 'professional';
  const environmental = document.querySelector('.main')?.dataset.skin === 'environmental';
  const pdfFont = professional || environmental ? 'Manrope, Arial, sans-serif' : 'Arial';
  const titleFont = environmental && window.shmelI18n?.language !== 'zh' ? '"Amatic SC", sans-serif' : pdfFont;
  const theme = professional
    ? { paper: '#ffffff', banner: '#214fba', title: '#ffffff', muted: '#455777', heading: '#214fba', ink: '#162449' }
    : environmental
    ? { paper: '#fffefb', banner: '#deead8', title: '#263c31', muted: '#56685b', heading: '#37664f', ink: '#263c31' }
    : { paper: '#fffaf0', banner: '#b24f4f', title: '#ffda66', muted: '#6b5550', heading: '#913c3c', ink: '#252222' };
  let canvas, context, y;
  const width = 1240, height = 1754, margin = 92, bottom = 1600;
  function nextPage() {
    canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not create the PDF pages.');
    context.fillStyle = theme.paper; context.fillRect(0, 0, width, height);
    context.fillStyle = theme.banner; context.fillRect(0, 0, width, 150);
    context.fillStyle = theme.title; context.font = `700 ${environmental ? 56 : 48}px ${titleFont}`;
    context.fillText(briefText(professional ? 'SHMEL / SERVICES BRIEF' : environmental ? 'SHMEL / PROJECT BRIEF' : 'SHMEL / MENU CARD'), margin, 96);
    context.fillStyle = theme.muted; context.font = `400 22px ${pdfFont}`;
    context.fillText('Shmel Agency | CVR 46506162 | shmelagency.eu@gmail.com', margin, 1676);
    context.fillText(String(pages.length + 1), width - margin - 25, 1676);
    pages.push(canvas); y = 220;
  }
  function line(text, heading = false) {
    if (y + 44 > bottom) nextPage();
    context.font = heading ? `700 ${environmental ? 36 : 30}px ${titleFont}` : `400 26px ${pdfFont}`;
    context.fillStyle = heading ? theme.heading : theme.ink;
    context.fillText(text, margin, y); y += heading ? 48 : 39;
  }
  function text(value) {
 
    for (const paragraph of String(value).split(/\r?\n/)) {
      context.font = `400 26px ${pdfFont}`;
      let current = '';
      for (const character of paragraph) {
        if (context.measureText(current + character).width > width - margin * 2) {
          const space = current.lastIndexOf(' ');
          if (space > current.length / 2) {
            line(current.slice(0, space)); current = current.slice(space + 1) + character;
          } else { line(current); current = character; }
        } else current += character;
      }
      line(current);
    }
  }
  function section(title, value) { y += 18; line(briefText(title), true); text(value || briefText('Not specified'));  }
  nextPage();
  section('Your details', `${briefText('Name')}: ${data.name}\n${briefText('Email')}: ${data.email}\n${briefText('Business')}: ${data.business || briefText('Not specified')}\n${briefText('Website')}: ${data.website || briefText('Not specified')}`);
  section('Selected services', data.services.length ? data.services.map((service) => '- ' + service.split(' / ').map(briefText).join(' / ')).join('\n') : briefText('Not sure yet - see project notes.'));
  if (data.services.includes('Marketing Strategy') || data.services.includes('Website & Digital')) section('AI search services', briefText('Improve the clarity, structure and discoverability of your online information for search engines and AI-powered discovery tools. No particular AI recommendation or citation is guaranteed.'));
  section('Budget', briefText(data.budget || 'Not sure yet'));
  section('When do you want to start?', data.timeline);
  section('Project notes', data.notes);
  return pages;
}

function buildBriefPdf(data) {
  const canvases = renderBriefPages(data);
  const encoder = new TextEncoder();
  const chunks = [], offsets = [0];
  let length = 0;
  function append(value) {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes); length += bytes.length;
  }
  function object(id, content) { offsets[id] = length; append(`${id} 0 obj\n${content}\nendobj\n`); }
  append('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const pageIds = canvases.map((_, i) => 3 + i * 3);
  object(2, `<< /Type /Pages /Count ${canvases.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`);
  canvases.forEach((canvas, i) => {
    const page = pageIds[i], image = page + 1, content = page + 2;
    object(page, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Image ${image} 0 R >> >> /Contents ${content} 0 R >>`);
    const jpeg = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', .92).split(',')[1]), (char) => char.charCodeAt(0));
    offsets[image] = length;
    append(`${image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    append(jpeg); append('\nendstream\nendobj\n');
    const commands = 'q\n595.28 0 0 841.89 0 0 cm\n/Image Do\nQ\n';
    object(content, `<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}endstream`);
  });
  const xref = length, count = 3 + canvases.length * 3;
  append(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++) append(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  append(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(projectForm);
  const notes = String(values.get('notes')).trim();
  const services = values.getAll('service');
  if (!services.length && !notes) {
    const field = document.querySelector('#project-notes');
    field.setCustomValidity(briefText('Pick at least one service or tell us what you have in mind.'));
    field.reportValidity(); return;
  }
  const button = projectForm.querySelector('[type="submit"]');
  const status = document.querySelector('#download-status');
  const email = projectForm.querySelector('.send-brief');
  button.disabled = true; status.textContent = 'Preparing your PDF…'; email.hidden = true;
  try {
    await document.fonts.ready;
    if (document.querySelector('.main')?.dataset.skin === 'environmental') {
      await Promise.all([document.fonts.load('700 56px "Amatic SC"'), document.fonts.load('400 26px Manrope')]);
    }
    const data = Object.fromEntries(values.entries());
    data.services = services; data.notes = notes;
    const pdf = buildBriefPdf(data);
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    const slug = String(data.business || data.name).normalize('NFKD').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'project';
    link.href = url; link.download = `shmel-order-${slug}.pdf`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = 'Your PDF is ready. Attach it to an email to shmelagency.eu@gmail.com. You can edit your answers and download again.';
    email.hidden = false;
  } catch {
    status.textContent = 'The PDF could not be created. Your answers are still here; please try downloading again.';
  } finally { button.disabled = false; }
});
