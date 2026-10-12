/* Run with: node --test tests/carousels.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/carousels.js'), 'utf8');

function createCarousel(name, screenWidth, reducedMotion = false) {
  let time = 0;
  let frames = [];
  let scrollPosition = 0;
  let resize;
  let width = screenWidth;
  const isReviews = name === 'reviews';
  const count = isReviews ? 4 : 16;
  const gap = isReviews ? 20 : 24;
  const cardWidth = () =>
    isReviews ? (width <= 720 ? Math.min(330, width - 65) : 365) : width <= 720 ? 160 : 185;
  const viewportWidth = () =>
    Math.min(1160, width - (width <= 360 ? 32 : width <= 720 ? 40 : width <= 1024 ? 64 : 96));
  const cycle = () => count * (cardWidth() + gap);
  const eventTarget = () => ({
    listeners: {},
    addEventListener(type, callback) {
      this.listeners[type] = callback;
    },
    setAttribute(key, value) {
      this[key] = value;
    },
  });
  const pause = eventTarget();
  const previous = eventTarget();
  const next = eventTarget();
  const motion = { ...eventTarget(), matches: reducedMotion };
  const card = (index) => ({
    get offsetLeft() {
      return index * (cardWidth() + gap);
    },
    cloneNode() {
      return card(track.children.length);
    },
    setAttribute() {},
    querySelectorAll() {
      return [];
    },
    getBoundingClientRect() {
      return { width: cardWidth() };
    },
  });
  const track = {
    children: [],
    append(item) {
      this.children.push(item);
    },
  };
  for (let index = 0; index < count; index += 1) track.append(card(index));
  const viewport = {
    ...eventTarget(),
    dataset: { carousel: name },
    firstElementChild: track,
    contains(target) {
      return target === this;
    },
    get scrollLeft() {
      return scrollPosition;
    },
    set scrollLeft(value) {
      // Model integer-only scroll writes and real scroll boundaries.
      const maximum = track.children.length * (cardWidth() + gap) - gap - viewportWidth();
      scrollPosition = Math.round(Math.max(0, Math.min(value, maximum)));
    },
    scrollTo({ left }) {
      this.scrollLeft = left;
    },
  };
  const document = {
    hidden: false,
    querySelectorAll() {
      return [viewport];
    },
    querySelector() {
      return {
        querySelector(selector) {
          return selector.includes('pause') ? pause : selector.includes('prev') ? previous : next;
        },
      };
    },
  };
  vm.runInNewContext(source, {
    document,
    matchMedia: () => motion,
    getComputedStyle: () => ({ columnGap: String(gap) }),
    requestAnimationFrame(callback) {
      frames.push(callback);
    },
    ResizeObserver: class {
      constructor(callback) {
        resize = callback;
      }
      observe() {}
    },
  });
  function advance(milliseconds = 1000, frameDuration = 16) {
    for (let elapsed = 0; elapsed < milliseconds; elapsed += frameDuration) {
      time += frameDuration;
      const pending = frames;
      frames = [];
      pending.forEach((callback) => callback(time));
    }
  }
  advance(16);
  return {
    viewport,
    pause,
    previous,
    next,
    motion,
    document,
    track,
    cycle,
    advance,
    resize(newWidth) {
      width = newWidth;
      resize();
    },
  };
}

for (const name of ['reviews', 'partners']) {
  for (const width of [320, 375, 390, 720, 768, 820, 1024, 1440]) {
    test(`${name}: autoplay and controls at ${width}px`, () => {
      const c = createCarousel(name, width);
      const start = c.viewport.scrollLeft;
      c.advance(1000, 8); // High refresh rates exposed the original rounding bug.
      assert(Math.abs(((start - c.viewport.scrollLeft + c.cycle()) % c.cycle()) - 23) <= 1);
      c.pause.listeners.click();
      const paused = c.viewport.scrollLeft;
      c.advance();
      assert.equal(c.viewport.scrollLeft, paused);
      c.next.listeners.click();
      assert(c.viewport.scrollLeft > paused);
      const afterNext = c.viewport.scrollLeft;
      c.previous.listeners.click();
      assert(c.viewport.scrollLeft < afterNext);
      assert.equal(c.pause['aria-pressed'], 'true');
      c.pause.listeners.click();
      const resumed = c.viewport.scrollLeft;
      c.advance();
      assert(Math.abs(((resumed - c.viewport.scrollLeft + c.cycle()) % c.cycle()) - 23) <= 2);
      c.advance(180000);
      assert(c.viewport.scrollLeft >= c.cycle());
      assert(c.viewport.scrollLeft < 2 * c.cycle());
    });
  }

  test(`${name}: touch, wheel, keyboard, focus, orientation and motion preference`, () => {
    const c = createCarousel(name, 390);
    c.viewport.listeners.wheel({ deltaX: 0, shiftKey: false });
    assert.equal(c.pause['aria-pressed'], 'false');
    c.viewport.listeners.touchstart();
    assert.equal(c.pause['aria-pressed'], 'true');
    c.pause.listeners.click();
    c.viewport.listeners.wheel({ deltaX: 20, shiftKey: false });
    assert.equal(c.pause['aria-pressed'], 'true');
    let prevented = false;
    c.viewport.listeners.keydown({
      key: 'ArrowRight',
      preventDefault() {
        prevented = true;
      },
    });
    assert(prevented);
    c.resize(820);
    c.pause.listeners.click();
    c.viewport.listeners.focusin();
    const focused = c.viewport.scrollLeft;
    c.advance();
    assert.equal(c.viewport.scrollLeft, focused);
    c.viewport.listeners.focusout({ relatedTarget: null });
    c.advance();
    assert(c.viewport.scrollLeft < focused);
    c.document.hidden = true;
    const hidden = c.viewport.scrollLeft;
    c.advance();
    assert.equal(c.viewport.scrollLeft, hidden);
    c.document.hidden = false;
    c.motion.matches = true;
    c.motion.listeners.change();
    c.advance();
    assert.equal(c.viewport.scrollLeft, hidden);
    c.pause.listeners.click();
    c.advance();
    assert(c.viewport.scrollLeft < hidden, 'Explicit play overrides reduced-motion initial pause');
    c.resize(320);
    assert(c.viewport.scrollLeft >= c.cycle());
    assert(c.viewport.scrollLeft < 2 * c.cycle());
  });

  test(`${name}: reduced motion starts paused`, () => {
    const c = createCarousel(name, 768, true);
    const start = c.viewport.scrollLeft;
    c.advance();
    assert.equal(c.viewport.scrollLeft, start);
    assert.equal(c.pause['aria-pressed'], 'true');
    c.next.listeners.click();
    assert(c.viewport.scrollLeft > start);
    assert(c.track.children.slice(c.track.children.length / 3).every((card) => card.inert));
  });
}
