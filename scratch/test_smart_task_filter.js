/**
 * Test Suite: Smart Default Task Filtering
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
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

let syntaxOk = false;
try {
  new vm.Script(appJsContent);
  syntaxOk = true;
} catch (e) {
  console.error('Syntax error in app.js:', e);
}
assert(syntaxOk, 'app.js compiles with zero syntax errors');

console.log('\n--- 2. Logic Verification: Default View Filtering ---');

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const now = new Date();
const todayKey = formatDateKey(now);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const yesterdayKey = formatDateKey(yesterday);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const threeDaysAgoKey = formatDateKey(threeDaysAgo);

const sampleTasks = [
  { id: 't_old_pending', text: 'Carry-over task from 3 days ago', completed: false, createdAt: threeDaysAgo.getTime(), dueDate: threeDaysAgoKey },
  { id: 't_yesterday_done', text: 'Task finished yesterday', completed: true, createdAt: yesterday.getTime(), completedAt: yesterday.getTime(), dueDate: yesterdayKey },
  { id: 't_today_active', text: 'Task created today', completed: false, createdAt: now.getTime(), dueDate: todayKey },
  { id: 't_today_done', text: 'Task created and done today', completed: true, createdAt: now.getTime(), completedAt: now.getTime(), dueDate: todayKey },
  { id: 't_old_done_today', text: 'Carry-over task finished today', completed: true, createdAt: threeDaysAgo.getTime(), completedAt: now.getTime(), dueDate: threeDaysAgoKey }
];

// Replicate filtering logic from updateTaskHeaderState
function filterDefaultTasks(tasks, selectedDate = null) {
  const todayKeyStr = formatDateKey(new Date());
  if (selectedDate) {
    return tasks.filter(t => {
      if (t.dueDate) return t.dueDate === selectedDate;
      const createdKey = formatDateKey(new Date(t.createdAt));
      return createdKey === selectedDate;
    });
  }

  return tasks.filter(t => {
    if (!t.completed) return true; // All unchecked tasks always stay visible

    const completedKey = t.completedAt ? formatDateKey(new Date(t.completedAt)) : null;
    const createdKey = t.createdAt ? formatDateKey(new Date(t.createdAt)) : null;
    const dueKey = t.dueDate || null;

    return completedKey === todayKeyStr || createdKey === todayKeyStr || dueKey === todayKeyStr;
  });
}

const defaultFiltered = filterDefaultTasks(sampleTasks, null);
const ids = defaultFiltered.map(t => t.id);

assert(ids.includes('t_old_pending'), 'Older pending task is visible in default view');
assert(ids.includes('t_today_active'), 'Today active task is visible in default view');
assert(ids.includes('t_today_done'), 'Today completed task is visible in default view');
assert(ids.includes('t_old_done_today'), 'Older task completed today is visible in default view as today achievement');
assert(!ids.includes('t_yesterday_done'), 'Past completed task from yesterday is cleanly hidden from default view');
assert(defaultFiltered.length === 4, 'Exactly 4 tasks shown in default view (1 past completed hidden)');

console.log('\n--- 3. Calendar Past Date View Verification ---');
const yesterdayFiltered = filterDefaultTasks(sampleTasks, yesterdayKey);
assert(yesterdayFiltered.length === 1 && yesterdayFiltered[0].id === 't_yesterday_done',
  'Clicking yesterday in calendar shows yesterday completed task');

const threeDaysFiltered = filterDefaultTasks(sampleTasks, threeDaysAgoKey);
assert(threeDaysFiltered.length === 2,
  'Clicking 3 days ago in calendar shows all tasks associated with that date (both pending and completed)');

console.log('\n--- 4. Clear Completed Scope Verification ---');

function clearCompleted(tasks, selectedDate = null) {
  if (selectedDate) {
    return tasks.filter(t => {
      const matchesDate = (t.dueDate === selectedDate) ||
        (formatDateKey(new Date(t.createdAt)) === selectedDate);
      return !(matchesDate && t.completed);
    });
  } else {
    const todayKeyStr = formatDateKey(new Date());
    return tasks.filter(t => {
      if (!t.completed) return true;
      const isToday = (t.completedAt && formatDateKey(new Date(t.completedAt)) === todayKeyStr) ||
                      (t.createdAt && formatDateKey(new Date(t.createdAt)) === todayKeyStr) ||
                      (t.dueDate === todayKeyStr);
      return !isToday;
    });
  }
}

const remainingAfterClearDefault = clearCompleted(sampleTasks, null);
const remainingIds = remainingAfterClearDefault.map(t => t.id);

assert(remainingIds.includes('t_old_pending'), 'Active older task kept after clear');
assert(remainingIds.includes('t_today_active'), 'Active today task kept after clear');
assert(remainingIds.includes('t_yesterday_done'), 'Past completed task kept in historical storage after clear in default view');
assert(!remainingIds.includes('t_today_done'), 'Today completed task cleared');
assert(!remainingIds.includes('t_old_done_today'), 'Older task completed today cleared from active list');

console.log('\n--- 5. toggleTaskCompleted completedAt Tracking in app.js ---');
assert(appJsContent.includes('task.completedAt = Date.now()'), 'toggleTaskCompleted tracks completedAt on completion');
assert(appJsContent.includes('delete task.completedAt'), 'toggleTaskCompleted cleans up completedAt on unchecking');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
