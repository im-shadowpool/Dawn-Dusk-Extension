/**
 * Test Suite: Zen Mode Exit Animation Consistency & Fluidity
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: Zen Mode Exit Animation ---');

const cssPath = path.join(__dirname, '..', 'styles.css');
const jsPath = path.join(__dirname, '..', 'app.js');

const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// 1. Base .top-bar must have transform in transition and explicit translateY(0)
console.log('1. Verifying .top-bar exit transition...');
const topBarMatch = css.match(/\.top-bar\s*\{([^}]+)\}/);
assert(topBarMatch, 'Missing .top-bar definition in styles.css');
const topBarBody = topBarMatch[1];
assert(topBarBody.includes('transform: translateY(0)'), '.top-bar must have baseline transform: translateY(0)');
assert(topBarBody.includes('transform 600ms'), '.top-bar must have transform transition (600ms)');
assert(topBarBody.includes('opacity 600ms'), '.top-bar must have opacity transition (600ms)');
console.log('   ✓ .top-bar has symmetrical 600ms entry and exit transitions.');

// 2. Base .quick-links-section must have transform in transition and explicit translateY(0)
console.log('2. Verifying .quick-links-section exit transition...');
const qlMatch = css.match(/(?:^|\n)\.quick-links-section\s*\{([^}]+)\}/);
assert(qlMatch, 'Missing .quick-links-section definition in styles.css');
const qlBody = qlMatch[1];
assert(qlBody.includes('transform: translateY(0)'), '.quick-links-section must have baseline transform: translateY(0)');
assert(qlBody.includes('transform 600ms'), '.quick-links-section must have transform transition (600ms)');
assert(qlBody.includes('opacity 600ms'), '.quick-links-section must have opacity transition (600ms)');
console.log('   ✓ .quick-links-section has symmetrical 600ms entry and exit transitions.');

// 3. Base .tasks-dock-aside must have transform in transition, translateX(0), and opacity 600ms
console.log('3. Verifying .tasks-dock-aside exit transition...');
const tasksMatch = css.match(/\.tasks-dock-aside\s*\{([^}]+)\}/);
assert(tasksMatch, 'Missing .tasks-dock-aside definition in styles.css');
const tasksBody = tasksMatch[1];
assert(tasksBody.includes('transform: translateX(0)'), '.tasks-dock-aside must have baseline transform: translateX(0)');
assert(tasksBody.includes('transform 600ms'), '.tasks-dock-aside must have transform transition (600ms)');
assert(tasksBody.includes('opacity 600ms'), '.tasks-dock-aside must have opacity transition (600ms)');
console.log('   ✓ .tasks-dock-aside has symmetrical 600ms entry and exit transitions.');

// 4. Base .hero-center-canvas must have translateX(0)
console.log('4. Verifying .hero-center-canvas exit transition...');
const heroMatch = css.match(/\.hero-center-canvas\s*\{([^}]+)\}/);
assert(heroMatch, 'Missing .hero-center-canvas definition in styles.css');
const heroBody = heroMatch[1];
assert(heroBody.includes('transform: translateX(0)'), '.hero-center-canvas must have baseline transform: translateX(0)');
assert(heroBody.includes('transform 600ms'), '.hero-center-canvas must have transform transition (600ms)');
console.log('   ✓ .hero-center-canvas has symmetrical 600ms entry and exit transitions.');

// 5. Base .digital-time must have scale(1)
console.log('5. Verifying .digital-time exit transition...');
const timeMatch = css.match(/\.digital-time\s*\{([^}]+)\}/);
assert(timeMatch, 'Missing .digital-time definition in styles.css');
const timeBody = timeMatch[1];
assert(timeBody.includes('transform: scale(1)'), '.digital-time must have baseline transform: scale(1)');
assert(timeBody.includes('transform 600ms'), '.digital-time must have transform transition (600ms)');
console.log('   ✓ .digital-time has symmetrical 600ms entry and exit transitions.');

// 6. Check for duplicate Zen Mode blocks
console.log('6. Checking for duplicate Zen Mode blocks in styles.css...');
const zenMatches = (css.match(/body\.zen-mode-active\s*\.top-bar/g) || []).length;
assert.strictEqual(zenMatches, 1, `Expected exactly 1 definition for body.zen-mode-active .top-bar, found ${zenMatches}`);
console.log('   ✓ Exactly 1 authoritative Zen Mode CSS block exists.');

// 7. Check click-anywhere exit handler in app.js
console.log('7. Verifying app.js click-anywhere exit handler and stop propagation...');
assert(js.includes("window.addEventListener('click'"), 'Missing window click listener');
assert(js.includes('if (state.isZenActive)'), 'Window click listener must check state.isZenActive');
assert(js.includes('toggleZenMode(false)'), 'Click-anywhere must trigger toggleZenMode(false)');
assert(js.includes('e.stopPropagation()'), 'Zen toggle button must stop propagation');
console.log('   ✓ Click-anywhere exit handler cleanly exits Zen Mode smoothly.');

console.log('\nALL ZEN MODE EXIT ANIMATION TESTS PASSED! 🎉');
