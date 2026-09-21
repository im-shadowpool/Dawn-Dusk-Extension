/**
 * Master test runner executing all test suites
 */
const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  'test_editable_presets.js',
  'test_dark_mode_only.js',
  'test_greeting_subtitle.js',
  'test_mode_animations.js',
  'test_smart_task_filter.js',
  'test_seamless_rain_loop.js',
  'test_quick_links.js',
  'test_e2e_quick_links.js',
  'test_zen_mode.js',
  'test_e2e_zen_mode.js',
  'test_zen_exit_animation.js'
];

let totalPassed = 0;
let totalFailed = 0;

console.log('==============================================');
console.log('RUNNING COMPLETE TEST SUITE');
console.log('==============================================');

tests.forEach(testFile => {
  console.log(`\n>>> Executing: ${testFile}`);
  const result = spawnSync('node', [path.join(__dirname, testFile)], {
    stdio: 'inherit',
    encoding: 'utf8'
  });
  if (result.status === 0) {
    totalPassed++;
  } else {
    totalFailed++;
  }
});

console.log('\n==============================================');
console.log(`FINAL RESULTS: ${totalPassed} suites passed, ${totalFailed} suites failed.`);
console.log('==============================================');

if (totalFailed > 0) {
  process.exit(1);
}
