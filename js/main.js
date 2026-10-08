/* UI rendering, service dialog, navigation and reusable carousels. */
(() => {
  'use strict';
  const icons = {
    passport: '<rect x="5" y="3" width="18" height="23" rx="2"/><circle cx="14" cy="12" r="5"/><path d="M9 12h10M14 7c-3 3-3 7 0 10 3-3 3-7 0-10M10 21h8"/>',
    home: '<path d="m3 13 11-9 11 9M6 11v14h16V11M11 25v-9h6v9"/>',
    building: '<path d="M5 25V5h18v20M2 25h24M10 25v-6h8v6M9 9h3m4 0h3M9 14h3m4 0h3"/>',
    globe: '<circle cx="14" cy="14" r="11"/><path d="M3 14h22M14 3c-7 6-7 16 0 22 7-6 7-16 0-22M6 8h16M6 20h16"/>',
    document: '<path d="M7 3h10l6 6v17H7ZM17 3v7h6M11 15h8M11 20h6"/>',
    check: '<rect x="5" y="5" width="19" height="21" rx="2"/><path d="M10 5V2h9v3M10 15l4 4 7-8"/>'
  };
  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const whatsappUrl = (message = 'Hola, me gustaría recibir asesoría migratoria.') =>
    `https://wa.me/${SITE_CONTENT.whatsapp}?text=${encodeURIComponent(message)}`;
  document.querySelectorAll('[data-whatsapp]').forEach(link => { link.href = whatsappUrl(); });
  document.getElementById('year').textContent = new Date().getFullYear();

  // Services are real buttons with keyboard support and a native modal dialog.
  const dialog = document.getElementById('service-dialog');
  SITE_CONTENT.services.forEach((service, index) => {
    const card = create('button', 'service-card');
    card.type = 'button';
    card.setAttribute('aria-haspopup', 'dialog');
    const top = create('div', 'service-top');
    top.innerHTML = `<svg class="service-icon" viewBox="0 0 28 28" aria-hidden="true">${icons[service.icon]}</svg><span>0${index + 1}</span>`;
    card.append(top, create('h3', '', service.title), create('p', '', service.description), create('span', 'service-more', 'Conocer trámites ↗'));
    card.addEventListener('click', () => {
      document.getElementById('dialog-title').textContent = service.title;
      document.getElementById('dialog-description').textContent = service.description;
      document.getElementById('dialog-items').replaceChildren(...service.items.map(item => create('li', '', item)));
      document.getElementById('dialog-contact').href = whatsappUrl(`Hola, me gustaría recibir asesoría sobre ${service.title.toLowerCase()}.`);
      dialog.setAttribute('aria-labelledby', 'dialog-title');
      dialog.showModal();
    });
    document.getElementById('service-grid').append(card);
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  // Recreated review cards use selectable HTML text, not screenshots.
  SITE_CONTENT.reviews.forEach(review => {
    const card = create('article', 'review-card');
    const header = create('div', 'review-header');
    const author = create('div');
    author.append(create('strong', '', 'Cliente del despacho'), create('small', '', review.date));
    header.append(create('span', 'avatar', 'C'), author, create('span', 'google-mark', 'G'));
    const stars = create('div', 'stars', '★★★★★');
    stars.setAttribute('aria-label', '5 de 5 estrellas, según la imagen original');
    const quote = create('blockquote', '', review.text);
    if (review.language) quote.lang = review.language;
    const source = create('a', '', 'Ver publicación original ↗');
    source.href = review.url;
    source.target = '_blank';
    source.rel = 'noopener';
    card.append(header, stars, quote, source);
    document.getElementById('review-track').append(card);
  });
  SITE_CONTENT.partners.forEach(([file, name]) => {
    const card = create('div', 'partner');
    const logo = create('img');
    logo.src = `assets/logos/${file}.svg`;
    logo.alt = name;
    logo.width = 150;
    logo.height = 70;
    card.append(logo);
    document.getElementById('partner-track').append(card);
  });

  // Endless movement from left to right. Hover, focus or manual scrolling pauses it.
  // Duplicate visual cards are hidden from assistive technology and tab order.
  function setupCarousel(viewport) {
    const track = viewport.firstElementChild;
    const controls = document.querySelector(`[data-controls="${viewport.dataset.carousel}"]`);
    const pauseButton = controls.querySelector('[data-action="pause"]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const originals = [...track.children];
    originals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button').forEach(control => { control.tabIndex = -1; });
      track.append(clone);
    });
    let cycleWidth = 0;
    let paused = reducedMotion.matches;
    let hovering = false;
    let focused = false;
    let lastTime = 0;
    const setPause = value => {
      paused = value;
      pauseButton.textContent = paused ? '▶' : 'Ⅱ';
      pauseButton.setAttribute('aria-label', `${paused ? 'Reanudar' : 'Pausar'} ${viewport.dataset.carousel === 'reviews' ? 'recomendaciones' : 'socios'}`);
      pauseButton.setAttribute('aria-pressed', String(paused));
    };
    const measure = () => {
      cycleWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
      viewport.scrollLeft = cycleWidth;
    };
    // Wait for layout; dimensions are fixed so image downloads do not alter spacing.
    requestAnimationFrame(measure);
    new ResizeObserver(measure).observe(viewport);
    viewport.addEventListener('pointerenter', () => { hovering = true; });
    viewport.addEventListener('pointerleave', () => { hovering = false; });
    viewport.addEventListener('focusin', () => { focused = true; });
    viewport.addEventListener('focusout', () => { focused = false; });
    viewport.addEventListener('touchstart', () => setPause(true), { passive: true });
    viewport.addEventListener('wheel', () => setPause(true), { passive: true });
    viewport.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    });
    function step(direction) {
      setPause(true);
      const distance = originals[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
      if (direction > 0 && viewport.scrollLeft + distance > cycleWidth) viewport.scrollLeft -= cycleWidth;
      if (direction < 0 && viewport.scrollLeft < distance) viewport.scrollLeft += cycleWidth;
      viewport.scrollBy({ left: direction * distance, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
    controls.querySelector('[data-direction="prev"]').addEventListener('click', () => step(-1));
    controls.querySelector('[data-direction="next"]').addEventListener('click', () => step(1));
    pauseButton.addEventListener('click', () => setPause(!paused));
    reducedMotion.addEventListener('change', () => setPause(reducedMotion.matches));
    setPause(paused);
    function animate(time) {
      const delta = Math.min(time - lastTime, 40);
      lastTime = time;
      if (!paused && !hovering && !focused && !document.hidden && cycleWidth) {
        if (viewport.scrollLeft <= 1) viewport.scrollLeft += cycleWidth;
        viewport.scrollLeft -= delta * .023;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }
  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);

  // Mobile navigation and current section state.
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  const closeMenu = () => { navigation.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = navigation.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  const sections = ['inicio', 'servicios', 'recomendaciones', 'socios'];
  const updateActiveSection = () => {
    let active = 'inicio';
    sections.forEach(id => { if (document.getElementById(id).getBoundingClientRect().top <= 180) active = id; });
    navigation.querySelectorAll('a').forEach(link => {
      const current = link.hash === `#${active}`;
      link.classList.toggle('active', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', updateActiveSection, { passive: true });
  updateActiveSection();
})();
