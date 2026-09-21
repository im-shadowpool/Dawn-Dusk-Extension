/**
 * E2E Functional Test Suite for Zen Mode
 * Validates entering via clock click, clicking anywhere to exit, keyboard shortcuts, and state transitions
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
    passedTests++;
  }
}

// Mock browser environment
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(cls) { this.classes.add(cls); }
  remove(cls) { this.classes.delete(cls); }
  toggle(cls, force) {
    if (force !== undefined) {
      if (force) this.classes.add(cls);
      else this.classes.delete(cls);
      return force;
    }
    if (this.classes.has(cls)) {
      this.classes.delete(cls);
      return false;
    }
    this.classes.add(cls);
    return true;
  }
  contains(cls) { return this.classes.has(cls); }
}

class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList();
    this.attributes = {};
    this.style = {};
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
    return Array.from(this.classList.classes).join(' ');
  }

  set className(val) {
    this.classList.classes.clear();
    if (typeof val === 'string') {
      val.trim().split(/\s+/).forEach(c => { if (c) this.classList.add(c); });
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

  contains(target) {
    if (this === target) return true;
    for (const c of this.children) {
      if (c.contains && c.contains(target)) return true;
    }
    return false;
  }

  click() {
    let stopped = false;
    const evt = {
      target: this,
      preventDefault: () => {},
      stopPropagation: () => { stopped = true; }
    };
    if (this.listeners['click']) {
      this.listeners['click'].forEach(cb => cb(evt));
    }
    if (!stopped && mockWindow.triggerEvent) {
      mockWindow.triggerEvent('click', evt);
    }
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
      const el = new MockElement('', 'div');
      el.classList.add(cls);
      this.children.push(el);
      return el;
    }
    const el = new MockElement('', 'span');
    this.children.push(el);
    return el;
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

const ids = [
  'focus-toggle-btn', 'clock-view', 'digital-clock', 'timer-view', 'timer-slide-container',
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
  'quick-links-section', 'quick-links-container', 'quick-links-grid', 'quick-link-add-btn',
  'quick-link-dialog', 'quick-link-dialog-title', 'close-quick-link-dialog-btn',
  'quick-link-form', 'quick-link-title-input', 'quick-link-url-input',
  'cancel-quick-link-btn', 'quick-link-context-menu', 'settings-quick-links-toggle',
  'resync-top-sites-btn'
];

ids.forEach(id => getOrCreateMockEl(id));

const mockDoc = {
  body: new MockElement('body', 'body'),
  documentElement: new MockElement('html', 'html'),
  getElementById(id) {
    return getOrCreateMockEl(id);
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return new MockElement('', sel.replace(/[^a-zA-Z0-9_-]/g, ''));
  },
  querySelectorAll() { return []; },
  createElement(tag) { return new MockElement('', tag); },
  activeElement: null
};
mockDoc.activeElement = mockDoc.body;

const windowListeners = {};
const mockWindow = {
  document: mockDoc,
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] !== undefined ? this.data[k] : null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  addEventListener(type, cb) {
    if (!windowListeners[type]) windowListeners[type] = [];
    windowListeners[type].push(cb);
  },
  triggerEvent(type, eventObj = {}) {
    if (windowListeners[type]) {
      windowListeners[type].forEach(cb => cb(eventObj));
    }
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  AudioContext: class {
    constructor() {
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
    }
    resume() { return Promise.resolve(); }
    createOscillator() { return { type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  },
  Date: Date,
  console: console
};

const sandbox = {
  window: mockWindow,
  document: mockDoc,
  localStorage: mockWindow.localStorage,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  AudioContext: mockWindow.AudioContext,
  Date: Date,
  console: console
};

vm.createContext(sandbox);

const jsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

console.log('--- 1. Initializing Application in Sandboxed DOM ---');
try {
  vm.runInContext(jsCode, sandbox);
  assert(true, 'app.js successfully parsed and executed in sandbox');
} catch (e) {
  assert(false, `Execution failed: ${e.message}\n${e.stack}`);
}

setTimeout(() => {
  const digitalClock = mockDoc.getElementById('digital-clock');

  console.log('\n--- 2. Testing Zen Mode Activation via Digital Clock Click ---');
  assert(!mockDoc.body.classList.contains('zen-mode-active'), 'Initially, body should NOT have zen-mode-active');
  assert(digitalClock.getAttribute('aria-pressed') !== 'true', 'Initially, #digital-clock is not aria-pressed="true"');

  // Click Digital Clock (should activate without immediately exiting)
  digitalClock.click();
  assert(mockDoc.body.classList.contains('zen-mode-active'), 'Clicking #digital-clock adds zen-mode-active to body');
  assert(digitalClock.getAttribute('aria-pressed') === 'true', '#digital-clock has aria-pressed="true"');

  console.log('\n--- 3. Testing Click-Anywhere to Exit Zen Mode ---');
  // Clicking anywhere on window / screen exits Zen mode
  mockWindow.triggerEvent('click', { target: mockDoc.body });
  assert(!mockDoc.body.classList.contains('zen-mode-active'), 'Clicking screen removes zen-mode-active from body');
  assert(digitalClock.getAttribute('aria-pressed') === 'false', '#digital-clock has aria-pressed="false"');

  console.log('\n--- 4. Testing Keyboard Shortcut "Z" Toggle ---');
  // Press 'z' key
  mockWindow.triggerEvent('keydown', { key: 'z', preventDefault: () => {} });
  assert(mockDoc.body.classList.contains('zen-mode-active'), 'Pressing "z" activates Zen Mode');
  assert(digitalClock.getAttribute('aria-pressed') === 'true', '#digital-clock is active after "z" keypress');

  // Press 'Z' capital key
  mockWindow.triggerEvent('keydown', { key: 'Z', preventDefault: () => {} });
  assert(!mockDoc.body.classList.contains('zen-mode-active'), 'Pressing "Z" toggles Zen Mode off');

  console.log('\n--- 5. Testing Keyboard Shortcut "Escape" Exit ---');
  // Enter Zen mode with 'z'
  mockWindow.triggerEvent('keydown', { key: 'z', preventDefault: () => {} });
  assert(mockDoc.body.classList.contains('zen-mode-active'), 'Re-entered Zen Mode');

  // Press Escape
  mockWindow.triggerEvent('keydown', { key: 'Escape', preventDefault: () => {} });
  assert(!mockDoc.body.classList.contains('zen-mode-active'), 'Pressing "Escape" exits Zen Mode');

  console.log('\n--- 6. Testing Digital Clock Click to Exit Zen Mode ---');
  // Enter Zen mode via clock
  digitalClock.click();
  assert(mockDoc.body.classList.contains('zen-mode-active'), 'In Zen Mode');
  // Click clock again while in Zen mode
  digitalClock.click();
  assert(!mockDoc.body.classList.contains('zen-mode-active'), 'Clicking clock again exits Zen Mode');

  console.log('\n--- 7. Testing Mutual Exclusivity with Focus and Settings ---');
  // Enter Zen Mode via clock
  digitalClock.click();
  assert(mockDoc.body.classList.contains('zen-mode-active'), 'In Zen Mode');

  // While in Zen Mode, clicking Focus Toggle Button
  const focusToggleBtn = mockDoc.getElementById('focus-toggle-btn');
  focusToggleBtn.click();
  assert(!mockDoc.body.classList.contains('zen-mode-active'), 'Activating Focus Mode exits Zen Mode');
  assert(focusToggleBtn.classList.contains('active'), 'Focus Mode is active');

  // Re-enter Zen Mode via clock
  digitalClock.click();
  assert(mockDoc.body.classList.contains('zen-mode-active'), 'Zen Mode active again');
  assert(!focusToggleBtn.classList.contains('active'), 'Focus Mode closed upon entering Zen Mode');

  // Open settings
  const settingsBtn = mockDoc.getElementById('settings-btn');
  settingsBtn.click();
  assert(!mockDoc.body.classList.contains('zen-mode-active'), 'Opening settings exits Zen Mode');

  console.log('\n==============================================');
  console.log(`E2E ZEN MODE RESULTS: ${passedTests} / ${totalTests} assertions passed.`);
  console.log('==============================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}, 50);
