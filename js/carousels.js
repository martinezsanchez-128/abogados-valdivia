/* Shared carousel behavior for reviews and partner logos. */
(() => {
  'use strict';

  const SPEED_PIXELS_PER_SECOND = 23;
  const MAX_FRAME_DURATION_MS = 40;
  // SVG avoids platform-specific emoji colors on mobile and tablet.
  const CONTROL_ICONS = {
    play: '<svg class="carousel-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5 19 12 8 19Z" /></svg>',
    pause:
      '<svg class="carousel-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14M16 5v14" /></svg>',
  };

  function setupCarousel(viewport) {
    const track = viewport.firstElementChild;
    const controls = document.querySelector(`[data-controls="${viewport.dataset.carousel}"]`);
    const pauseButton = controls.querySelector('[data-action="pause"]');
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const originals = [...track.children];
    const label = viewport.dataset.carousel === 'reviews' ? 'recomendaciones' : 'socios';

    if (!originals.length) return;

    // Three copies keep a full cycle available on both sides of the middle copy.
    for (let copy = 0; copy < 2; copy += 1) {
      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        clone.querySelectorAll('a, button').forEach((control) => {
          control.tabIndex = -1;
        });
        track.append(clone);
      });
    }

    let cycleWidth = 0;
    let position = 0;
    let paused = motionPreference.matches;
    let focused = false;
    let lastTime = null;

    // Equivalent positions show the same cards without hitting a scroll boundary.
    function middlePosition(value) {
      return cycleWidth + (((value % cycleWidth) + cycleWidth) % cycleWidth);
    }

    function setPause(value) {
      paused = value;
      position = viewport.scrollLeft;
      viewport.scrollTo({ left: position, behavior: 'instant' });
      pauseButton.innerHTML = paused ? CONTROL_ICONS.play : CONTROL_ICONS.pause;
      pauseButton.setAttribute('aria-label', `${paused ? 'Reanudar' : 'Pausar'} ${label}`);
      pauseButton.setAttribute('aria-pressed', String(paused));
    }

    function measure() {
      const progress = cycleWidth ? (viewport.scrollLeft % cycleWidth) / cycleWidth : 0;
      cycleWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
      if (!cycleWidth) return;
      position = middlePosition(progress * cycleWidth);
      viewport.scrollTo({ left: position, behavior: 'instant' });
    }

    function step(direction) {
      if (!cycleWidth) return;
      setPause(true);
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const distance = originals[0].getBoundingClientRect().width + gap;
      const start = middlePosition(viewport.scrollLeft);

      viewport.scrollTo({ left: start, behavior: 'instant' });
      viewport.scrollTo({
        left: start + direction * distance,
        behavior: motionPreference.matches ? 'instant' : 'smooth',
      });
    }

    function animate(time) {
      const elapsed = lastTime === null ? 0 : Math.min(time - lastTime, MAX_FRAME_DURATION_MS);
      lastTime = time;

      if (!paused && !focused && !document.hidden && cycleWidth) {
        // Retain fractional pixels: browsers can round each scrollLeft write.
        position = middlePosition(position - (elapsed * SPEED_PIXELS_PER_SECOND) / 1000);
        viewport.scrollLeft = position;
      }

      requestAnimationFrame(animate);
    }

    viewport.addEventListener('focusin', () => {
      focused = true;
    });
    viewport.addEventListener('focusout', (event) => {
      focused = viewport.contains(event.relatedTarget);
      position = viewport.scrollLeft;
    });
    viewport.addEventListener('touchstart', () => setPause(true), { passive: true });
    viewport.addEventListener(
      'wheel',
      (event) => {
        // Vertical page scrolling should not stop the carousel on desktop/tablet.
        if (event.deltaX || event.shiftKey) setPause(true);
      },
      { passive: true },
    );
    viewport.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    });

    controls.querySelector('[data-direction="prev"]').addEventListener('click', () => step(-1));
    controls.querySelector('[data-direction="next"]').addEventListener('click', () => step(1));
    pauseButton.addEventListener('click', () => setPause(!paused));
    motionPreference.addEventListener('change', () => setPause(motionPreference.matches));

    setPause(paused);
    requestAnimationFrame(measure);
    new ResizeObserver(measure).observe(viewport);
    requestAnimationFrame(animate);
  }

  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
})();
