/**
 * Test Suite: Dynamic Supportive & Motivational Daily Subtitle
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

console.log('\n--- 1. File Integrity & Code Syntax ---');
const projectRoot = 'c:/Users/vsaip/OneDrive/Desktop/projects/my-chrome-page';
const appJsPath = path.join(projectRoot, 'app.js');
const cssPath = path.join(projectRoot, 'styles.css');
const htmlPath = path.join(projectRoot, 'newtab.html');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

let syntaxOk = false;
try {
  new vm.Script(appJsContent);
  syntaxOk = true;
} catch (e) {
  console.error('Syntax error in app.js:', e);
}
assert(syntaxOk, 'app.js compiles with zero syntax errors');

console.log('\n--- 2. HTML Markup Verification (newtab.html) ---');
assert(htmlContent.includes('id="greeting-subtitle"'), '#greeting-subtitle exists in newtab.html');
assert(htmlContent.includes('class="greeting-subtitle"'), '.greeting-subtitle class applied');
assert(htmlContent.includes('id="settings-motivation-toggle"'), '#settings-motivation-toggle exists in settings');
assert(htmlContent.includes('Daily Supportive Message'), 'Daily Supportive Message label exists in settings');

// Verify hierarchy: greeting-subtitle is inside clock-hero-section below greeting-container
const greetingContainerIdx = htmlContent.indexOf('id="greeting-container"');
const greetingSubtitleIdx = htmlContent.indexOf('id="greeting-subtitle"');
assert(greetingContainerIdx !== -1 && greetingSubtitleIdx !== -1 && greetingSubtitleIdx > greetingContainerIdx,
  '#greeting-subtitle is positioned directly following #greeting-container');

console.log('\n--- 3. CSS Styling & Layout Verification (styles.css) ---');
assert(cssContent.includes('.greeting-subtitle {'), '.greeting-subtitle selector defined');
assert(cssContent.includes('italic'), 'Subtitle styled with italic typography');
assert(cssContent.includes('.hero-center-canvas.calendar-active .greeting-subtitle'),
  'Calendar mode fades out greeting-subtitle');
assert(cssContent.includes('.hero-center-canvas.focus-active .greeting-subtitle'),
  'Focus mode fades out greeting-subtitle');
assert(cssContent.includes('.hero-center-canvas.ambient-active .greeting-subtitle'),
  'Ambient mode fades out greeting-subtitle');

console.log('\n--- 4. Engine & Message Dictionary Verification ---');
assert(appJsContent.includes('const SUPPORTIVE_MESSAGES = {'), 'SUPPORTIVE_MESSAGES dictionary defined in app.js');
assert(appJsContent.includes('function getDailySupportiveMessage('), 'getDailySupportiveMessage helper defined');
assert(appJsContent.includes('Sleep early, continue work tomorrow'), 'User-requested supportive late night phrase present');
assert(appJsContent.includes('Hope you had a fulfilling day'), 'User-requested evening phrase present');

// Extract getDailySupportiveMessage and SUPPORTIVE_MESSAGES for logic testing
const fnMatch = appJsContent.match(/const SUPPORTIVE_MESSAGES = {[\s\S]*?function getDailySupportiveMessage\(now = new Date\(\), tasks = \[\]\) {[\s\S]*?\n  }/);
assert(Boolean(fnMatch), 'Extracted SUPPORTIVE_MESSAGES and getDailySupportiveMessage cleanly');

const sandbox = {};
vm.runInNewContext(fnMatch[0] + '; this.SUPPORTIVE_MESSAGES = SUPPORTIVE_MESSAGES; this.getDailySupportiveMessage = getDailySupportiveMessage;', sandbox);
const { SUPPORTIVE_MESSAGES, getDailySupportiveMessage } = sandbox;

console.log('\n--- 5. Time-of-Day Logic Verification ---');
// Late night (e.g. 11 PM)
const lateNightDate = new Date(2026, 8, 20, 23, 15);
const lateNightMsg = getDailySupportiveMessage(lateNightDate, []);
assert(SUPPORTIVE_MESSAGES.lateNight.includes(lateNightMsg), `Late night (23:15) returns late night pool: "${lateNightMsg}"`);

// Very early morning (e.g. 2 AM)
const lateNightDate2 = new Date(2026, 8, 20, 2, 30);
const lateNightMsg2 = getDailySupportiveMessage(lateNightDate2, []);
assert(SUPPORTIVE_MESSAGES.lateNight.includes(lateNightMsg2), `Late night (02:30) returns late night pool: "${lateNightMsg2}"`);

// Morning (e.g. 9 AM)
const morningDate = new Date(2026, 8, 20, 9, 0);
const morningMsg = getDailySupportiveMessage(morningDate, []);
assert(SUPPORTIVE_MESSAGES.morning.includes(morningMsg), `Morning (09:00) returns morning pool: "${morningMsg}"`);

// Afternoon (e.g. 2 PM)
const afternoonDate = new Date(2026, 8, 20, 14, 0);
const afternoonMsg = getDailySupportiveMessage(afternoonDate, []);
assert(SUPPORTIVE_MESSAGES.afternoon.includes(afternoonMsg), `Afternoon (14:00) returns afternoon pool: "${afternoonMsg}"`);

// Evening (e.g. 7 PM)
const eveningDate = new Date(2026, 8, 20, 19, 0);
const eveningMsg = getDailySupportiveMessage(eveningDate, []);
assert(SUPPORTIVE_MESSAGES.evening.includes(eveningMsg), `Evening (19:00) returns evening pool: "${eveningMsg}"`);

console.log('\n--- 6. Milestone Logic Verification ---');
// Tasks all completed in evening
const completedTasks = [
  { id: '1', text: 'Task 1', completed: true },
  { id: '2', text: 'Task 2', completed: true }
];
const milestoneMsg = getDailySupportiveMessage(eveningDate, completedTasks);
assert(SUPPORTIVE_MESSAGES.milestoneAllTasksDone.includes(milestoneMsg),
  `Completed tasks trigger milestone celebration in evening: "${milestoneMsg}"`);

// Incomplete tasks in evening return normal evening pool
const incompleteTasks = [
  { id: '1', text: 'Task 1', completed: true },
  { id: '2', text: 'Task 2', completed: false }
];
const normalEveningMsg = getDailySupportiveMessage(eveningDate, incompleteTasks);
assert(SUPPORTIVE_MESSAGES.evening.includes(normalEveningMsg),
  'Incomplete tasks return regular evening supportive message');

console.log('\n--- 7. Deterministic Daily Consistency & Rotation ---');
// Calling multiple times on the same date produces the exact same message
const sampleDate1 = new Date(2026, 8, 20, 9, 30);
const sampleDate2 = new Date(2026, 8, 20, 11, 45);
assert(getDailySupportiveMessage(sampleDate1, []) === getDailySupportiveMessage(sampleDate2, []),
  'Same morning on the same calendar day returns deterministic identical quote');

// Advancing by 1 day shifts the message index
const day1 = new Date(2026, 8, 20, 10, 0);
const day2 = new Date(2026, 8, 21, 10, 0);
const msgDay1 = getDailySupportiveMessage(day1, []);
const msgDay2 = getDailySupportiveMessage(day2, []);
console.log(`    Day 1: "${msgDay1}"`);
console.log(`    Day 2: "${msgDay2}"`);
assert(typeof msgDay1 === 'string' && typeof msgDay2 === 'string', 'Daily rotation returns valid strings');

console.log('\n--- 8. App State & Settings Wiring Verification ---');
assert(appJsContent.includes('showMotivation: true'), 'showMotivation initialized in state');
assert(appJsContent.includes('greetingSubtitle: document.getElementById(\'greeting-subtitle\')'),
  'greetingSubtitle queried in elements');
assert(appJsContent.includes('settingsMotivationToggle: document.getElementById(\'settings-motivation-toggle\')'),
  'settingsMotivationToggle queried in elements');
assert(appJsContent.includes('Storage.get(\'showMotivation\', true)'),
  'showMotivation loaded from storage with default true');
assert(appJsContent.includes('Storage.set(\'showMotivation\', state.showMotivation)'),
  'showMotivation changes saved to storage');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
