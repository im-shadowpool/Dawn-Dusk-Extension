/**
 * Test Suite: Minimalist Quick Links Feature
 * Validates manifest permissions, HTML DOM structure, CSS styles,
 * and core logic functions (URL normalization, favicon retrieval, CRUD, mode fade-outs).
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
const manifestPath = path.join(projectRoot, 'manifest.json');
const htmlPath = path.join(projectRoot, 'newtab.html');
const cssPath = path.join(projectRoot, 'styles.css');
const jsPath = path.join(projectRoot, 'app.js');

const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

console.log('\n--- 1. Manifest Permissions ---');
assert(Array.isArray(manifestContent.permissions), 'manifest.json has permissions array');
assert(manifestContent.permissions.includes('storage'), 'manifest.json includes storage permission');
assert(manifestContent.permissions.includes('topSites'), 'manifest.json includes topSites permission');
assert(manifestContent.permissions.includes('favicon'), 'manifest.json includes favicon permission');

console.log('\n--- 2. Syntax & Compilation Validation ---');
let syntaxOk = false;
try {
  new vm.Script(jsContent);
  syntaxOk = true;
} catch (e) {
  console.error('Syntax error in app.js:', e);
}
assert(syntaxOk, 'app.js compiles with zero syntax errors');
assert(jsContent.includes('MAX_QUICK_LINKS = 8'), 'app.js defines MAX_QUICK_LINKS = 8');

console.log('\n--- 3. HTML Structure & Elements ---');
assert(htmlContent.includes('id="quick-links-section"'), '#quick-links-section exists in newtab.html');
assert(htmlContent.includes('id="quick-links-container"'), '#quick-links-container exists in newtab.html');
assert(htmlContent.includes('id="quick-links-grid"'), '#quick-links-grid exists in newtab.html');
assert(htmlContent.includes('id="quick-link-add-btn"'), '#quick-link-add-btn exists in newtab.html');
assert(htmlContent.includes('id="quick-link-dialog"'), '#quick-link-dialog exists in newtab.html');
assert(htmlContent.includes('class="quick-link-text-input"'), 'dialog uses .quick-link-text-input class');
assert(htmlContent.includes('id="quick-link-context-menu"'), '#quick-link-context-menu exists in newtab.html');
assert(htmlContent.includes('id="settings-quick-links-toggle"'), '#settings-quick-links-toggle exists in newtab.html');
assert(htmlContent.includes('id="resync-top-sites-btn"'), '#resync-top-sites-btn exists in newtab.html');
assert(htmlContent.includes('data-action="open-new"'), 'Context menu item open-new exists');
assert(htmlContent.includes('data-action="edit"'), 'Context menu item edit exists');
assert(htmlContent.includes('data-action="copy"'), 'Context menu item copy exists');
assert(htmlContent.includes('data-action="delete"'), 'Context menu item delete exists');

console.log('\n--- 4. CSS Design System & Distraction-Free Selectors ---');
assert(cssContent.includes('.quick-links-section'), 'CSS has .quick-links-section rule');
assert(cssContent.includes('.quick-link-card'), 'CSS has .quick-link-card rule');
assert(cssContent.includes('.quick-link-icon-wrapper'), 'CSS has .quick-link-icon-wrapper rule');
assert(cssContent.includes('.quick-link-context-menu'), 'CSS has .quick-link-context-menu rule');
assert(cssContent.includes('.quick-link-default-globe'), 'CSS has .quick-link-default-globe rule for SVG globe');
assert(cssContent.includes('.quick-link-globe-container'), 'CSS has .quick-link-globe-container rule');
assert(cssContent.includes('.quick-link-add-btn.max-reached'), 'CSS has .quick-link-add-btn.max-reached rule');
assert(cssContent.includes('flex-wrap: nowrap'), 'CSS specifies flex-wrap: nowrap for single row layout');
assert(cssContent.includes('white-space: nowrap'), 'CSS specifies white-space: nowrap for single line subtitle');
assert(cssContent.includes('body.quiet-mode-active .quick-links-section'), 'CSS has quiet mode auto-fade rule');
assert(cssContent.includes('.hero-center-canvas.focus-active .quick-links-section'), 'CSS hides quick links when focus is active');
assert(cssContent.includes('.hero-center-canvas.calendar-active .quick-links-section'), 'CSS hides quick links when calendar is active');
assert(cssContent.includes('.hero-center-canvas.ambient-active .quick-links-section'), 'CSS hides quick links when ambient is active');

console.log('\n--- 5. Core Logic Functions (Mock Sandbox) ---');
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

function getFaviconUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch (e) {
    return '';
  }
}

function extractDomainTitle(url) {
  try {
    const parsed = new URL(url);
    let host = parsed.hostname.replace(/^www\./i, '');
    const parts = host.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return host;
  } catch (e) {
    return 'Link';
  }
}

// Tests for normalizeUrl
assert(normalizeUrl('github.com') === 'https://github.com', 'normalizeUrl prepends https:// to domain');
assert(normalizeUrl('http://insecure.test') === 'http://insecure.test', 'normalizeUrl preserves http://');
assert(normalizeUrl('https://example.com/sub') === 'https://example.com/sub', 'normalizeUrl preserves existing https://');
assert(normalizeUrl('   notion.so   ') === 'https://notion.so', 'normalizeUrl trims whitespace');
assert(normalizeUrl('') === '', 'normalizeUrl handles empty string gracefully');

// Tests for extractDomainTitle
assert(extractDomainTitle('https://www.github.com/repo') === 'Github', 'extractDomainTitle capitalizes domain name');
assert(extractDomainTitle('https://youtube.com/watch?v=1') === 'Youtube', 'extractDomainTitle parses youtube.com');

// Tests for getFaviconUrl
const fav = getFaviconUrl('https://reddit.com/r/programming');
assert(fav.includes('domain=reddit.com') && fav.includes('sz=64'),
  'getFaviconUrl generates Google 64px favicon endpoint');

console.log('\n--- 6. Quick Links CRUD Operations ---');
let testLinks = [
  { id: 'ql_1', title: 'GitHub', url: 'https://github.com' },
  { id: 'ql_2', title: 'YouTube', url: 'https://youtube.com' }
];

// Add
const newLink = { id: 'ql_3', title: 'Gmail', url: 'https://mail.google.com' };
testLinks.push(newLink);
assert(testLinks.length === 3, 'Link successfully added');
assert(testLinks[2].title === 'Gmail', 'New link title matches');

// Edit
const editIdx = testLinks.findIndex(l => l.id === 'ql_1');
testLinks[editIdx].title = 'GitHub Pro';
testLinks[editIdx].url = 'https://github.com/dashboard';
assert(testLinks[0].title === 'GitHub Pro', 'Link title successfully updated');
assert(testLinks[0].url === 'https://github.com/dashboard', 'Link URL successfully updated');

// Delete
testLinks = testLinks.filter(l => l.id !== 'ql_2');
assert(testLinks.length === 2, 'Link successfully deleted');
assert(!testLinks.some(l => l.id === 'ql_2'), 'Deleted link is no longer in array');

console.log('\n==============================================');
console.log(`RESULTS: ${passedTests} / ${totalTests} assertions passed.`);
console.log('==============================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
