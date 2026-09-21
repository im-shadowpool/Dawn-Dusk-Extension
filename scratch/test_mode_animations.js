/**
 * Test Suite: Mode Shifting & Motion Animation Verification
 */
const fs = require('fs');
const path = require('path');

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

console.log('\n--- Mode Shifting Transition & Animation Integrity ---');
const projectRoot = 'c:/Users/vsaip/OneDrive/Desktop/projects/my-chrome-page';
const cssContent = fs.readFileSync(path.join(projectRoot, 'styles.css'), 'utf8');

// 1. Sliding Containers
assert(cssContent.includes('.timer-slide-container {') && 
       cssContent.includes('transition: max-height 450ms var(--md-sys-motion-easing-standard)'),
       '.timer-slide-container specifies 450ms max-height slide transition');

assert(cssContent.includes('.calendar-slide-container {') &&
       cssContent.includes('transform 420ms var(--md-sys-motion-easing-standard)'),
       '.calendar-slide-container specifies 420ms transform transition');

assert(cssContent.includes('.ambient-slide-container {') &&
       cssContent.includes('opacity 360ms var(--md-sys-motion-easing-standard)'),
       '.ambient-slide-container specifies 360ms opacity transition');

// 2. Settings Drawer Slide
assert(cssContent.includes('.settings-side-sheet {') &&
       cssContent.includes('transition: transform 340ms cubic-bezier(0.05, 0.7, 0.1, 1)'),
       '.settings-side-sheet specifies 340ms slide-over drawer transition');

// 3. Clock & Canvas Smooth Centering
assert(cssContent.includes('.time-display-container {') &&
       cssContent.includes('transition: margin-bottom 350ms var(--md-sys-motion-easing-standard)'),
       '.time-display-container transitions margin-bottom for smooth clock motion');

assert(cssContent.includes('.digital-time {') &&
       cssContent.includes('transition: font-size 350ms var(--md-sys-motion-easing-standard)'),
       '.digital-time transitions font-size smoothly on mode activation');

// 4. Center Canvas Greeting & Subtitle Fade
assert(cssContent.includes('.greeting-container {') &&
       cssContent.includes('transition: opacity 350ms var(--md-sys-motion-easing-standard)'),
       '.greeting-container transitions opacity smoothly');

assert(cssContent.includes('.greeting-subtitle {') &&
       cssContent.includes('transition: opacity 350ms var(--md-sys-motion-easing-standard)'),
       '.greeting-subtitle transitions opacity smoothly');

// 5. Verification that blanket color crossfade does NOT overwrite sliding wrappers
const crossfadeIdx = cssContent.indexOf('SMOOTH COLOR SCHEME & THEME CROSSFADE TRANSITION');
assert(crossfadeIdx !== -1, 'Theme crossfade section exists');
const crossfadeRule = cssContent.slice(crossfadeIdx);

assert(!crossfadeRule.includes('.timer-slide-container,'), 
       '.timer-slide-container is NOT overridden by blanket color transition');
assert(!crossfadeRule.includes('.calendar-slide-container,'), 
       '.calendar-slide-container is NOT overridden by blanket color transition');
assert(!crossfadeRule.includes('.ambient-slide-container,'), 
       '.ambient-slide-container is NOT overridden by blanket color transition');
assert(!crossfadeRule.includes('.settings-side-sheet,'), 
       '.settings-side-sheet is NOT overridden by blanket color transition');
assert(!crossfadeRule.includes('.hero-center-canvas,'), 
       '.hero-center-canvas is NOT overridden by blanket color transition');
assert(!crossfadeRule.includes('.tasks-dock-aside,'), 
       '.tasks-dock-aside is NOT overridden by blanket color transition');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
