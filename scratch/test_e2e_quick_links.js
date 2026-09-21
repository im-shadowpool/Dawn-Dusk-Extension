/**
 * End-to-End Simulation & Lifecycle Test for Quick Links Feature
 * Runs app.js in a mock browser environment, simulating Chrome APIs, DOM events,
 * and user interactions.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

const projectRoot = path.resolve(__dirname, '..');
const appJsCode = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

// Mock DOM elements and document structure
class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this._classes = new Set();
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c),
      toggle: (c, force) => {
        if (typeof force === 'boolean') {
          if (force) this._classes.add(c);
          else this._classes.delete(c);
          return force;
        }
        if (this._classes.has(c)) {
          this._classes.delete(c);
          return false;
        }
        this._classes.add(c);
        return true;
      }
    };
    this.style = {};
    this.attributes = {};
    this.dataset = {};
    this.children = [];
    this.childNodes = [];
    this.listeners = {};
    this.textContent = '';
    this._innerHTML = '';
    this.value = '';
    this.checked = false;
    this.open = false;
  }

  get className() {
    return Array.from(this._classes).join(' ');
  }

  set className(val) {
    this._classes.clear();
    if (typeof val === 'string') {
      val.trim().split(/\s+/).forEach(c => { if (c) this._classes.add(c); });
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
      this.childNodes = [];
      this._innerNodes = {};
    }
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type, fn) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(f => f !== fn);
    }
  }

  dispatchEvent(event) {
    const type = event.type || event;
    const fns = this.listeners[type] || [];
    fns.forEach(fn => fn(event));
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter(c => c !== child);
    this.childNodes = this.childNodes.filter(c => c !== child);
    return child;
  }

  querySelector(sel) {
    if (this._innerNodes && this._innerNodes[sel]) return this._innerNodes[sel];
    if (sel.startsWith('#')) {
      const targetId = sel.slice(1);
      if (this.id === targetId) return this;
      for (const c of this.children) {
        if (c.querySelector) {
          const res = c.querySelector(sel);
          if (res) return res;
        }
      }
    }
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList && this.classList.contains(cls)) return this;
      for (const c of this.children) {
        if (c.querySelector) {
          const res = c.querySelector(sel);
          if (res) return res;
        }
      }
      if (typeof this.innerHTML === 'string' && this.innerHTML.includes(cls)) {
        if (!this._innerNodes) this._innerNodes = {};
        const el = new MockElement('', 'div');
        el.classList.add(cls);
        this._innerNodes[sel] = el;
        this.children.push(el);
        return el;
      }
    }
    if (sel === 'span') {
      if (this.tagName === 'SPAN') return this;
      for (const c of this.children) {
        if (c.querySelector) {
          const res = c.querySelector(sel);
          if (res) return res;
        }
      }
    }
    if (sel === 'input' || sel.startsWith('input') || sel.startsWith('button')) {
      for (const c of this.children) {
        if (c.querySelector) {
          const res = c.querySelector(sel);
          if (res) return res;
        }
      }
      const el = new MockElement('', 'input');
      this.children.push(el);
      return el;
    }
    return null;
  }

  querySelectorAll(sel) {
    const list = [];
    const search = (node) => {
      if (sel.startsWith('.')) {
        if (node.classList && node.classList.contains(sel.slice(1))) list.push(node);
      }
      for (const c of (node.children || [])) {
        search(c);
      }
    };
    search(this);
    return list;
  }

  closest(sel) {
    let curr = this;
    while (curr) {
      if (sel.startsWith('.') && curr.classList && curr.classList.contains(sel.slice(1))) {
        return curr;
      }
      curr = curr.parentNode;
    }
    return null;
  }

  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() {}
  blur() {}
}

const elementRegistry = {};
function getOrCreateMockEl(id, tagName = 'div') {
  if (!elementRegistry[id]) {
    elementRegistry[id] = new MockElement(id, tagName);
  }
  return elementRegistry[id];
}

// Pre-create all elements referenced in app.js
const ids = [
  'focus-toggle-btn', 'clock-view', 'timer-view', 'timer-slide-container',
  'calendar-toggle-btn', 'calendar-slide-container', 'calendar-view', 'cal-month-year',
  'cal-today-btn', 'cal-prev-btn', 'cal-next-btn', 'calendar-grid',
  'ambient-toggle-btn', 'ambient-equalizer', 'ambient-slide-container', 'ambient-view',
  'ambient-status-badge', 'ambient-play-btn', 'ambient-play-icon', 'ambient-pause-icon',
  'ambient-play-text', 'ambient-timer-btn', 'ambient-timer-tag', 'ambient-mute-btn',
  'ambient-volume-icon-high', 'ambient-volume-icon-mute', 'ambient-volume-slider', 'ambient-volume-val',
  'sound-toggle-btn', 'sound-icon-on', 'sound-icon-off', 'settings-btn', 'settings-side-sheet',
  'settings-scrim', 'close-settings-btn', 'confirm-settings-btn', 'settings-name-input',
  'settings-greeting-toggle', 'settings-motivation-toggle', 'format-12h-btn', 'format-24h-btn',
  'settings-seconds-toggle', 'settings-date-toggle', 'settings-sound-toggle',
  'settings-task-sound-toggle', 'settings-mode-sound-toggle', 'help-btn',
  'shortcuts-dialog', 'close-dialog-btn', 'confirm-dialog-btn',
  'clock-hours', 'clock-minutes', 'clock-colon-main', 'clock-colon-sec', 'clock-seconds-wrapper',
  'clock-seconds', 'clock-period', 'date-display', 'greeting-container', 'greeting-salutation',
  'user-name', 'greeting-subtitle',
  'timer-display', 'timer-label', 'timer-progress-ring', 'timer-start-btn', 'timer-reset-btn',
  'timer-play-icon', 'timer-pause-icon', 'timer-play-text',
  'task-form', 'task-input', 'task-list', 'tasks-count', 'tasks-date-filter-chip',
  'tasks-filter-label', 'filter-remove-btn', 'clear-completed-btn', 'task-empty-state',
  // Quick Links IDs
  'quick-links-section', 'quick-links-container', 'quick-links-grid', 'quick-link-add-btn',
  'quick-link-dialog', 'quick-link-dialog-title', 'close-quick-link-dialog-btn',
  'quick-link-form', 'quick-link-title-input', 'quick-link-url-input',
  'cancel-quick-link-btn', 'quick-link-context-menu', 'settings-quick-links-toggle',
  'resync-top-sites-btn'
];

ids.forEach(id => getOrCreateMockEl(id));

const resyncSpan = new MockElement('', 'span');
resyncSpan.textContent = 'Re-sync Top Sites';
elementRegistry['resync-top-sites-btn'].appendChild(resyncSpan);

const heroCanvas = new MockElement('', 'div');
heroCanvas.classList.add('hero-center-canvas');

const storageStore = {};

const mockChrome = {
  storage: {
    local: {
      get: (keys, cb) => {
        const res = {};
        keys.forEach(k => {
          if (storageStore[k] !== undefined) res[k] = storageStore[k];
        });
        cb(res);
      },
      set: (items, cb) => {
        Object.assign(storageStore, items);
        if (cb) cb();
      }
    }
  },
  topSites: {
    get: (cb) => {
      cb([
        { title: 'Google Search', url: 'https://google.com' },
        { title: 'GitHub', url: 'https://github.com' },
        { title: 'YouTube', url: 'https://youtube.com' }
      ]);
    }
  }
};

const mockWindow = {
  addEventListener: (t, fn) => {
    if (!mockWindow.listeners) mockWindow.listeners = {};
    if (!mockWindow.listeners[t]) mockWindow.listeners[t] = [];
    mockWindow.listeners[t].push(fn);
  },
  innerWidth: 1920,
  innerHeight: 1080,
  open: (url, target) => { mockWindow.lastOpenedUrl = url; }
};

const mockDocument = {
  readyState: 'complete',
  documentElement: { dataset: {} },
  body: new MockElement('body', 'body'),
  getElementById: (id) => elementRegistry[id] || null,
  querySelector: (sel) => {
    if (sel === '.hero-center-canvas') return heroCanvas;
    if (sel.startsWith('#')) return elementRegistry[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll: (sel) => {
    return [];
  },
  createElement: (tag) => new MockElement('', tag),
  createElementNS: (ns, tag) => new MockElement('', tag),
  addEventListener: (t, fn) => {}
};

console.log('\n--- 1. Initializing app.js in Sandbox ---');
const context = vm.createContext({
  window: mockWindow,
  document: mockDocument,
  chrome: mockChrome,
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  Math: Math,
  URL: URL,
  encodeURIComponent: encodeURIComponent,
  Audio: class { constructor() { this.src = ''; } },
  AudioContext: class {
    constructor() { this.currentTime = 0; this.state = 'running'; }
    createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {} }; }
    createOscillator() { return { frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(10) }; }
    decodeAudioData() { return Promise.resolve({ numberOfChannels: 2, sampleRate: 44100, length: 44100, getChannelData: () => new Float32Array(44100) }); }
    resume() { return Promise.resolve(); }
  },
  navigator: { clipboard: { writeText: (txt) => { mockWindow.lastCopied = txt; return Promise.resolve(); } } }
});

vm.runInContext(appJsCode, context);

// Wait for async init to finish
setTimeout(async () => {
  console.log('\n--- 2. Verifying First-Run Top Sites Auto-Import ---');
  const grid = elementRegistry['quick-links-grid'];
  assert(grid.children.length === 3, 'Grid populated with 3 auto-imported top sites');
  assert(grid.children[0].href === 'https://google.com', 'First shortcut is Google Search');
  assert(grid.children[1].href === 'https://github.com', 'Second shortcut is GitHub');
  assert(storageStore['quickLinks'] && storageStore['quickLinks'].length === 3, 'Quick links persisted to storage');

  console.log('\n--- 3. Testing Add Shortcut Flow ---');
  const addBtn = elementRegistry['quick-link-add-btn'];
  const dialog = elementRegistry['quick-link-dialog'];
  const form = elementRegistry['quick-link-form'];
  const titleInput = elementRegistry['quick-link-title-input'];
  const urlInput = elementRegistry['quick-link-url-input'];

  // Open dialog
  addBtn.dispatchEvent({ type: 'click' });
  assert(dialog.open === true, 'Clicking Add button opens modal');

  // Fill form
  titleInput.value = 'Notion';
  urlInput.value = 'notion.so'; // no protocol to test auto-prefix

  // Submit form
  form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
  await new Promise(r => setTimeout(r, 20));

  assert(dialog.open === false, 'Modal closed after submission');
  assert(grid.children.length === 4, 'Grid now has 4 items');
  const addedCard = grid.children[3];
  assert(addedCard.href === 'https://notion.so', 'URL auto-normalized to https://notion.so');
  assert(addedCard.title.includes('Notion'), 'Added item title matches Notion');

  console.log('\n--- 4. Testing Context Menu Actions (Edit & Delete) ---');
  const contextMenu = elementRegistry['quick-link-context-menu'];
  const addedId = addedCard.dataset.id;

  // Trigger right-click on Notion card
  addedCard.dispatchEvent({ type: 'contextmenu', preventDefault: () => {}, stopPropagation: () => {}, clientX: 200, clientY: 300 });
  assert(!contextMenu.classList.contains('hidden'), 'Context menu displayed on right click');

  // Trigger Edit action
  const editMenuItem = new MockElement('', 'button');
  editMenuItem.classList.add('context-menu-item');
  editMenuItem.dataset.action = 'edit';
  contextMenu.appendChild(editMenuItem);

  contextMenu.dispatchEvent({ type: 'click', target: editMenuItem });
  await new Promise(r => setTimeout(r, 20));

  assert(contextMenu.classList.contains('hidden'), 'Context menu hidden after action');
  assert(dialog.open === true, 'Edit opened shortcut modal');
  assert(titleInput.value === 'Notion', 'Title pre-filled with Notion');
  assert(urlInput.value === 'https://notion.so', 'URL pre-filled with https://notion.so');

  // Modify title and re-submit
  titleInput.value = 'Notion Workspace';
  form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
  await new Promise(r => setTimeout(r, 20));

  assert(grid.children[3].title.includes('Notion Workspace'), 'Card title updated in DOM');

  // Trigger Delete action via context menu
  grid.children[3].dispatchEvent({ type: 'contextmenu', preventDefault: () => {}, stopPropagation: () => {}, clientX: 200, clientY: 300 });
  const deleteMenuItem = new MockElement('', 'button');
  deleteMenuItem.classList.add('context-menu-item');
  deleteMenuItem.dataset.action = 'delete';
  contextMenu.appendChild(deleteMenuItem);

  contextMenu.dispatchEvent({ type: 'click', target: deleteMenuItem });
  await new Promise(r => setTimeout(r, 20));

  assert(grid.children.length === 3, 'Item removed from DOM after delete');
  assert(storageStore['quickLinks'].length === 3, 'Item removed from persistent storage');

  console.log('\n--- 5. Testing Settings Toggle & Re-Sync ---');
  const toggle = elementRegistry['settings-quick-links-toggle'];
  const section = elementRegistry['quick-links-section'];
  const resyncBtn = elementRegistry['resync-top-sites-btn'];

  // Turn off quick links in settings
  toggle.checked = false;
  toggle.dispatchEvent({ type: 'change', target: toggle });
  await new Promise(r => setTimeout(r, 20));

  assert(section.classList.contains('hidden'), 'Quick links section hidden when toggled off');
  assert(storageStore['showQuickLinks'] === false, 'showQuickLinks=false persisted in storage');

  // Turn back on
  toggle.checked = true;
  toggle.dispatchEvent({ type: 'change', target: toggle });
  await new Promise(r => setTimeout(r, 20));

  assert(!section.classList.contains('hidden'), 'Quick links section visible when toggled on');

  // Click Re-sync Top Sites
  resyncBtn.dispatchEvent({ type: 'click' });
  await new Promise(r => setTimeout(r, 20));

  assert(storageStore['quickLinks'].length === 3, 'Re-sync populated 3 sites from topSites');

  console.log('\n--- 6. Testing Max 8 Shortcuts & Add Button Hiding ---');
  // Add 5 more shortcuts to reach 8 total
  for (let i = 4; i <= 8; i++) {
    addBtn.dispatchEvent({ type: 'click' });
    titleInput.value = `Site ${i}`;
    urlInput.value = `https://example${i}.com`;
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    await new Promise(r => setTimeout(r, 10));
  }

  assert(grid.children.length === 8, 'Grid now has exactly 8 shortcuts');
  assert(addBtn.classList.contains('max-reached'), 'Add button has .max-reached class when 8 shortcuts reached');

  // Attempt to open dialog when 8 shortcuts are present
  dialog.open = false;
  addBtn.dispatchEvent({ type: 'click' });
  assert(dialog.open === false, 'Add dialog refuses to open when 8 shortcuts already exist');

  // Verify globe icon fallback is present in DOM
  const firstCard = grid.children[0];
  const globeContainer = firstCard.querySelector('.quick-link-globe-container');
  assert(globeContainer !== null, 'Card contains .quick-link-globe-container element for accurate globe fallback');

  console.log('\n--- 7. Testing Page Reload Persistence with 8 Shortcuts ---');
  // Verify storage has 8 shortcuts before reload
  assert(storageStore['quickLinks'].length === 8, 'Storage has 8 items before reload');

  // Create a fresh DOM sandbox simulating page reload with existing storageStore
  const reloadedGrid = new MockElement('quick-links-grid', 'div');
  const reloadedAddBtn = new MockElement('quick-link-add-btn', 'button');
  const reloadedSection = new MockElement('quick-links-section', 'section');
  const reloadedElements = Object.assign({}, elementRegistry, {
    'quick-links-grid': reloadedGrid,
    'quick-link-add-btn': reloadedAddBtn,
    'quick-links-section': reloadedSection
  });

  const reloadDoc = Object.assign({}, mockDocument, {
    getElementById: (id) => reloadedElements[id] || null
  });

  const reloadContext = vm.createContext({
    window: mockWindow,
    document: reloadDoc,
    chrome: mockChrome,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date,
    Math: Math,
    URL: URL,
    encodeURIComponent: encodeURIComponent,
    Audio: class { constructor() { this.src = ''; } },
    AudioContext: class {
      constructor() { this.currentTime = 0; this.state = 'running'; }
      createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {} }; }
      createOscillator() { return { frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
      createBuffer() { return { getChannelData: () => new Float32Array(10) }; }
      decodeAudioData() { return Promise.resolve({ numberOfChannels: 2, sampleRate: 44100, length: 44100, getChannelData: () => new Float32Array(44100) }); }
      resume() { return Promise.resolve(); }
    },
    navigator: { clipboard: { writeText: () => Promise.resolve() } }
  });

  vm.runInContext(appJsCode, reloadContext);

  await new Promise(r => setTimeout(r, 60));

  assert(reloadedGrid.children.length === 8, 'All 8 shortcuts successfully persisted and restored after reload');
  assert(reloadedAddBtn.classList.contains('max-reached'), 'Add button remains hidden after reload with 8 shortcuts');

  console.log('\n==============================================');
  console.log(`E2E SIMULATION RESULTS: ${passedTests} / ${totalTests} assertions passed.`);
  console.log('==============================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}, 50);
