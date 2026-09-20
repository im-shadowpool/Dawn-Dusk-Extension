/**
 * Test Suite: Pure Dark Mode & Complete Removal of Light Mode
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

console.log('\n--- 1. Verification of Light Mode Complete Removal ---');
const projectRoot = 'c:/Users/vsaip/OneDrive/Desktop/projects/my-chrome-page';
const htmlPath = path.join(projectRoot, 'newtab.html');
const cssPath = path.join(projectRoot, 'styles.css');
const jsPath = path.join(projectRoot, 'app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// App.js syntax validation
let syntaxOk = false;
try {
  new vm.Script(jsContent);
  syntaxOk = true;
} catch (e) {
  console.error('Syntax error in app.js:', e);
}
assert(syntaxOk, 'app.js compiles with zero syntax errors');

// HTML: No color mode buttons or segmented controls
assert(!htmlContent.includes('id="mode-light-btn"'), '#mode-light-btn does not exist in newtab.html');
assert(!htmlContent.includes('id="mode-dark-btn"'), '#mode-dark-btn does not exist in newtab.html');
assert(!htmlContent.includes('id="mode-system-btn"'), '#mode-system-btn does not exist in newtab.html');
assert(!htmlContent.includes('mode-segmented-control'), '.mode-segmented-control does not exist in newtab.html');

// CSS: No light mode data-color-scheme overrides
assert(!cssContent.includes('html[data-color-scheme="light"]'), 'No html[data-color-scheme="light"] in styles.css');
assert(!cssContent.includes('--md-sys-color-surface: #faf8fd;'), 'No light mode surface token in styles.css');
assert(!cssContent.includes('data-color-scheme'), 'Zero data-color-scheme occurrences in styles.css');

// JS: No colorScheme state or applyColorScheme functions
assert(!jsContent.includes('colorScheme:'), 'No colorScheme state in app.js');
assert(!jsContent.includes('function applyColorScheme'), 'No applyColorScheme function in app.js');
assert(!jsContent.includes('function handleSystemThemeChange'), 'No handleSystemThemeChange function in app.js');
assert(!jsContent.includes('modeDarkBtn'), 'No modeDarkBtn reference in app.js');
assert(!jsContent.includes('modeLightBtn'), 'No modeLightBtn reference in app.js');

console.log('\n--- 2. Verification of Authentic Dark Mode Foundation ---');
assert(cssContent.includes('--md-sys-color-surface: #0e0f12;'), 'Authentic M3 dark surface token is active (#0e0f12)');
assert(cssContent.includes('--md-sys-color-on-surface: #e4e2e6;'), 'High-contrast dark on-surface token is active');
assert(cssContent.includes('--md-sys-color-surface-container-low: #141519;'), 'Dark container-low token is active');
assert(htmlContent.includes('data-theme="indigo"'), 'Default indigo accent theme active on root');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
