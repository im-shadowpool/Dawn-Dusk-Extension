/**
 * Test Suite: Zen Mode (Distraction-Free Immersion & Clock Trigger)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: Zen Mode ---');

const htmlPath = path.join(__dirname, '..', 'newtab.html');
const cssPath = path.join(__dirname, '..', 'styles.css');
const jsPath = path.join(__dirname, '..', 'app.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// 1. HTML Verification
console.log('1. Verifying newtab.html components...');

// Top bar Zen pill removed per user request
assert(!html.includes('id="zen-toggle-btn"'), 'Top bar #zen-toggle-btn should be removed from newtab.html');
assert(!html.includes('class="zen-toggle-btn"'), 'class .zen-toggle-btn should be removed from newtab.html');

// #digital-clock is interactive trigger
assert(html.includes('id="digital-clock"'), 'Missing #digital-clock in newtab.html');
assert(html.includes('title="Click to enter Zen Mode (Z)"'), 'Missing title tooltip on #digital-clock');
assert(html.includes('role="button"'), 'Missing role="button" on #digital-clock');
assert(html.includes('tabindex="0"'), 'Missing tabindex="0" on #digital-clock');

// Floating exit chip removed per user requirement (replaced with click anywhere)
assert(!html.includes('id="zen-floating-exit-wrapper"'), 'Floating exit wrapper should be removed from newtab.html');
assert(!html.includes('id="exit-zen-btn"'), 'Floating exit button should be removed from newtab.html');

// Shortcuts dialog documents Z and Esc for Zen Mode
assert(html.includes('>Z<'), 'Missing Z key badge in shortcuts dialog');
assert(html.includes('Toggle Zen Mode'), 'Missing Toggle Zen Mode description in shortcuts dialog');
assert(html.includes('Exit Zen'), 'Missing Exit Zen description in shortcuts dialog');

console.log('   ✓ HTML components present and verified.');

// 2. CSS Verification
console.log('2. Verifying styles.css rules...');

assert(!css.includes('.zen-toggle-btn'), 'Old .zen-toggle-btn styling should be removed from styles.css');
assert(css.includes('.digital-time {\n  font-family: var(--font-display);'), 'Missing .digital-time styling');
assert(css.includes('cursor: pointer;'), 'Missing cursor: pointer on .digital-time');
assert(css.includes('body.zen-mode-active .top-bar'), 'Missing body.zen-mode-active .top-bar rule');
assert(css.includes('body.zen-mode-active .quick-links-section'), 'Missing body.zen-mode-active .quick-links-section rule');
assert(css.includes('body.zen-mode-active .tasks-dock-aside'), 'Missing body.zen-mode-active .tasks-dock-aside rule');
assert(css.includes('translateX(calc(100% + 80px))'), 'Tasks dock should translate sideways off-screen');
assert(css.includes('body.zen-mode-active .hero-center-canvas'), 'Missing body.zen-mode-active .hero-center-canvas rule');
assert(css.includes('translateX(214px)'), 'Hero canvas should translate 214px to center horizontally');
assert(css.includes('body.zen-mode-active {\n  cursor: pointer;\n}'), 'Missing body.zen-mode-active cursor: pointer');
assert(!css.includes('.zen-floating-exit-wrapper {'), 'Floating exit wrapper styling should be removed');
assert(!css.includes('.zen-floating-exit-btn {'), 'Floating exit button styling should be removed');
assert(css.includes('body.zen-mode-active .digital-time'), 'Missing body.zen-mode-active .digital-time scale/glow rule');

// Responsive check
assert(css.includes('body.zen-mode-active .hero-center-canvas'), 'Missing responsive hero-center-canvas rule');

console.log('   ✓ CSS styles, keyframes, transitions, and media queries verified.');

// 3. JavaScript Verification
console.log('3. Verifying app.js logic...');

assert(js.includes('isZenActive: false'), 'Missing isZenActive in state');
assert(js.includes("digitalClock: document.getElementById('digital-clock')"), 'Missing digitalClock in elements');
assert(!js.includes("zenToggleBtn: document.getElementById('zen-toggle-btn')"), 'zenToggleBtn should be removed from elements');
assert(!js.includes("exitZenBtn: document.getElementById('exit-zen-btn')"), 'exitZenBtn should be removed from elements');
assert(!js.includes("zenFloatingExitWrapper: document.getElementById('zen-floating-exit-wrapper')"), 'zenFloatingExitWrapper should be removed from elements');
assert(js.includes('function toggleZenMode('), 'Missing toggleZenMode function');
assert(!js.includes('function showZenExitBtnTemporarily('), 'showZenExitBtnTemporarily should be removed');
assert(js.includes("document.body.classList.toggle('zen-mode-active', nextActive)"), 'Missing body zen-mode-active class toggling');
assert(js.includes("elements.digitalClock.addEventListener('click'"), 'Missing click listener on digitalClock');
assert(js.includes("e.stopPropagation()"), 'digitalClock click listener should call e.stopPropagation()');

// Click anywhere on screen exits Zen mode
assert(js.includes("window.addEventListener('click'"), 'Missing window click listener for click-anywhere Zen exit');
assert(js.includes("if (state.isZenActive) {\n        toggleZenMode(false);"), 'Missing click-anywhere exit handler check');

// Keyboard shortcut checks
assert(js.includes("e.key === 'z' || e.key === 'Z'"), 'Missing Z key shortcut handler');
assert(js.includes("if (state.isZenActive) {\n          toggleZenMode(false);"), 'Missing Escape key handler to exit Zen mode');

// Mutual exclusivity & clean exit
assert(js.includes('if (state.isZenActive) toggleZenMode(false);'), 'Opening other modes or settings should cleanly exit Zen mode');

console.log('   ✓ JavaScript state, functions, shortcuts, and event listeners verified.');

console.log('\nALL ZEN MODE TESTS PASSED! 🎉');
