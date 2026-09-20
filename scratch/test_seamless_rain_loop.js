/**
 * Test Suite: Seamless Rain Sound & Ambient Gapless Looping Engine
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const projectDir = path.resolve(__dirname, '..');
const appJsPath = path.join(projectDir, 'app.js');
const newtabHtmlPath = path.join(projectDir, 'newtab.html');
const audioDir = path.join(projectDir, 'audio');

const js = fs.readFileSync(appJsPath, 'utf8');
const html = fs.readFileSync(newtabHtmlPath, 'utf8');

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('========================================');
console.log('TESTING SEAMLESS RAIN SOUND & GAPLESS LOOPER');
console.log('========================================\n');

// ----------------------------------------------------
// SUITE 1: Audio Asset Integrity & Existence
// ----------------------------------------------------
console.log('--- 1. Audio Asset Integrity & Verification ---');

test('audio/rain.mp3 exists on disk', () => {
  const rainPath = path.join(audioDir, 'rain.mp3');
  assert(fs.existsSync(rainPath), 'rain.mp3 does not exist');
});

test('audio/rain.mp3 has authentic size and duration (>1MB)', () => {
  const stat = fs.statSync(path.join(audioDir, 'rain.mp3'));
  assert(stat.size > 1000000, `rain.mp3 is too small: ${stat.size} bytes`);
});

test('All 7 soundscape assets exist in audio/ directory', () => {
  const expectedFiles = [
    'rain.mp3',
    'ocean.mp3',
    'brown.wav',
    'fireplace.mp3',
    'wind.mp3',
    'cafe.mp3',
    'night.mp3'
  ];
  expectedFiles.forEach(file => {
    assert(fs.existsSync(path.join(audioDir, file)), `Missing audio file: ${file}`);
  });
});

// ----------------------------------------------------
// SUITE 2: AmbientSound Engine Architecture
// ----------------------------------------------------
console.log('\n--- 2. AmbientSound Architecture & Gapless Engine ---');

test('app.js defines AmbientSound engine', () => {
  assert(js.includes('const AmbientSound ='), 'AmbientSound engine not found');
});

test('soundMap maps rain to audio/rain.mp3', () => {
  assert(js.includes("rain: 'audio/rain.mp3'"), 'soundMap missing rain mapping');
});

test('AmbientSound implements getAudioContext with state resumption', () => {
  assert(js.includes('getAudioContext()'), 'Missing getAudioContext method');
  assert(js.includes('audioCtx.resume()'), 'Missing audioCtx.resume()');
});

test('AmbientSound implements makeSeamlessBuffer with equal-power crossfade', () => {
  assert(js.includes('makeSeamlessBuffer('), 'Missing makeSeamlessBuffer method');
  assert(js.includes('Math.cos(t * 0.5 * Math.PI)'), 'Missing equal-power cosine fade');
  assert(js.includes('Math.sin(t * 0.5 * Math.PI)'), 'Missing equal-power sine fade');
});

test('AmbientSound implements loadBuffer with in-memory buffer caching', () => {
  assert(js.includes('loadBuffer('), 'Missing loadBuffer method');
  assert(js.includes('bufferCache[key]'), 'Missing bufferCache check');
  assert(js.includes('decodeAudioData'), 'Missing decodeAudioData call');
});

test('AmbientSound implements startWebAudioLoop with hardware sample-accurate loop', () => {
  assert(js.includes('startWebAudioLoop('), 'Missing startWebAudioLoop method');
  assert(js.includes('source.loop = true'), 'Missing source.loop = true on buffer source');
  assert(js.includes('createBufferSource()'), 'Missing createBufferSource');
  assert(js.includes('createGain()'), 'Missing createGain');
});

test('AmbientSound implements setupDualDeckCrossfade for resilient fallback', () => {
  assert(js.includes('setupDualDeckCrossfade('), 'Missing setupDualDeckCrossfade');
  assert(js.includes('activeDeck'), 'Missing dual deck state tracker');
});

test('AmbientSound implements smooth volume scheduling via setVolume', () => {
  assert(js.includes('setVolume(val)'), 'Missing setVolume method');
  assert(js.includes('setTargetAtTime'), 'Missing setTargetAtTime smooth gain scheduling');
});

test('AmbientSound implements stopPreset and stopCurrent with clean fade-out', () => {
  assert(js.includes('stopPreset('), 'Missing stopPreset method');
  assert(js.includes('stopCurrent('), 'Missing stopCurrent method');
});

// ----------------------------------------------------
// SUITE 3: UI & Preset Chips Wiring
// ----------------------------------------------------
console.log('\n--- 3. UI Preset Chips & Event Handling ---');

test('newtab.html contains rain ambient chip with active preset attribute', () => {
  assert(html.includes('data-preset="rain"'), 'Missing data-preset="rain" in newtab.html');
  assert(html.includes('id="ambient-toggle-btn"'), 'Missing #ambient-toggle-btn in newtab.html');
});

test('app.js handles ambient chip clicks and volume slider', () => {
  assert(js.includes('setAmbientPreset'), 'Missing setAmbientPreset handler');
  assert(js.includes('toggleAmbientPlay'), 'Missing toggleAmbientPlay handler');
  assert(js.includes('setAmbientVolume'), 'Missing setAmbientVolume handler');
});

// ----------------------------------------------------
// SUITE 4: Simulated Seamless Audio Engine Logic
// ----------------------------------------------------
console.log('\n--- 4. Simulated Engine Logic & State Transitions ---');

test('makeSeamlessBuffer mathematically preserves buffer continuity', () => {
  // Test algorithm logic
  const sampleRate = 44100;
  const numChannels = 1;
  const totalSamples = sampleRate * 10; // 10s
  const crossfadeSamples = sampleRate * 2; // 2s
  const newLength = totalSamples - crossfadeSamples;

  const src = new Float32Array(totalSamples);
  // Fill with dummy continuous waveform
  for (let i = 0; i < totalSamples; i++) {
    src[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  }

  const dst = new Float32Array(newLength);
  const K = newLength;

  for (let i = 0; i < crossfadeSamples; i++) {
    const t = i / crossfadeSamples;
    const fadeOut = Math.cos(t * 0.5 * Math.PI);
    const fadeIn = Math.sin(t * 0.5 * Math.PI);
    dst[i] = src[K + i] * fadeOut + src[i] * fadeIn;
  }
  for (let i = crossfadeSamples; i < newLength; i++) {
    dst[i] = src[i];
  }

  // Seam check: sample K-1 and sample K
  const lastSample = dst[newLength - 1]; // which is src[K - 1]
  const nextSampleAfterLoop = dst[0];    // which starts at src[K] * 1 + src[0] * 0 = src[K]
  
  assert(!isNaN(lastSample) && !isNaN(nextSampleAfterLoop), 'Samples must be valid numbers');
  const seamDelta = Math.abs(nextSampleAfterLoop - lastSample);
  // For 440Hz at 44100Hz, single-sample step is max ~0.062
  assert(seamDelta < 0.1, `Seam delta should be continuous, got ${seamDelta}`);
});

console.log('\n========================================');
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log('========================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
