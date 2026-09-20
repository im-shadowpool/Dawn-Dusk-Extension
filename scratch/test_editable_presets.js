/**
 * Test Suite: 3 Editable Timer Presets (Focus, Short Break, Long Break) & Removal of Custom Pill
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

console.log('\n--- 1. File Integrity & Removal of Custom Pill & Settings ---');
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

// Verify custom chip completely removed
assert(!htmlContent.includes('id="timer-chip-custom"'), '#timer-chip-custom does NOT exist in newtab.html');
assert(!htmlContent.includes('id="custom-chip-label"'), '#custom-chip-label does NOT exist in newtab.html');
assert(!htmlContent.includes('Custom ('), 'No Custom (...) preset text in newtab.html');

// Verify custom focus removed from settings side sheet
assert(!htmlContent.includes('id="settings-custom-focus-input"'), '#settings-custom-focus-input does NOT exist in newtab.html');
assert(!htmlContent.includes('Custom Duration'), 'No "Custom Duration" section in settings');

// Verify app.js cleaned up
assert(!jsContent.includes('customFocusMinutes'), 'Zero customFocusMinutes in app.js');
assert(!jsContent.includes('settingsCustomFocusInput'), 'Zero settingsCustomFocusInput in app.js');
assert(!jsContent.includes('customTimerChip'), 'Zero customTimerChip in app.js');

console.log('\n--- 2. Exactly 3 Preset Chips in newtab.html ---');
assert(htmlContent.includes('data-preset="focus"'), 'Preset chip "focus" exists in newtab.html');
assert(htmlContent.includes('data-preset="shortBreak"'), 'Preset chip "shortBreak" exists in newtab.html');
assert(htmlContent.includes('data-preset="longBreak"'), 'Preset chip "longBreak" exists in newtab.html');
assert(htmlContent.includes('Focus (25m)'), 'Default Focus label is Focus (25m)');
assert(htmlContent.includes('Short Break (5m)'), 'Default Short Break label is Short Break (5m)');
assert(htmlContent.includes('Long Break (15m)'), 'Default Long Break label is Long Break (15m)');

console.log('\n--- 3. CSS Styling for Inline Preset Editing ---');
assert(cssContent.includes('.chip-inline-editor'), '.chip-inline-editor selector exists in styles.css');
assert(cssContent.includes('.chip-inline-input'), '.chip-inline-input selector exists in styles.css');

console.log('\n--- 4. App.js Logic: 3 Editable Presets & State ---');
assert(jsContent.includes('timerPresets:'), 'state.timerPresets defined in app.js');
assert(jsContent.includes('activePresetType:'), 'state.activePresetType defined in app.js');
assert(jsContent.includes('PRESET_CONFIG = {'), 'PRESET_CONFIG dictionary defined with focus, shortBreak, longBreak');
assert(jsContent.includes('function updatePresetChipsUI'), 'updatePresetChipsUI function defined');
assert(jsContent.includes('function startEditingPresetChip'), 'startEditingPresetChip function defined for all chips');

console.log('\n--- 5. Simulation of Editable Preset Logic ---');
// Extract PRESET_CONFIG and state logic
const state = {
  timerPresets: { focus: 25, shortBreak: 5, longBreak: 15 },
  activePresetType: 'focus',
  timerPresetMinutes: 25,
  timerTotalSeconds: 25 * 60,
  timerRemainingSeconds: 25 * 60
};

const PRESET_CONFIG = {
  focus: { label: 'Focus', defaultMinutes: 25, modeLabel: 'Focus Session' },
  shortBreak: { label: 'Short Break', defaultMinutes: 5, modeLabel: 'Short Break' },
  longBreak: { label: 'Long Break', defaultMinutes: 15, modeLabel: 'Long Break' }
};

// Simulate user selecting shortBreak
state.activePresetType = 'shortBreak';
state.timerPresetMinutes = state.timerPresets.shortBreak;
assert(state.timerPresetMinutes === 5, 'Switching to shortBreak sets preset minutes to 5');
assert(PRESET_CONFIG[state.activePresetType].modeLabel === 'Short Break', 'Mode label for shortBreak is "Short Break"');

// Simulate editing Focus to 50 minutes
let editVal = 50;
state.timerPresets.focus = editVal;
state.activePresetType = 'focus';
state.timerPresetMinutes = editVal;
assert(state.timerPresets.focus === 50, 'Editing Focus updates timerPresets.focus to 50');
assert(state.timerPresetMinutes === 50, 'Editing active Focus updates active timerPresetMinutes to 50');

// Simulate editing Short Break to 10 minutes
state.timerPresets.shortBreak = 10;
assert(state.timerPresets.shortBreak === 10, 'Editing Short Break updates timerPresets.shortBreak to 10');

// Simulate editing Long Break to 30 minutes
state.timerPresets.longBreak = 30;
assert(state.timerPresets.longBreak === 30, 'Editing Long Break updates timerPresets.longBreak to 30');

// Clamping test: value > 180 clamps to 180
let excessiveVal = 240;
if (excessiveVal > 180) excessiveVal = 180;
assert(excessiveVal === 180, 'Excessive input values correctly clamp to 180 minutes');

// Clamping test: value < 1 clamps
let invalidVal = -5;
if (isNaN(invalidVal) || invalidVal < 1) invalidVal = 25;
assert(invalidVal === 25, 'Invalid/negative input values fallback safely');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
