const LOOKS = [
  { name: 'The Golden Thread', description: 'Ivory, gold, and an airy netela.' },
  { name: 'The Crimson Line', description: 'A tailored silhouette with burgundy detail.' },
  { name: 'Emerald Passage', description: 'A vivid meeting of emerald and ivory.' },
  { name: 'Terracotta Light', description: 'Warm colour with a woven accent.' },
  { name: 'The Modern Heritage', description: 'Charcoal tailoring over soft white.' },
  { name: 'Indigo Ceremony', description: 'An occasion look in ivory and indigo.' },
];

const ITEMS = [
  { name: 'Gold Tibeb Kemis', price: 'ETB 16,800' },
  { name: 'Ivory Netela', price: 'ETB 4,800' },
  { name: 'Crimson Trim Tunic', price: 'ETB 11,500' },
  { name: 'Cream Straight Trousers', price: 'ETB 6,400' },
  { name: 'Emerald Habesha Dress', price: 'ETB 19,200' },
  { name: 'Emerald Woven Shawl', price: 'ETB 5,600' },
  { name: 'Terracotta Tibeb Kemis', price: 'ETB 18,700' },
  { name: 'Terracotta Shawl', price: 'ETB 5,200' },
  { name: 'Charcoal Woven Jacket', price: 'ETB 14,900' },
  { name: 'White Heritage Tunic', price: 'ETB 8,600' },
  { name: 'Indigo Bridal Kemis', price: 'ETB 34,500' },
  { name: 'Indigo Netela', price: 'ETB 8,900' },
];

if (LOOKS.length !== 6 || ITEMS.length !== LOOKS.length * 2) {
  throw new Error('The lookbook needs six looks and two pieces per look.');
}

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const modelsHost = $('models');
const cardsHost = $('cards');
const cardsViewport = $('cards-viewport');
const ring = $('ring');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wrap = (value, length) => ((value % length) + length) % length;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const stops = {
  x: [1.2, .744, .496, .346, .235, .15, .085],
  feet: [1.14, .89, .777, .704, .651, .616, .59],
  height: [1.18, .832, .574, .436, .334, .258, .19],
  blur: [0, 0, 1.5, 4, 8, 12, 17],
  opacity: [1, 1, 1, 1, .86, .5, 0],
};

function between(table, depth) {
  const position = clamp(depth + 1, 0, 6);
  const lower = Math.floor(position);
  const upper = Math.min(6, lower + 1);
  return table[lower] + (table[upper] - table[lower]) * (position - lower);
}

const modelNodes = LOOKS.map((_, index) => {
  const node = document.createElement('div');
  node.className = 'model';
  node.style.backgroundPosition = `${index * 20}% 50%`;
  modelsHost.append(node);
  return node;
});

const cardNodes = ITEMS.map((item, index) => {
  const card = document.createElement('article');
  card.className = `card${index % 2 ? ' alt' : ''}`;
  const image = document.createElement('div');
  image.className = 'product-image';
  image.setAttribute('role', 'img');
  image.setAttribute('aria-label', `Illustration of ${item.name}`);
  const sprite = document.createElement('div');
  sprite.className = 'product-sprite';
  sprite.style.backgroundPosition = `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 50}%`;
  image.append(sprite);
  const info = document.createElement('div');
  info.className = 'product-info';
  const count = document.createElement('div');
  count.className = 'item-count';
  count.textContent = `LOOK ${String(Math.floor(index / 2) + 1).padStart(2, '0')} / PIECE ${index % 2 + 1}`;
  const heading = document.createElement('h2');
  heading.textContent = item.name;
  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = item.price;
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const save = document.createElement('button');
  save.className = 'save';
  save.type = 'button';
  save.setAttribute('aria-label', `Save ${item.name}`);
  save.setAttribute('aria-pressed', 'false');
  save.textContent = '♡';
  const add = document.createElement('button');
  add.className = 'add';
  add.type = 'button';
  add.setAttribute('aria-label', `Add ${item.name} to demo bag`);
  add.textContent = 'ADD +';
  actions.append(save, add);
  info.append(count, heading, price, actions);
  card.append(image, info);
  cardsHost.append(card);
  return card;
});

let width = 0;
let height = 0;
let cardSize = 0;
let mobile = false;
let position = 0;
let target = 0;
let lastTime = 0;
let shownLook = -1;
let bagCount = 0;
let pointerDown = false;
let startX = 0;
let startTarget = 0;
let moved = 0;
let wheelTimer;
let toastTimer;
const geometry = [];

function resize() {
  width = stage.clientWidth;
  height = stage.clientHeight;
  mobile = window.innerWidth <= 820;
  const base = height * 1.2;
  modelNodes.forEach((node) => {
    node.style.width = `${base * .5}px`;
    node.style.height = `${base}px`;
  });
  cardSize = mobile ? 155 : cardsViewport.clientHeight / 3;
  cardNodes.forEach((node) => {
    node.style.height = mobile ? '100%' : `${cardSize}px`;
  });
  paint();
}

function showLook(index) {
  if (index === shownLook) return;
  shownLook = index;
  $('look-counter').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
  $('look-name').textContent = LOOKS[index].name;
  $('look-description').textContent = LOOKS[index].description;
  $('look-progress').style.width = `${(index + 1) / LOOKS.length * 100}%`;
}

function paint() {
  if (!width || !height || !cardSize) return;
  const base = height * 1.2;
  modelNodes.forEach((node, index) => {
    let depth = wrap(index - position, LOOKS.length);
    if (depth > LOOKS.length - 1) depth -= LOOKS.length;
    const scaledHeight = between(stops.height, depth) * height;
    const scale = scaledHeight / base;
    const scaledWidth = scaledHeight * .5;
    const x = (mobile && depth < 0 ? (1.7 + (.744 - 1.7) * (depth + 1)) : between(stops.x, depth)) * width - scaledWidth / 2;
    const y = between(stops.feet, depth) * height - scaledHeight;
    geometry[index] = { x, y, width: scaledWidth, height: scaledHeight };
    node.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${scale.toFixed(4)})`;
    const blur = between(stops.blur, depth) / scale;
    node.style.filter = blur < .2 ? 'none' : `blur(${blur.toFixed(1)}px)`;
    node.style.opacity = between(stops.opacity, depth).toFixed(3);
    node.style.zIndex = String(100 - Math.round(depth * 10));
  });
  const track = cardSize * ITEMS.length;
  cardNodes.forEach((card, index) => {
    let offset = wrap(index * cardSize - position * 2 * cardSize, track);
    if (offset > track - cardSize) offset -= track;
    card.style.transform = mobile
      ? `translate3d(${offset.toFixed(1)}px,0,0)`
      : `translate3d(0,${offset.toFixed(1)}px,0)`;
  });
  showLook(wrap(Math.round(position), LOOKS.length));
}

function tick(time) {
  const elapsed = Math.min(50, time - lastTime || 16);
  lastTime = time;
  if (reducedMotion.matches) position = target;
  else position += (target - position) * (1 - Math.exp(-elapsed * .0072));
  if (Math.abs(position - target) < .0004) position = target;
  paint();
  requestAnimationFrame(tick);
}

function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
}

function step(direction) {
  target = Math.round(target) + direction;
}

$('previous').addEventListener('click', () => step(-1));
$('next').addEventListener('click', () => step(1));
stage.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    step(1);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    step(-1);
  }
});

stage.addEventListener('pointerenter', (event) => {
  if (event.pointerType === 'mouse') ring.classList.add('show');
});
stage.addEventListener('pointerleave', () => ring.classList.remove('show'));
stage.addEventListener('pointermove', (event) => {
  const bounds = stage.getBoundingClientRect();
  ring.style.transform = `translate3d(${event.clientX - bounds.left}px,${event.clientY - bounds.top}px,0)`;
  if (!pointerDown) return;
  const delta = event.clientX - startX;
  moved = Math.max(moved, Math.abs(delta));
  target = startTarget + delta / Math.max(150, width * .2);
});
stage.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  pointerDown = true;
  startX = event.clientX;
  startTarget = target;
  moved = 0;
  stage.setPointerCapture(event.pointerId);
  ring.classList.add('dragging');
});
function release(event) {
  if (!pointerDown) return;
  pointerDown = false;
  ring.classList.remove('dragging');
  if (moved < 6) {
    const bounds = stage.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const clicked = geometry.findIndex((box) => box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height);
    if (clicked >= 0) {
      let delta = wrap(clicked - Math.round(target), LOOKS.length);
      if (delta > LOOKS.length / 2) delta -= LOOKS.length;
      target = Math.round(target) + delta;
    }
  } else {
    target = Math.round(target);
  }
}
stage.addEventListener('pointerup', release);
stage.addEventListener('pointercancel', release);
stage.addEventListener('wheel', (event) => {
  event.preventDefault();
  target += clamp(event.deltaY + event.deltaX, -120, 120) / 180;
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => { target = Math.round(target); }, 150);
}, { passive: false });

cardsHost.addEventListener('click', (event) => {
  const save = event.target.closest('.save');
  if (save) {
    const active = save.getAttribute('aria-pressed') !== 'true';
    save.setAttribute('aria-pressed', String(active));
    save.textContent = active ? '♥' : '♡';
    return;
  }
  const add = event.target.closest('.add');
  if (add) {
    bagCount += 1;
    $('bag-count').textContent = `(${bagCount})`;
    toast('Added to your demo bag. No purchase will be made.');
  }
});

function loadImage(url) {
  const image = new Image();
  image.src = url;
  return image.decode();
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(tick);
Promise.all([loadImage('assets/habesha-models.png'), loadImage('assets/habesha-pieces.png')])
  .catch(() => toast('Some images could not load. Check the local files.'))
  .finally(() => $('loading').classList.add('gone'));
