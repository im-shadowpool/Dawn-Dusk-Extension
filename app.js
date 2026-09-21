/**
 * Momentum M3 - Focus & Tasks Chrome New Tab Extension
 * Complete application logic: Storage, 2-Digit 12H Clock, Dynamic Greeting,
 * Slide-in Focus Timer, Right-Docked To-Do, Themes, Audio.
 */

(function () {
  'use strict';

  // =========================================================================
  // STORAGE SERVICE (chrome.storage.local with localStorage fallback)
  // =========================================================================
  const Storage = {
    async get(key, defaultValue = null) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            chrome.storage.local.get([key], (result) => {
              if (chrome.runtime && chrome.runtime.lastError) {
                try {
                  const item = localStorage.getItem(`momentum_${key}`);
                  resolve(item !== null ? JSON.parse(item) : defaultValue);
                } catch (e) {
                  resolve(defaultValue);
                }
                return;
              }
              if (result && result[key] !== undefined) {
                resolve(result[key]);
              } else {
                try {
                  const item = localStorage.getItem(`momentum_${key}`);
                  resolve(item !== null ? JSON.parse(item) : defaultValue);
                } catch (e) {
                  resolve(defaultValue);
                }
              }
            });
          } catch (e) {
            try {
              const item = localStorage.getItem(`momentum_${key}`);
              resolve(item !== null ? JSON.parse(item) : defaultValue);
            } catch (err) {
              resolve(defaultValue);
            }
          }
        } else {
          try {
            const item = localStorage.getItem(`momentum_${key}`);
            resolve(item !== null ? JSON.parse(item) : defaultValue);
          } catch (e) {
            resolve(defaultValue);
          }
        }
      });
    },

    async set(key, value) {
      try {
        localStorage.setItem(`momentum_${key}`, JSON.stringify(value));
      } catch (e) {}

      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            chrome.storage.local.set({ [key]: value }, () => resolve());
          } catch (e) {
            resolve();
          }
        } else {
          resolve();
        }
      });
    }
  };

  // =========================================================================
  // AUDIO SYNTHESIZER (Material Chime using Web Audio API)
  // =========================================================================
  const Sound = {
    audioCtx: null,

    init() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
    },

    playChime() {
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        // Warm harmonic chord: C5, E5, G5, C6 (523.25, 659.25, 783.99, 1046.50)
        const notes = [
          { freq: 523.25, time: 0, duration: 1.8 },
          { freq: 659.25, time: 0.1, duration: 1.9 },
          { freq: 783.99, time: 0.22, duration: 2.2 },
          { freq: 1046.50, time: 0.35, duration: 2.5 }
        ];

        notes.forEach(({ freq, time, duration }) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.0001, now + time);
          gain.gain.exponentialRampToValueAtTime(0.18, now + time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now + time);
          osc.stop(now + time + duration);
        });
      } catch (err) {
        console.warn('Web Audio error:', err);
      }
    },

    // ASMR tactile wooden pop / micro-chime for task completion
    playTaskPop() {
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        // Component 1: Resonant wooden "pop" (sine with fast pitch drop)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        // Pitch envelope: starts around 640Hz, drops sharply to 260Hz for the woody "bloop/pop"
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.042);

        // Gain envelope: instant snappy attack, exponential decay in 42ms
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.045);

        // Component 2: Subtle high-frequency micro-click transient for tactile texture
        const clickOsc = this.audioCtx.createOscillator();
        const clickGain = this.audioCtx.createGain();

        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1400, now);
        clickOsc.frequency.exponentialRampToValueAtTime(400, now + 0.012);

        clickGain.gain.setValueAtTime(0.0001, now);
        clickGain.gain.linearRampToValueAtTime(0.07, now + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

        clickOsc.connect(clickGain);
        clickGain.connect(this.audioCtx.destination);

        clickOsc.start(now);
        clickOsc.stop(now + 0.015);
      } catch (err) {
        console.warn('Web Audio pop error:', err);
      }
    },

    // ASMR tactile rising pop for task creation
    playTaskAdd() {
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        // Component 1: Uplifting wooden rising pop (pitch sweeps upward 300Hz -> 660Hz)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.038);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.04);

        // Component 2: Crisp high-frequency micro-click transient
        const clickOsc = this.audioCtx.createOscillator();
        const clickGain = this.audioCtx.createGain();

        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1600, now);
        clickOsc.frequency.exponentialRampToValueAtTime(550, now + 0.01);

        clickGain.gain.setValueAtTime(0.0001, now);
        clickGain.gain.linearRampToValueAtTime(0.07, now + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

        clickOsc.connect(clickGain);
        clickGain.connect(this.audioCtx.destination);

        clickOsc.start(now);
        clickOsc.stop(now + 0.012);
      } catch (err) {
        console.warn('Web Audio task add pop error:', err);
      }
    },

    // Focused crystal / glass tap for Focus Mode
    playFocusTap() {
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        // Primary bell tone (880Hz / A5)
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);

        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.linearRampToValueAtTime(0.18, now + 0.002);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.08);

        // Second harmonic overtone (1760Hz / A6) for glassy sparkle
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, now);

        gain2.gain.setValueAtTime(0.0001, now);
        gain2.gain.linearRampToValueAtTime(0.08, now + 0.002);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 0.05);
      } catch (err) {
        console.warn('Web Audio focus tap error:', err);
      }
    },

    // Crisp page-flick tick for Calendar Mode
    playCalendarTap() {
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Fast downward sweep with triangle wave gives dry, percussive paper flick feel
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1250, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.028);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
      } catch (err) {
        console.warn('Web Audio calendar tap error:', err);
      }
    },

    // Gentle water droplet ripple for Ambient Soundscapes Mode
    playAmbientTap() {
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Authentic droplet pitch rise: 430Hz quickly rising to 650Hz
        osc.type = 'sine';
        osc.frequency.setValueAtTime(430, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.022);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      } catch (err) {
        console.warn('Web Audio ambient tap error:', err);
      }
    }
  };

  // =========================================================================
  // AMBIENT SOUNDSCAPES ENGINE (Authentic Natural Audio & Gapless Looping)
  // =========================================================================
  const AmbientSound = {
    currentPreset: null,
    isPlaying: false,
    audioCtx: null,
    activeNodes: {},     // key -> { source, gainNode }
    bufferCache: {},     // key -> AudioBuffer
    loadingPromises: {}, // key -> Promise<AudioBuffer>
    players: {},         // key -> HTMLAudioElement (fallback Deck A)
    deckBPlayers: {},    // key -> HTMLAudioElement (fallback Deck B)
    fadeTimers: {},
    fallbackTimeTrackers: {},

    soundMap: {
      rain: 'audio/rain.mp3',
      waves: 'audio/ocean.mp3',
      brown: 'audio/brown.wav',
      fire: 'audio/fireplace.mp3',
      wind: 'audio/wind.mp3',
      cafe: 'audio/cafe.mp3',
      night: 'audio/night.mp3'
    },

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    },

    makeSeamlessBuffer(origBuf, crossfadeSec = 2.5) {
      if (!this.audioCtx) return origBuf;
      const numChannels = origBuf.numberOfChannels;
      const sampleRate = origBuf.sampleRate;
      const crossfadeSamples = Math.min(
        Math.floor(sampleRate * crossfadeSec),
        Math.floor(origBuf.length / 4)
      );
      if (crossfadeSamples <= 0) return origBuf;
      const newLength = origBuf.length - crossfadeSamples;
      const seamlessBuf = this.audioCtx.createBuffer(numChannels, newLength, sampleRate);
      const K = newLength;

      for (let ch = 0; ch < numChannels; ch++) {
        const src = origBuf.getChannelData(ch);
        const dst = seamlessBuf.getChannelData(ch);

        // Head region: crossfade from tail into natural body for seamless loop continuity
        for (let i = 0; i < crossfadeSamples; i++) {
          const t = i / crossfadeSamples;
          const fadeOut = Math.cos(t * 0.5 * Math.PI);
          const fadeIn = Math.sin(t * 0.5 * Math.PI);
          dst[i] = src[K + i] * fadeOut + src[i] * fadeIn;
        }
        // Body region: untouched natural recording
        for (let i = crossfadeSamples; i < newLength; i++) {
          dst[i] = src[i];
        }
      }
      return seamlessBuf;
    },

    async loadBuffer(key) {
      if (this.bufferCache[key]) return this.bufferCache[key];
      if (this.loadingPromises[key]) return this.loadingPromises[key];

      const url = this.soundMap[key];
      if (!url) return null;

      this.loadingPromises[key] = (async () => {
        try {
          const ctx = this.getAudioContext();
          if (!ctx) return null;
          const res = await fetch(url);
          const arrayBuffer = await res.arrayBuffer();
          const rawBuf = await ctx.decodeAudioData(arrayBuffer);
          const seamlessBuf = this.makeSeamlessBuffer(rawBuf, 2.5);
          this.bufferCache[key] = seamlessBuf;
          delete this.loadingPromises[key];
          return seamlessBuf;
        } catch (err) {
          console.warn('Ambient Web Audio buffer load error for', key, err);
          delete this.loadingPromises[key];
          return null;
        }
      })();

      return this.loadingPromises[key];
    },

    init() {
      this.getAudioContext();
      if (Object.keys(this.players).length === 0) {
        Object.keys(this.soundMap).forEach(key => {
          try {
            const audioA = new Audio();
            audioA.src = this.soundMap[key];
            audioA.preload = 'auto';
            audioA.volume = 0;
            this.players[key] = audioA;

            const audioB = new Audio();
            audioB.src = this.soundMap[key];
            audioB.preload = 'auto';
            audioB.volume = 0;
            this.deckBPlayers[key] = audioB;
          } catch (e) {
            console.warn('Failed to initialize audio fallback:', key, e);
          }
        });
      }
    },

    setVolume(val) {
      this.init();
      const clamped = Math.max(0, Math.min(1.0, val));
      const key = this.currentPreset;
      if (!key) return;

      if (this.activeNodes[key] && this.audioCtx) {
        const { gainNode } = this.activeNodes[key];
        const now = this.audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(clamped, now, 0.05);
      }

      if (this.players[key] && !this.fadeTimers[key]) {
        this.players[key].volume = clamped;
      }
      if (this.deckBPlayers[key] && !this.fadeTimers[key + '_b']) {
        this.deckBPlayers[key].volume = clamped;
      }
    },

    play(presetName) {
      this.init();
      const key = this.soundMap[presetName] ? presetName : 'rain';
      const targetVol = Math.max(0, Math.min(1.0, state.ambientVolume));

      if (this.isPlaying && this.currentPreset === key) {
        this.setVolume(targetVol);
        return;
      }

      if (this.currentPreset && this.currentPreset !== key) {
        this.stopPreset(this.currentPreset, 0.35);
      }

      this.currentPreset = key;
      this.isPlaying = true;

      const ctx = this.getAudioContext();
      if (ctx) {
        this.loadBuffer(key).then(buffer => {
          if (!this.isPlaying || this.currentPreset !== key) return;
          if (buffer) {
            this.startWebAudioLoop(key, buffer, targetVol);
          } else {
            this.startFallbackLoop(key, targetVol);
          }
        }).catch(() => {
          if (this.isPlaying && this.currentPreset === key) {
            this.startFallbackLoop(key, targetVol);
          }
        });
      } else {
        this.startFallbackLoop(key, targetVol);
      }
    },

    startWebAudioLoop(key, buffer, targetVol) {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (this.activeNodes[key]) {
        try {
          this.activeNodes[key].source.stop();
          this.activeNodes[key].source.disconnect();
        } catch (e) {}
        delete this.activeNodes[key];
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.18);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);

      this.activeNodes[key] = { source, gainNode };

      if (this.players[key]) this.players[key].pause();
      if (this.deckBPlayers[key]) this.deckBPlayers[key].pause();
    },

    startFallbackLoop(key, targetVol) {
      const playerA = this.players[key];
      const playerB = this.deckBPlayers[key];
      if (!playerA) return;

      playerA.currentTime = 0;
      playerA.volume = 0;
      playerA.play().then(() => {
        this.fadeFallbackVolume(key, playerA, targetVol, 300);
        this.setupDualDeckCrossfade(key, targetVol);
      }).catch(err => console.warn('Fallback play error:', err));
    },

    setupDualDeckCrossfade(key, targetVol) {
      if (this.fallbackTimeTrackers[key]) {
        clearInterval(this.fallbackTimeTrackers[key]);
      }

      let activeDeck = 'A';
      const crossfadeSec = 2.5;

      this.fallbackTimeTrackers[key] = setInterval(() => {
        if (!this.isPlaying || this.currentPreset !== key) {
          clearInterval(this.fallbackTimeTrackers[key]);
          delete this.fallbackTimeTrackers[key];
          return;
        }

        const currentDeck = activeDeck === 'A' ? this.players[key] : this.deckBPlayers[key];
        const nextDeck = activeDeck === 'A' ? this.deckBPlayers[key] : this.players[key];
        if (!currentDeck || !nextDeck) return;

        const remaining = currentDeck.duration - currentDeck.currentTime;
        if (remaining > 0 && remaining <= crossfadeSec && nextDeck.paused) {
          nextDeck.currentTime = 0;
          nextDeck.volume = 0;
          nextDeck.play().then(() => {
            this.fadeFallbackVolume(key + '_next', nextDeck, targetVol, crossfadeSec * 1000);
            this.fadeFallbackVolume(key + '_curr', currentDeck, 0, crossfadeSec * 1000, () => {
              currentDeck.pause();
            });
            activeDeck = activeDeck === 'A' ? 'B' : 'A';
          }).catch(() => {});
        }
      }, 250);
    },

    fadeFallbackVolume(timerId, player, targetVol, durationMs, onComplete) {
      if (!player) return;
      if (this.fadeTimers[timerId]) {
        clearInterval(this.fadeTimers[timerId]);
        delete this.fadeTimers[timerId];
      }
      const startVol = player.volume;
      const startTime = performance.now();
      this.fadeTimers[timerId] = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / durationMs);
        player.volume = Math.max(0, Math.min(1.0, startVol + (targetVol - startVol) * p));
        if (p >= 1) {
          clearInterval(this.fadeTimers[timerId]);
          delete this.fadeTimers[timerId];
          player.volume = Math.max(0, Math.min(1.0, targetVol));
          if (onComplete) onComplete();
        }
      }, 25);
    },

    stopPreset(key, fadeDuration = 0.3) {
      const durationMs = Math.max(100, fadeDuration * 1000);

      if (this.activeNodes[key] && this.audioCtx) {
        const { source, gainNode } = this.activeNodes[key];
        const now = this.audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(0, now, fadeDuration / 3);
        setTimeout(() => {
          try {
            source.stop();
            source.disconnect();
          } catch (e) {}
        }, durationMs + 80);
        delete this.activeNodes[key];
      }

      if (this.fallbackTimeTrackers[key]) {
        clearInterval(this.fallbackTimeTrackers[key]);
        delete this.fallbackTimeTrackers[key];
      }
      const playerA = this.players[key];
      const playerB = this.deckBPlayers[key];
      if (playerA && !playerA.paused) {
        this.fadeFallbackVolume(key + '_stopA', playerA, 0, durationMs, () => playerA.pause());
      }
      if (playerB && !playerB.paused) {
        this.fadeFallbackVolume(key + '_stopB', playerB, 0, durationMs, () => playerB.pause());
      }
    },

    stopCurrent(fadeDuration = 0.3) {
      this.isPlaying = false;
      if (this.currentPreset) {
        this.stopPreset(this.currentPreset, fadeDuration);
      }
    }
  };

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  const state = {
    theme: 'indigo',
    userName: '',
    showGreeting: true,
    showMotivation: true,
    clockFormat: '12h', // '12h' or '24h'
    showSeconds: false,
    showDate: true,
    soundEnabled: true,
    taskSoundEnabled: true,
    modeSoundEnabled: true,
    isFocusActive: false,
    isCalendarActive: false,
    isAmbientActive: false,

    // Focus Timer State (3 Editable Presets: Focus, Short Break, Long Break)
    timerPresets: {
      focus: 25,
      shortBreak: 5,
      longBreak: 15
    },
    activePresetType: 'focus',
    timerPresetMinutes: 25,
    timerTotalSeconds: 25 * 60,
    timerRemainingSeconds: 25 * 60,
    timerIsRunning: false,
    timerIntervalId: null,

    // Calendar State
    calendarViewDate: new Date(), // Month/Year currently viewed
    selectedDate: null, // 'YYYY-MM-DD' filter or null for all

    // Ambient Soundscape State
    ambientPreset: 'rain',
    ambientPlaying: false,
    ambientVolume: 0.7,
    ambientSleepMinutes: 0,
    ambientSleepEndTime: null,
    ambientSleepIntervalId: null,

    // To-Do State
    tasks: [],

    // Quick Links State
    showQuickLinks: true,
    quickLinks: [],
    activeContextMenuLinkId: null,
    editingQuickLinkId: null,

    // Zen Mode State
    isZenActive: false
  };

  // =========================================================================
  // DOM ELEMENT REFERENCES
  // =========================================================================
  const elements = {
    // Focus toggle
    focusToggleBtn: document.getElementById('focus-toggle-btn'),
    clockView: document.getElementById('clock-view'),
    timerView: document.getElementById('timer-view'),
    timerSlideContainer: document.getElementById('timer-slide-container'),

    // Calendar View
    calendarToggleBtn: document.getElementById('calendar-toggle-btn'),
    calendarSlideContainer: document.getElementById('calendar-slide-container'),
    calendarView: document.getElementById('calendar-view'),
    calMonthYear: document.getElementById('cal-month-year'),
    calTodayBtn: document.getElementById('cal-today-btn'),
    calPrevBtn: document.getElementById('cal-prev-btn'),
    calNextBtn: document.getElementById('cal-next-btn'),
    calendarGrid: document.getElementById('calendar-grid'),

    // Ambient Soundscapes View
    ambientToggleBtn: document.getElementById('ambient-toggle-btn'),
    ambientEqualizer: document.getElementById('ambient-equalizer'),
    ambientSlideContainer: document.getElementById('ambient-slide-container'),
    ambientView: document.getElementById('ambient-view'),
    ambientStatusBadge: document.getElementById('ambient-status-badge'),
    ambientChips: document.querySelectorAll('.ambient-chip'),
    ambientPlayBtn: document.getElementById('ambient-play-btn'),
    ambientPlayIcon: document.getElementById('ambient-play-icon'),
    ambientPauseIcon: document.getElementById('ambient-pause-icon'),
    ambientPlayText: document.getElementById('ambient-play-text'),
    ambientTimerBtn: document.getElementById('ambient-timer-btn'),
    ambientTimerTag: document.getElementById('ambient-timer-tag'),
    ambientMuteBtn: document.getElementById('ambient-mute-btn'),
    ambientVolumeIconHigh: document.getElementById('ambient-volume-icon-high'),
    ambientVolumeIconMute: document.getElementById('ambient-volume-icon-mute'),
    ambientVolumeSlider: document.getElementById('ambient-volume-slider'),
    ambientVolumeVal: document.getElementById('ambient-volume-val'),

    // Top Controls & Settings
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundIconOn: document.getElementById('sound-icon-on'),
    soundIconOff: document.getElementById('sound-icon-off'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsSideSheet: document.getElementById('settings-side-sheet'),
    settingsScrim: document.getElementById('settings-scrim'),
    closeSettingsBtn: document.getElementById('close-settings-btn'),
    confirmSettingsBtn: document.getElementById('confirm-settings-btn'),
    settingsNameInput: document.getElementById('settings-name-input'),
    settingsGreetingToggle: document.getElementById('settings-greeting-toggle'),
    settingsMotivationToggle: document.getElementById('settings-motivation-toggle'),
    format12hBtn: document.getElementById('format-12h-btn'),
    format24hBtn: document.getElementById('format-24h-btn'),
    settingsSecondsToggle: document.getElementById('settings-seconds-toggle'),
    settingsDateToggle: document.getElementById('settings-date-toggle'),
    settingsSoundToggle: document.getElementById('settings-sound-toggle'),
    settingsTaskSoundToggle: document.getElementById('settings-task-sound-toggle'),
    settingsModeSoundToggle: document.getElementById('settings-mode-sound-toggle'),
    paletteSwatches: document.querySelectorAll('.palette-swatch-card'),
    helpBtn: document.getElementById('help-btn'),
    shortcutsDialog: document.getElementById('shortcuts-dialog'),
    closeDialogBtn: document.getElementById('close-dialog-btn'),
    confirmDialogBtn: document.getElementById('confirm-dialog-btn'),

    // Clock & Greeting
    digitalClock: document.getElementById('digital-clock'),
    clockHours: document.getElementById('clock-hours'),
    clockMinutes: document.getElementById('clock-minutes'),
    clockColonMain: document.getElementById('clock-colon-main'),
    clockColonSec: document.getElementById('clock-colon-sec'),
    clockSecondsWrapper: document.getElementById('clock-seconds-wrapper'),
    clockSeconds: document.getElementById('clock-seconds'),
    clockPeriod: document.getElementById('clock-period'),
    dateDisplay: document.getElementById('date-display'),
    greetingContainer: document.getElementById('greeting-container'),
    greetingSalutation: document.getElementById('greeting-salutation'),
    userName: document.getElementById('user-name'),
    greetingSubtitle: document.getElementById('greeting-subtitle'),

    // Focus Timer
    timerChips: document.querySelectorAll('.timer-chips .chip'),
    timerDisplay: document.getElementById('timer-display'),
    timerLabel: document.getElementById('timer-label'),
    timerProgressRing: document.getElementById('timer-progress-ring'),
    timerStartBtn: document.getElementById('timer-start-btn'),
    timerResetBtn: document.getElementById('timer-reset-btn'),
    timerPlayIcon: document.getElementById('timer-play-icon'),
    timerPauseIcon: document.getElementById('timer-pause-icon'),
    timerPlayText: document.getElementById('timer-play-text'),

    // To-Do
    taskForm: document.getElementById('task-form'),
    taskInput: document.getElementById('task-input'),
    taskList: document.getElementById('task-list'),
    tasksCount: document.getElementById('tasks-count'),
    tasksDateFilterChip: document.getElementById('tasks-date-filter-chip'),
    tasksFilterLabel: document.getElementById('tasks-filter-label'),
    filterRemoveBtn: document.getElementById('filter-remove-btn'),
    clearCompletedBtn: document.getElementById('clear-completed-btn'),
    taskEmptyState: document.getElementById('task-empty-state'),

    // Quick Links
    quickLinksSection: document.getElementById('quick-links-section'),
    quickLinksContainer: document.getElementById('quick-links-container'),
    quickLinksGrid: document.getElementById('quick-links-grid'),
    quickLinkAddBtn: document.getElementById('quick-link-add-btn'),
    quickLinkDialog: document.getElementById('quick-link-dialog'),
    quickLinkDialogTitle: document.getElementById('quick-link-dialog-title'),
    closeQuickLinkDialogBtn: document.getElementById('close-quick-link-dialog-btn'),
    quickLinkForm: document.getElementById('quick-link-form'),
    quickLinkTitleInput: document.getElementById('quick-link-title-input'),
    quickLinkUrlInput: document.getElementById('quick-link-url-input'),
    cancelQuickLinkBtn: document.getElementById('cancel-quick-link-btn'),
    quickLinkContextMenu: document.getElementById('quick-link-context-menu'),
    settingsQuickLinksToggle: document.getElementById('settings-quick-links-toggle'),
    resyncTopSitesBtn: document.getElementById('resync-top-sites-btn')
  };

  // Circumference of timer progress ring (2 * PI * 96)
  const RING_CIRCUMFERENCE = 2 * Math.PI * 96;

  // =========================================================================
  // SUPPORTIVE & MOTIVATIONAL DAILY MESSAGES MODULE
  // =========================================================================
  const SUPPORTIVE_MESSAGES = {
    lateNight: [
      "Sleep early, continue work tomorrow.",
      "Rest well and recharge your energy for a brilliant tomorrow.",
      "You worked hard today—give your mind the peaceful rest it deserves.",
      "Close the tabs, wind down, and sleep tight.",
      "Tomorrow is a fresh start. Time to rest your eyes.",
      "Great work today. Allow your body and mind to unplug and recover.",
      "Night is for resting. Wrap up gently and get some good sleep."
    ],
    morning: [
      "Good morning! Every morning is a fresh canvas—make it yours.",
      "A new day full of potential. Focus on what truly matters.",
      "Rise and shine! Take a deep breath and start with clarity.",
      "Start small, stay consistent, and have an inspired day.",
      "Good morning! Trust your journey and take one step at a time.",
      "Fresh morning air, clear mind. You've got this today.",
      "Embrace today with energy, positivity, and purpose."
    ],
    afternoon: [
      "Keep your momentum steady. You're making meaningful progress.",
      "Stay hydrated, stretch a bit, and tackle one priority at a time.",
      "Halfway through the day! Take a mindful breath and keep going.",
      "Steady progress beats rushed effort every single time.",
      "You are capable of wonderful work. Keep your focus locked in.",
      "Breathe in calm, exhale stress. Focus on the next single step.",
      "Stay curious, stay present, and conquer the afternoon."
    ],
    evening: [
      "Hope you had a fulfilling day! Take time to unwind tonight.",
      "Acknowledge what you accomplished today—every effort counts.",
      "Evening is here. Shift gears gently and enjoy the peace.",
      "Celebrate your small wins today. You've done well.",
      "Wind down slowly and let go of whatever can wait for tomorrow.",
      "Relax your shoulders, unwind, and enjoy a quiet evening.",
      "Reflect with gratitude on today's progress and learning."
    ],
    milestoneAllTasksDone: [
      "All tasks cleared! Outstanding focus today—time to unwind.",
      "Zero tasks left on the list! You completely crushed it today.",
      "Everything done! Take a well-earned bow and relax tonight.",
      "Checklist conquered! Great discipline and focus today."
    ]
  };

  function getDailySupportiveMessage(now = new Date(), tasks = []) {
    const rawHours = now.getHours();

    // Check if user has completed all tasks for the day (at least 1 task exists and all are completed)
    const hasTasks = Array.isArray(tasks) && tasks.length > 0;
    const allTasksCompleted = hasTasks && tasks.every(t => t.completed);

    // Day of year calculation for deterministic daily unique selection
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // If all tasks are completed and it's evening or late night (hours >= 17 or < 5), celebrate milestone!
    if (allTasksCompleted && (rawHours >= 17 || rawHours < 5)) {
      const pool = SUPPORTIVE_MESSAGES.milestoneAllTasksDone;
      const index = (dayOfYear + now.getFullYear()) % pool.length;
      return pool[index];
    }

    let pool = SUPPORTIVE_MESSAGES.morning;
    if (rawHours >= 22 || rawHours < 5) {
      pool = SUPPORTIVE_MESSAGES.lateNight;
    } else if (rawHours >= 5 && rawHours < 12) {
      pool = SUPPORTIVE_MESSAGES.morning;
    } else if (rawHours >= 12 && rawHours < 17) {
      pool = SUPPORTIVE_MESSAGES.afternoon;
    } else {
      pool = SUPPORTIVE_MESSAGES.evening;
    }

    // Deterministic unique message based on day-of-year so it's consistent during the day
    const index = (dayOfYear + now.getFullYear()) % pool.length;
    return pool[index];
  }

  // =========================================================================
  // CLOCK & GREETING MODULE (Two-Digit 12H Format + Dynamic Greeting)
  // =========================================================================
  function updateClock() {
    const now = new Date();
    const rawHours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Dynamic greeting based on current local hour
    if (elements.greetingContainer) {
      if (state.showGreeting) {
        elements.greetingContainer.classList.remove('hidden');
        let greeting = 'Good day';
        if (rawHours >= 5 && rawHours < 12) {
          greeting = 'Good morning';
        } else if (rawHours >= 12 && rawHours < 17) {
          greeting = 'Good afternoon';
        } else if (rawHours >= 17 && rawHours < 22) {
          greeting = 'Good evening';
        } else {
          greeting = 'Good night';
        }

        const trimmedName = (state.userName || '').trim();
        if (trimmedName) {
          elements.greetingContainer.innerHTML = `<span id="greeting-salutation">${greeting}</span>, <span class="greeting-name" id="user-name">${trimmedName}</span>`;
        } else {
          elements.greetingContainer.innerHTML = `<span id="greeting-salutation">${greeting}</span>`;
        }
      } else {
        elements.greetingContainer.classList.add('hidden');
      }
    }

    // Dynamic daily supportive & motivational message
    if (elements.greetingSubtitle) {
      if (state.showGreeting && state.showMotivation) {
        elements.greetingSubtitle.textContent = getDailySupportiveMessage(now, state.tasks);
        elements.greetingSubtitle.classList.remove('hidden');
      } else {
        elements.greetingSubtitle.classList.add('hidden');
      }
    }

    // Clock Format: 12-Hour vs 24-Hour
    if (state.clockFormat === '24h') {
      elements.clockHours.textContent = String(rawHours).padStart(2, '0');
      elements.clockMinutes.textContent = minutes;
      elements.clockPeriod.classList.add('hidden');
    } else {
      const period = rawHours >= 12 ? 'PM' : 'AM';
      let displayHours = rawHours % 12;
      displayHours = displayHours ? displayHours : 12; // 0 becomes 12
      elements.clockHours.textContent = String(displayHours).padStart(2, '0');
      elements.clockMinutes.textContent = minutes;
      elements.clockPeriod.textContent = period;
      elements.clockPeriod.classList.remove('hidden');
    }

    // Seconds Display & Colon Sync
    if (elements.clockSecondsWrapper && elements.clockSeconds) {
      if (state.showSeconds) {
        const wasHidden = elements.clockSecondsWrapper.classList.contains('hidden');
        elements.clockSeconds.textContent = seconds;
        elements.clockSecondsWrapper.classList.remove('hidden');
        if (wasHidden) {
          syncColonAnimations();
        }
      } else {
        elements.clockSecondsWrapper.classList.add('hidden');
      }
    }

    // Formatted Date Display
    if (elements.dateDisplay) {
      if (state.showDate) {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        elements.dateDisplay.textContent = now.toLocaleDateString(undefined, options);
        elements.dateDisplay.classList.remove('hidden');
      } else {
        elements.dateDisplay.classList.add('hidden');
      }
    }
  }

  // =========================================================================
  // FOCUS / POMODORO TIMER MODULE
  // =========================================================================
  function setTimerProgress(percent) {
    const offset = RING_CIRCUMFERENCE * (1 - percent);
    elements.timerProgressRing.style.strokeDashoffset = offset;
  }

  function formatTimeDigits(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderTimer() {
    elements.timerDisplay.textContent = formatTimeDigits(state.timerRemainingSeconds);
    const progressRatio = state.timerTotalSeconds > 0 ? (state.timerRemainingSeconds / state.timerTotalSeconds) : 0;
    setTimerProgress(progressRatio);

    if (state.timerIsRunning) {
      elements.timerPlayIcon.classList.add('hidden');
      elements.timerPauseIcon.classList.remove('hidden');
      elements.timerPlayText.textContent = 'Pause';
    } else {
      elements.timerPlayIcon.classList.remove('hidden');
      elements.timerPauseIcon.classList.add('hidden');
      elements.timerPlayText.textContent = state.timerRemainingSeconds === state.timerTotalSeconds ? 'Start' : 'Resume';
    }
  }

  function startTimer() {
    if (state.timerIsRunning) return;
    state.timerIsRunning = true;
    renderTimer();

    state.timerIntervalId = setInterval(() => {
      if (state.timerRemainingSeconds > 0) {
        state.timerRemainingSeconds--;
        renderTimer();
      } else {
        completeTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    state.timerIsRunning = false;
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
    renderTimer();
  }

  const PRESET_CONFIG = {
    focus: { label: 'Focus', defaultMinutes: 25, modeLabel: 'Focus Session' },
    shortBreak: { label: 'Short Break', defaultMinutes: 5, modeLabel: 'Short Break' },
    longBreak: { label: 'Long Break', defaultMinutes: 15, modeLabel: 'Long Break' }
  };

  function resetTimer() {
    pauseTimer();
    state.timerTotalSeconds = state.timerPresetMinutes * 60;
    state.timerRemainingSeconds = state.timerTotalSeconds;
    const config = PRESET_CONFIG[state.activePresetType];
    elements.timerLabel.textContent = config ? config.modeLabel : (state.timerPresetMinutes >= 20 ? 'Focus Session' : 'Break Time');
    renderTimer();
  }

  function completeTimer() {
    pauseTimer();
    elements.timerLabel.textContent = 'Completed! 🎉';

    if (state.soundEnabled) {
      Sound.playChime();
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Momentum Timer Finished', {
        body: 'Great job! Your focus session is complete.',
        icon: 'icons/icon-128.png'
      });
    }
  }

  function setupTimerEvents() {
    elements.timerStartBtn.addEventListener('click', () => {
      Sound.init(); // Initialize audio context on user gesture
      if (state.timerIsRunning) {
        pauseTimer();
      } else {
        if (state.timerRemainingSeconds === 0) {
          resetTimer();
        }
        startTimer();
      }
    });

    elements.timerResetBtn.addEventListener('click', () => {
      resetTimer();
    });

    elements.timerChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('chip-inline-input')) return;

        const presetType = chip.dataset.preset || 'focus';
        const isAlreadyActive = chip.classList.contains('active') && state.activePresetType === presetType;

        if (isAlreadyActive) {
          // Already active: clicking again triggers inline editing
          startEditingPresetChip(chip);
          return;
        }

        // Switch to this preset
        state.activePresetType = presetType;
        const minutes = (state.timerPresets && state.timerPresets[presetType]) || parseInt(chip.dataset.minutes, 10) || PRESET_CONFIG[presetType]?.defaultMinutes || 25;
        state.timerPresetMinutes = minutes;

        elements.timerChips.forEach(c => {
          const isActive = c === chip;
          c.classList.toggle('active', isActive);
          c.setAttribute('aria-checked', String(isActive));
        });

        Storage.set('activePresetType', presetType);
        Storage.set('activePresetMinutes', minutes);
        resetTimer();

        if (state.modeSoundEnabled) {
          Sound.playModeSwitch('focus');
        }
      });

      chip.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const presetType = chip.dataset.preset || 'focus';
        state.activePresetType = presetType;
        state.timerPresetMinutes = (state.timerPresets && state.timerPresets[presetType]) || parseInt(chip.dataset.minutes, 10) || 25;
        elements.timerChips.forEach(c => {
          const isActive = c === chip;
          c.classList.toggle('active', isActive);
          c.setAttribute('aria-checked', String(isActive));
        });
        resetTimer();
        startEditingPresetChip(chip);
      });
    });
  }

  // Update Preset Chips UI and text labels
  function updatePresetChipsUI() {
    if (!elements.timerChips) return;
    elements.timerChips.forEach(chip => {
      const presetType = chip.dataset.preset;
      if (!presetType || !state.timerPresets || !state.timerPresets[presetType]) return;
      const minutes = state.timerPresets[presetType];
      chip.dataset.minutes = String(minutes);
      const labelSpan = chip.querySelector('.chip-text');
      const config = PRESET_CONFIG[presetType];
      if (labelSpan && config) {
        labelSpan.textContent = `${config.label} (${minutes}m)`;
      }
      const isActive = state.activePresetType === presetType;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-checked', String(isActive));
    });
  }

  // Inline Editing for any of the 3 Preset Chips (Focus, Short Break, Long Break)
  function startEditingPresetChip(chip) {
    if (!chip || chip.querySelector('.chip-inline-input')) return;

    const presetType = chip.dataset.preset || 'focus';
    const config = PRESET_CONFIG[presetType] || { label: 'Focus', defaultMinutes: 25 };
    const currentMinutes = (state.timerPresets && state.timerPresets[presetType]) || parseInt(chip.dataset.minutes, 10) || config.defaultMinutes;

    const labelSpan = chip.querySelector('.chip-text');
    if (!labelSpan) return;

    labelSpan.classList.add('hidden');

    const editorSpan = document.createElement('span');
    editorSpan.className = 'chip-inline-editor';

    const prefix = document.createTextNode(`${config.label} (`);
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '180';
    input.className = 'chip-inline-input';
    input.value = currentMinutes;
    input.setAttribute('aria-label', `Edit ${config.label} minutes`);

    const suffix = document.createTextNode('m)');

    editorSpan.appendChild(prefix);
    editorSpan.appendChild(input);
    editorSpan.appendChild(suffix);
    chip.appendChild(editorSpan);

    input.focus();
    input.select();

    let isFinished = false;

    const finishEdit = async (save) => {
      if (isFinished) return;
      isFinished = true;

      let val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1) val = currentMinutes;
      if (val > 180) val = 180;

      editorSpan.remove();
      labelSpan.classList.remove('hidden');

      if (save && val > 0) {
        if (!state.timerPresets) state.timerPresets = {};
        state.timerPresets[presetType] = val;
        chip.dataset.minutes = String(val);
        labelSpan.textContent = `${config.label} (${val}m)`;

        if (state.activePresetType === presetType) {
          state.timerPresetMinutes = val;
          resetTimer();
          Storage.set('activePresetMinutes', val);
        }

        Storage.set('timerPresets', state.timerPresets);
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit(false);
      }
    });

    input.addEventListener('blur', () => {
      finishEdit(true);
    });
  }

  // Helper to format Date objects as 'YYYY-MM-DD'
  function formatDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // =========================================================================
  // TO-DO LIST MODULE (Minimalist with Date Filtering)
  // =========================================================================

  // Sort tasks on page load / refresh: active tasks first (newest-to-oldest),
  // followed by completed tasks at the bottom (newest-to-oldest).
  // In-session toggling remains in-place to avoid jarring layout shifts.
  function sortTasksOnLoad(taskList) {
    if (!Array.isArray(taskList)) return [];
    const active = [];
    const completed = [];

    taskList.forEach(t => {
      if (t && t.completed) {
        completed.push(t);
      } else if (t) {
        active.push(t);
      }
    });

    // Sort active tasks newest-to-oldest (createdAt descending)
    active.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    // Sort completed tasks newest-to-oldest (createdAt descending)
    completed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return [...active, ...completed];
  }

  // Update header counters, badges, empty state, and clear-completed button
  function updateTaskHeaderState() {
    const todayKey = formatDateKey(new Date());

    // Filter tasks if a date is selected on the calendar
    let displayedTasks = state.tasks;
    if (state.selectedDate) {
      displayedTasks = state.tasks.filter(t => {
        if (t.dueDate) return t.dueDate === state.selectedDate;
        const createdKey = formatDateKey(new Date(t.createdAt));
        return createdKey === state.selectedDate;
      });

      // Update task filter chip in header
      if (elements.tasksDateFilterChip && elements.tasksFilterLabel) {
        elements.tasksDateFilterChip.classList.remove('hidden');
        const isToday = state.selectedDate === todayKey;
        if (isToday) {
          elements.tasksFilterLabel.textContent = 'Today';
        } else {
          const [y, m, d] = state.selectedDate.split('-').map(Number);
          const selDate = new Date(y, m - 1, d);
          elements.tasksFilterLabel.textContent = selDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
      }
    } else {
      if (elements.tasksDateFilterChip) {
        elements.tasksDateFilterChip.classList.add('hidden');
      }

      // Default view: Show all unchecked tasks (any date) + only tasks created or completed today
      displayedTasks = state.tasks.filter(t => {
        if (!t.completed) return true; // All unchecked tasks always stay visible

        const completedKey = t.completedAt ? formatDateKey(new Date(t.completedAt)) : null;
        const createdKey = t.createdAt ? formatDateKey(new Date(t.createdAt)) : null;
        const dueKey = t.dueDate || null;

        return completedKey === todayKey || createdKey === todayKey || dueKey === todayKey;
      });
    }

    const remainingCount = displayedTasks.filter(t => !t.completed).length;
    const completedCount = displayedTasks.length - remainingCount;

    if (elements.tasksCount) {
      elements.tasksCount.textContent = remainingCount;
    }

    if (elements.clearCompletedBtn) {
      if (completedCount > 0) {
        elements.clearCompletedBtn.classList.remove('hidden');
      } else {
        elements.clearCompletedBtn.classList.add('hidden');
      }
    }

    if (elements.taskEmptyState) {
      if (displayedTasks.length === 0) {
        elements.taskEmptyState.classList.remove('hidden');
      } else {
        elements.taskEmptyState.classList.add('hidden');
      }
    }

    return displayedTasks;
  }

  function renderTasks() {
    const list = elements.taskList;
    list.innerHTML = '';

    const displayedTasks = updateTaskHeaderState();

    displayedTasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <div class="task-left">
          <label class="custom-checkbox" aria-label="Mark task as complete">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="checkbox-mark">
              <svg viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </span>
          </label>
          <span class="task-label"></span>
        </div>
        <button type="button" class="task-delete-btn" title="Delete task" aria-label="Delete task">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      `;

      // Safe text node to prevent any XSS
      const taskLabel = li.querySelector('.task-label');
      taskLabel.textContent = task.text;

      // Inline Task Editing on Double-Click (Active tasks only)
      if (!task.completed) {
        taskLabel.title = 'Double-click to edit';
        taskLabel.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          startEditingTask(task.id, li);
        });
      }

      // Checkbox event
      const checkbox = li.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => {
        toggleTaskCompleted(task.id, checkbox.checked);
      });

      // Delete event
      const deleteBtn = li.querySelector('.task-delete-btn');
      deleteBtn.addEventListener('click', () => {
        deleteTask(task.id, li);
      });

      list.appendChild(li);
    });

    updateClock();
  }

  // Inline Task Editing via Double-Click
  function startEditingTask(taskId, taskItemEl) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    const taskLeft = taskItemEl.querySelector('.task-left');
    const label = taskLeft ? taskLeft.querySelector('.task-label') : null;
    if (!label || taskLeft.querySelector('.task-edit-input')) return;

    const originalText = task.text;

    // Create inline editing input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = originalText;
    input.setAttribute('aria-label', 'Edit task text');

    // Hide label and mount input
    label.classList.add('hidden');
    taskLeft.appendChild(input);
    input.focus();
    input.select();

    let isFinished = false;

    const finishEdit = async (save) => {
      if (isFinished) return;
      isFinished = true;

      const newText = input.value.trim();
      input.remove();
      label.classList.remove('hidden');

      if (save && newText && newText !== originalText) {
        task.text = newText;
        label.textContent = newText;
        await Storage.set('tasks', state.tasks);
      } else {
        label.textContent = originalText;
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit(false);
      }
    });

    input.addEventListener('blur', () => {
      finishEdit(true);
    });
  }

  async function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const todayKey = formatDateKey(new Date());
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      dueDate: state.selectedDate || todayKey
    };

    state.tasks.unshift(newTask);
    await Storage.set('tasks', state.tasks);
    renderTasks();
    renderCalendar();
    elements.taskInput.value = '';

    // Play uplifting task creation pop
    if (state.taskSoundEnabled && state.soundEnabled) {
      Sound.playTaskAdd();
    }
  }

  async function toggleTaskCompleted(id, isCompleted) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      task.completed = isCompleted;
      if (isCompleted) {
        task.completedAt = Date.now();
      } else {
        delete task.completedAt;
      }
      await Storage.set('tasks', state.tasks);

      // Fine-grained DOM update: only mutate this specific task element in place
      const li = elements.taskList ? elements.taskList.querySelector(`.task-item[data-id="${id}"]`) : null;
      if (li) {
        li.classList.toggle('completed', isCompleted);
        const checkbox = li.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked !== isCompleted) {
          checkbox.checked = isCompleted;
        }
        const label = li.querySelector('.task-label');
        if (label) {
          if (isCompleted) {
            label.removeAttribute('title');
          } else {
            label.title = 'Double-click to edit';
          }
        }
      }

      // Play rewarding ASMR micro-pop on completion if sound is enabled
      if (isCompleted && state.soundEnabled && state.taskSoundEnabled) {
        Sound.playTaskPop();
      }

      // Update counters, clear completed visibility & calendar dots without destroying DOM
      updateTaskHeaderState();
      renderCalendar();
    }
  }

  async function deleteTask(id, element) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    await Storage.set('tasks', state.tasks);
    if (element) {
      element.classList.add('removing');
      setTimeout(() => {
        element.remove();
        updateTaskHeaderState();
        renderCalendar();
      }, 160);
    } else {
      renderTasks();
      renderCalendar();
    }
  }

  async function clearCompletedTasks() {
    if (state.selectedDate) {
      state.tasks = state.tasks.filter(t => {
        const matchesDate = (t.dueDate === state.selectedDate) ||
          (formatDateKey(new Date(t.createdAt)) === state.selectedDate);
        return !(matchesDate && t.completed);
      });
    } else {
      // Clear only the completed tasks visible in default view (completed or created today)
      const todayKey = formatDateKey(new Date());
      state.tasks = state.tasks.filter(t => {
        if (!t.completed) return true;
        const isToday = (t.completedAt && formatDateKey(new Date(t.completedAt)) === todayKey) ||
                        (t.createdAt && formatDateKey(new Date(t.createdAt)) === todayKey) ||
                        (t.dueDate === todayKey);
        return !isToday; // Preserve older completed tasks in history
      });
    }
    await Storage.set('tasks', state.tasks);
    renderTasks();
    renderCalendar();
  }

  function setupTaskEvents() {
    elements.taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask(elements.taskInput.value);
    });

    elements.clearCompletedBtn.addEventListener('click', () => {
      clearCompletedTasks();
    });
  }

  // =========================================================================
  // FOCUS, CALENDAR & AMBIENT MUTUALLY EXCLUSIVE TOGGLES
  // =========================================================================
  function toggleFocusMode(forceState) {
    const isDirectToggle = typeof forceState !== 'boolean';
    const nextActive = !isDirectToggle ? forceState : !state.isFocusActive;
    state.isFocusActive = nextActive;

    if (isDirectToggle && state.soundEnabled && state.modeSoundEnabled) {
      Sound.playFocusTap();
    }

    // Mutually exclusive: Close Calendar & Ambient if opening Focus Timer
    if (nextActive) {
      if (state.isZenActive) toggleZenMode(false);
      if (state.isCalendarActive) toggleCalendarMode(false);
      if (state.isAmbientActive) toggleAmbientMode(false);
      hideQuickLinkContextMenu();
    }

    // Smoothly toggle Day, Date & Greeting visibility on center canvas
    const heroCanvas = document.querySelector('.hero-center-canvas');
    if (heroCanvas) {
      heroCanvas.classList.toggle('focus-active', nextActive);
    }

    if (elements.focusToggleBtn) {
      elements.focusToggleBtn.classList.toggle('active', nextActive);
      elements.focusToggleBtn.setAttribute('aria-pressed', String(nextActive));
    }

    if (elements.timerSlideContainer) {
      elements.timerSlideContainer.classList.toggle('expanded', nextActive);
      elements.timerSlideContainer.setAttribute('aria-hidden', String(!nextActive));
    }
  }

  function toggleCalendarMode(forceState) {
    const isDirectToggle = typeof forceState !== 'boolean';
    const nextActive = !isDirectToggle ? forceState : !state.isCalendarActive;
    state.isCalendarActive = nextActive;

    if (isDirectToggle && state.soundEnabled && state.modeSoundEnabled) {
      Sound.playCalendarTap();
    }

    // Mutually exclusive: Close Focus Timer & Ambient if opening Calendar
    if (nextActive) {
      if (state.isZenActive) toggleZenMode(false);
      if (state.isFocusActive) toggleFocusMode(false);
      if (state.isAmbientActive) toggleAmbientMode(false);
      hideQuickLinkContextMenu();
    }

    // Smoothly toggle Day, Date & Greeting visibility on center canvas
    const heroCanvas = document.querySelector('.hero-center-canvas');
    if (heroCanvas) {
      heroCanvas.classList.toggle('calendar-active', nextActive);
    }

    if (elements.calendarToggleBtn) {
      elements.calendarToggleBtn.classList.toggle('active', nextActive);
      elements.calendarToggleBtn.setAttribute('aria-pressed', String(nextActive));
    }

    if (elements.calendarSlideContainer) {
      elements.calendarSlideContainer.classList.toggle('expanded', nextActive);
      elements.calendarSlideContainer.setAttribute('aria-hidden', String(!nextActive));
      if (nextActive) renderCalendar();
    }
  }

  function toggleAmbientMode(forceState) {
    const isDirectToggle = typeof forceState !== 'boolean';
    const nextActive = !isDirectToggle ? forceState : !state.isAmbientActive;
    state.isAmbientActive = nextActive;

    if (isDirectToggle && state.soundEnabled && state.modeSoundEnabled) {
      Sound.playAmbientTap();
    }

    // Mutually exclusive: Close Focus & Calendar panels if opening Ambient
    if (nextActive) {
      if (state.isZenActive) toggleZenMode(false);
      if (state.isFocusActive) toggleFocusMode(false);
      if (state.isCalendarActive) toggleCalendarMode(false);
      hideQuickLinkContextMenu();
    }

    // Smoothly toggle Day, Date & Greeting visibility on center canvas
    const heroCanvas = document.querySelector('.hero-center-canvas');
    if (heroCanvas) {
      heroCanvas.classList.toggle('ambient-active', nextActive);
    }

    if (elements.ambientToggleBtn) {
      elements.ambientToggleBtn.classList.toggle('active', nextActive);
      elements.ambientToggleBtn.setAttribute('aria-pressed', String(nextActive));
    }

    if (elements.ambientSlideContainer) {
      elements.ambientSlideContainer.classList.toggle('expanded', nextActive);
      elements.ambientSlideContainer.setAttribute('aria-hidden', String(!nextActive));
    }
  }

  // =========================================================================
  // ZEN MODE (Distraction-Free Immersion)
  // =========================================================================
  function toggleZenMode(forceState) {
    const isDirectToggle = typeof forceState !== 'boolean';
    const nextActive = !isDirectToggle ? forceState : !state.isZenActive;
    state.isZenActive = nextActive;

    if (isDirectToggle && state.soundEnabled && state.modeSoundEnabled) {
      Sound.playFocusTap();
    }

    document.body.classList.toggle('zen-mode-active', nextActive);

    if (elements.digitalClock) {
      elements.digitalClock.setAttribute('aria-pressed', String(nextActive));
    }

    if (nextActive) {
      // Close any open side sheets, dialogs, context menus, or active panels
      if (elements.settingsSideSheet && elements.settingsSideSheet.classList.contains('open')) {
        closeSettingsSheet();
      }
      if (elements.shortcutsDialog && elements.shortcutsDialog.open) {
        elements.shortcutsDialog.close();
      }
      if (elements.quickLinkDialog && elements.quickLinkDialog.open) {
        closeQuickLinkDialog();
      }
      hideQuickLinkContextMenu();
      if (state.isFocusActive) toggleFocusMode(false);
      if (state.isCalendarActive) toggleCalendarMode(false);
      if (state.isAmbientActive) toggleAmbientMode(false);
    }
  }

  // =========================================================================
  // AMBIENT SOUNDSCAPES CONTROLS & EVENTS
  // =========================================================================
  function setAmbientPreset(presetName) {
    state.ambientPreset = presetName;
    Storage.set('ambientPreset', presetName);

    if (elements.ambientChips) {
      elements.ambientChips.forEach(chip => {
        const match = chip.dataset.preset === presetName;
        chip.classList.toggle('active', match);
        chip.setAttribute('aria-checked', String(match));
      });
    }

    if (state.ambientPlaying) {
      AmbientSound.play(presetName);
    }
  }

  function toggleAmbientPlay(forceState) {
    const nextPlaying = typeof forceState === 'boolean' ? forceState : !state.ambientPlaying;
    state.ambientPlaying = nextPlaying;

    if (nextPlaying) {
      if (!state.soundEnabled) {
        state.soundEnabled = true;
        if (elements.soundIconOn) elements.soundIconOn.classList.remove('hidden');
        if (elements.soundIconOff) elements.soundIconOff.classList.add('hidden');
        Storage.set('soundEnabled', true);
      }
      AmbientSound.play(state.ambientPreset);
      if (elements.ambientEqualizer) elements.ambientEqualizer.classList.remove('hidden');
      if (elements.ambientStatusBadge) {
        elements.ambientStatusBadge.textContent = 'Playing';
        elements.ambientStatusBadge.classList.add('playing');
      }
      if (elements.ambientPlayIcon) elements.ambientPlayIcon.classList.add('hidden');
      if (elements.ambientPauseIcon) elements.ambientPauseIcon.classList.remove('hidden');
      if (elements.ambientPlayText) elements.ambientPlayText.textContent = 'Pause';
      if (elements.ambientToggleBtn) elements.ambientToggleBtn.classList.add('playing');
    } else {
      clearAmbientSleepTimer();
      AmbientSound.stopCurrent(0.25);
      if (elements.ambientEqualizer) elements.ambientEqualizer.classList.add('hidden');
      if (elements.ambientStatusBadge) {
        elements.ambientStatusBadge.textContent = 'Paused';
        elements.ambientStatusBadge.classList.remove('playing');
      }
      if (elements.ambientPlayIcon) elements.ambientPlayIcon.classList.remove('hidden');
      if (elements.ambientPauseIcon) elements.ambientPauseIcon.classList.add('hidden');
      if (elements.ambientPlayText) elements.ambientPlayText.textContent = 'Play';
      if (elements.ambientToggleBtn) elements.ambientToggleBtn.classList.remove('playing');
    }
  }

  function clearAmbientSleepTimer() {
    if (state.ambientSleepIntervalId) {
      clearInterval(state.ambientSleepIntervalId);
      state.ambientSleepIntervalId = null;
    }
    state.ambientSleepMinutes = 0;
    state.ambientSleepEndTime = null;

    if (elements.ambientTimerBtn) {
      elements.ambientTimerBtn.classList.remove('active');
      elements.ambientTimerBtn.setAttribute('aria-label', 'Sleep timer: Off');
      elements.ambientTimerBtn.title = 'Sleep Timer: Off (Click to set 15m, 30m, 45m, 60m)';
    }
    if (elements.ambientTimerTag) {
      elements.ambientTimerTag.textContent = 'Off';
    }
  }

  function cycleAmbientSleepTimer() {
    const cycleOptions = [0, 15, 30, 45, 60];
    const currentIndex = cycleOptions.indexOf(state.ambientSleepMinutes);
    const nextIndex = (currentIndex + 1) % cycleOptions.length;
    const nextMins = cycleOptions[nextIndex];

    if (nextMins === 0) {
      clearAmbientSleepTimer();
      return;
    }

    if (!state.ambientPlaying) {
      toggleAmbientPlay(true);
    }

    state.ambientSleepMinutes = nextMins;
    state.ambientSleepEndTime = Date.now() + (nextMins * 60 * 1000);

    if (elements.ambientTimerBtn) {
      elements.ambientTimerBtn.classList.add('active');
      elements.ambientTimerBtn.setAttribute('aria-label', `Sleep timer: ${nextMins}m`);
    }

    updateAmbientSleepCountdown();

    if (state.ambientSleepIntervalId) {
      clearInterval(state.ambientSleepIntervalId);
    }
    state.ambientSleepIntervalId = setInterval(updateAmbientSleepCountdown, 1000);
  }

  function updateAmbientSleepCountdown() {
    if (!state.ambientSleepEndTime) return;
    const remainingMs = state.ambientSleepEndTime - Date.now();

    if (remainingMs <= 0) {
      // Timer completed: gentle 8-second sleep fade
      clearAmbientSleepTimer();
      state.ambientPlaying = false;
      AmbientSound.stopCurrent(8.0);

      if (elements.ambientEqualizer) elements.ambientEqualizer.classList.add('hidden');
      if (elements.ambientStatusBadge) {
        elements.ambientStatusBadge.textContent = 'Paused';
        elements.ambientStatusBadge.classList.remove('playing');
      }
      if (elements.ambientPlayIcon) elements.ambientPlayIcon.classList.remove('hidden');
      if (elements.ambientPauseIcon) elements.ambientPauseIcon.classList.add('hidden');
      if (elements.ambientPlayText) elements.ambientPlayText.textContent = 'Play';
      if (elements.ambientToggleBtn) elements.ambientToggleBtn.classList.remove('playing');
      return;
    }

    const remMins = Math.ceil(remainingMs / (60 * 1000));
    const tagText = remMins > 0 ? `${remMins}m` : '1m';

    if (elements.ambientTimerTag) {
      elements.ambientTimerTag.textContent = tagText;
    }
    if (elements.ambientTimerBtn) {
      elements.ambientTimerBtn.title = `Auto-off in ${tagText} (Click to cycle)`;
    }
  }

  function setAmbientVolume(val) {
    const clamped = Math.max(0, Math.min(100, Number(val)));
    state.ambientVolume = clamped / 100;
    Storage.set('ambientVolume', clamped);

    if (elements.ambientVolumeSlider) elements.ambientVolumeSlider.value = clamped;
    if (elements.ambientVolumeVal) elements.ambientVolumeVal.textContent = `${clamped}%`;

    AmbientSound.setVolume(state.ambientVolume);

    if (clamped === 0) {
      if (elements.ambientVolumeIconHigh) elements.ambientVolumeIconHigh.classList.add('hidden');
      if (elements.ambientVolumeIconMute) elements.ambientVolumeIconMute.classList.remove('hidden');
    } else {
      if (elements.ambientVolumeIconHigh) elements.ambientVolumeIconHigh.classList.remove('hidden');
      if (elements.ambientVolumeIconMute) elements.ambientVolumeIconMute.classList.add('hidden');
    }
  }

  function setupAmbientEvents() {
    if (elements.ambientChips) {
      elements.ambientChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const preset = chip.dataset.preset;
          setAmbientPreset(preset);
        });
      });
    }

    if (elements.ambientPlayBtn) {
      elements.ambientPlayBtn.addEventListener('click', () => toggleAmbientPlay());
    }

    if (elements.ambientTimerBtn) {
      elements.ambientTimerBtn.addEventListener('click', () => cycleAmbientSleepTimer());
    }

    if (elements.ambientVolumeSlider) {
      elements.ambientVolumeSlider.addEventListener('input', (e) => {
        setAmbientVolume(e.target.value);
      });
    }

    if (elements.ambientMuteBtn) {
      elements.ambientMuteBtn.addEventListener('click', () => {
        if (state.ambientVolume > 0) {
          state.prevAmbientVolume = state.ambientVolume;
          setAmbientVolume(0);
        } else {
          setAmbientVolume((state.prevAmbientVolume || 0.7) * 100);
        }
      });
    }
  }

  // =========================================================================
  // CALENDAR VIEW MODULE (Current Month, Disabled Elapsed Dates, Navigation)
  // =========================================================================
  function renderCalendar() {
    if (!elements.calendarGrid) return;
    elements.calendarGrid.innerHTML = '';

    const today = new Date();
    const todayKey = formatDateKey(today);

    const viewYear = state.calendarViewDate.getFullYear();
    const viewMonth = state.calendarViewDate.getMonth();

    // Set Month Year title (e.g. "September 2026")
    const monthTitle = state.calendarViewDate.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
    if (elements.calMonthYear) {
      elements.calMonthYear.textContent = monthTitle;
    }

    // Days in current, previous and start weekday (Monday = 0, Sunday = 6)
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // 1. Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.textContent = dayNum;
      cell.setAttribute('aria-hidden', 'true');
      elements.calendarGrid.appendChild(cell);
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(viewYear, viewMonth, d);
      const dateKey = formatDateKey(cellDate);

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cal-day-cell';
      cell.textContent = d;
      cell.dataset.date = dateKey;
      cell.setAttribute('aria-label', cellDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));

      // Check if Today
      const isToday = dateKey === todayKey;
      if (isToday) {
        cell.classList.add('today');
        cell.title = 'Today';
      }

      // Check if Past date in current month (Completed/elapsed date with disabled opacity)
      const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (isPast) {
        cell.classList.add('past');
        cell.title = isToday ? 'Today' : 'Completed / Elapsed date';
      }

      // Check if Selected
      if (state.selectedDate === dateKey) {
        cell.classList.add('selected');
        cell.setAttribute('aria-selected', 'true');
      }

      // Check tasks scheduled or created on this day
      const dayTasks = state.tasks.filter(t => {
        if (t.dueDate) return t.dueDate === dateKey;
        const createdKey = formatDateKey(new Date(t.createdAt));
        return createdKey === dateKey;
      });

      if (dayTasks.length > 0) {
        const dotsWrap = document.createElement('div');
        dotsWrap.className = 'cal-day-dots';
        const dot = document.createElement('span');
        dot.className = 'cal-task-dot';
        const allCompleted = dayTasks.every(t => t.completed);
        if (allCompleted) {
          dot.classList.add('all-done');
        }
        dotsWrap.appendChild(dot);
        cell.appendChild(dotsWrap);
      }

      // Click event for date selection & task filtering
      cell.addEventListener('click', () => {
        if (state.selectedDate === dateKey) {
          // Deselect
          state.selectedDate = null;
        } else {
          state.selectedDate = dateKey;
        }
        renderCalendar();
        renderTasks();
      });

      elements.calendarGrid.appendChild(cell);
    }

    // 3. Leading days for next month to fill complete rows of 7
    const totalRendered = firstDayIndex + daysInMonth;
    const nextDaysNeeded = (7 - (totalRendered % 7)) % 7;
    for (let j = 1; j <= nextDaysNeeded; j++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.textContent = j;
      cell.setAttribute('aria-hidden', 'true');
      elements.calendarGrid.appendChild(cell);
    }
  }

  function prevMonth() {
    state.calendarViewDate.setMonth(state.calendarViewDate.getMonth() - 1);
    state.calendarViewDate = new Date(state.calendarViewDate);
    renderCalendar();
  }

  function nextMonth() {
    state.calendarViewDate.setMonth(state.calendarViewDate.getMonth() + 1);
    state.calendarViewDate = new Date(state.calendarViewDate);
    renderCalendar();
  }

  function jumpToToday() {
    state.calendarViewDate = new Date();
    renderCalendar();
  }

  function setupCalendarEvents() {
    if (elements.calPrevBtn) {
      elements.calPrevBtn.addEventListener('click', prevMonth);
    }
    if (elements.calNextBtn) {
      elements.calNextBtn.addEventListener('click', nextMonth);
    }
    if (elements.calTodayBtn) {
      elements.calTodayBtn.addEventListener('click', jumpToToday);
    }
    if (elements.filterRemoveBtn) {
      elements.filterRemoveBtn.addEventListener('click', () => {
        state.selectedDate = null;
        renderCalendar();
        renderTasks();
      });
    }
  }

  // =========================================================================
  // QUICK LINKS & SHORTCUTS MODULE
  // =========================================================================
  const MAX_QUICK_LINKS = 8;
  const DEFAULT_QUICK_LINKS = [
    { id: 'ql_github', title: 'GitHub', url: 'https://github.com' },
    { id: 'ql_youtube', title: 'YouTube', url: 'https://youtube.com' },
    { id: 'ql_gmail', title: 'Gmail', url: 'https://mail.google.com' },
    { id: 'ql_notion', title: 'Notion', url: 'https://notion.so' },
    { id: 'ql_reddit', title: 'Reddit', url: 'https://reddit.com' },
    { id: 'ql_twitter', title: 'X', url: 'https://x.com' }
  ];

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

  function createGlobeIconElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'quick-link-globe-container hidden';
    wrapper.innerHTML = `
      <svg class="quick-link-default-globe" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    `.trim();
    return wrapper;
  }

  async function fetchChromeTopSites() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.topSites && typeof chrome.topSites.get === 'function') {
        try {
          chrome.topSites.get((sites) => {
            if (Array.isArray(sites) && sites.length > 0) {
              const filtered = sites
                .filter(s => s && s.url && !s.url.startsWith('chrome://') && !s.url.startsWith('chrome-extension://'))
                .slice(0, MAX_QUICK_LINKS)
                .map((s, idx) => ({
                  id: `ql_ts_${idx}_${Date.now()}`,
                  title: s.title ? s.title.slice(0, 24) : extractDomainTitle(s.url),
                  url: s.url
                }));
              if (filtered.length > 0) {
                resolve(filtered);
                return;
              }
            }
            resolve(DEFAULT_QUICK_LINKS);
          });
        } catch (e) {
          resolve(DEFAULT_QUICK_LINKS);
        }
      } else {
        resolve(DEFAULT_QUICK_LINKS);
      }
    });
  }

  function renderQuickLinks() {
    if (!elements.quickLinksSection || !elements.quickLinksGrid) return;

    if (!state.showQuickLinks) {
      elements.quickLinksSection.classList.add('hidden');
      elements.quickLinksSection.setAttribute('aria-hidden', 'true');
      return;
    }

    elements.quickLinksSection.classList.remove('hidden');
    elements.quickLinksSection.removeAttribute('aria-hidden');
    elements.quickLinksGrid.innerHTML = '';

    const rawLinks = Array.isArray(state.quickLinks) ? state.quickLinks : [];
    const links = rawLinks.slice(0, MAX_QUICK_LINKS);

    links.forEach((link) => {
      const card = document.createElement('a');
      card.className = 'quick-link-card';
      card.href = link.url;
      card.dataset.id = link.id;
      card.title = `${link.title}\n(Right-click for options)`;
      card.setAttribute('role', 'link');

      // Squircle Favicon Wrapper
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'quick-link-icon-wrapper';

      const img = document.createElement('img');
      img.className = 'quick-link-icon';
      img.alt = link.title || '';
      img.decoding = 'async';

      // Material Design 3 Filled SVG Default Globe Icon
      const globeWrapper = createGlobeIconElement();

      let triedFallback = false;
      const showGlobeFallback = () => {
        if (!triedFallback) {
          triedFallback = true;
          try {
            const parsed = new URL(link.url);
            const host = parsed.hostname.replace(/^www\./i, '');
            img.src = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
            return;
          } catch (e) {}
        }
        img.style.display = 'none';
        globeWrapper.classList.remove('hidden');
      };

      img.addEventListener('error', showGlobeFallback);
      img.addEventListener('load', () => {
        if (img.naturalWidth <= 1) {
          showGlobeFallback();
        } else {
          img.style.display = 'block';
          globeWrapper.classList.add('hidden');
        }
      });

      const faviconSrc = getFaviconUrl(link.url);
      if (faviconSrc) {
        img.src = faviconSrc;
      } else {
        showGlobeFallback();
      }

      iconWrapper.appendChild(img);
      iconWrapper.appendChild(globeWrapper);

      // Label below
      const label = document.createElement('span');
      label.className = 'quick-link-label';
      label.textContent = link.title || extractDomainTitle(link.url);

      card.appendChild(iconWrapper);
      card.appendChild(label);

      // Context menu on right click
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showQuickLinkContextMenu(e.clientX, e.clientY, link.id);
      });

      // Sound feedback on click
      card.addEventListener('click', () => {
        if (state.soundEnabled && state.modeSoundEnabled) {
          Sound.playFocusTap();
        }
      });

      elements.quickLinksGrid.appendChild(card);
    });

    // Enforce max 8 shortcuts: hide Add button if reached
    if (elements.quickLinkAddBtn) {
      if (links.length >= MAX_QUICK_LINKS) {
        elements.quickLinkAddBtn.classList.add('max-reached');
        elements.quickLinkAddBtn.setAttribute('aria-hidden', 'true');
      } else {
        elements.quickLinkAddBtn.classList.remove('max-reached');
        elements.quickLinkAddBtn.removeAttribute('aria-hidden');
      }
    }
  }

  function showQuickLinkContextMenu(clientX, clientY, linkId) {
    if (!elements.quickLinkContextMenu) return;
    state.activeContextMenuLinkId = linkId;

    elements.quickLinkContextMenu.classList.remove('hidden');

    const menuWidth = elements.quickLinkContextMenu.offsetWidth || 180;
    const menuHeight = elements.quickLinkContextMenu.offsetHeight || 150;
    const padding = 12;

    let posX = clientX;
    let posY = clientY;

    if (posX + menuWidth > window.innerWidth - padding) {
      posX = window.innerWidth - menuWidth - padding;
    }
    if (posY + menuHeight > window.innerHeight - padding) {
      posY = window.innerHeight - menuHeight - padding;
    }

    elements.quickLinkContextMenu.style.left = `${Math.max(padding, posX)}px`;
    elements.quickLinkContextMenu.style.top = `${Math.max(padding, posY)}px`;
  }

  function hideQuickLinkContextMenu() {
    if (!elements.quickLinkContextMenu) return;
    elements.quickLinkContextMenu.classList.add('hidden');
    state.activeContextMenuLinkId = null;
  }

  function setupQuickLinkContextMenuEvents() {
    if (!elements.quickLinkContextMenu) return;

    elements.quickLinkContextMenu.addEventListener('click', async (e) => {
      const item = e.target.closest('.context-menu-item');
      if (!item) return;

      const action = item.dataset.action;
      const targetId = state.activeContextMenuLinkId;
      hideQuickLinkContextMenu();

      if (!targetId) return;
      const link = state.quickLinks.find(l => l.id === targetId);
      if (!link) return;

      if (action === 'open-new') {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      } else if (action === 'edit') {
        openQuickLinkDialog(link);
      } else if (action === 'copy') {
        try {
          await navigator.clipboard.writeText(link.url);
        } catch (err) {
          const textarea = document.createElement('textarea');
          textarea.value = link.url;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
      } else if (action === 'delete') {
        state.quickLinks = state.quickLinks.filter(l => l.id !== targetId);
        await Storage.set('quickLinks', state.quickLinks);
        renderQuickLinks();
        if (state.soundEnabled && state.taskSoundEnabled) {
          Sound.playTaskPop();
        }
      }
    });

    window.addEventListener('click', (e) => {
      if (elements.quickLinkContextMenu && !elements.quickLinkContextMenu.contains(e.target)) {
        hideQuickLinkContextMenu();
      }
    });

    window.addEventListener('blur', hideQuickLinkContextMenu);
    window.addEventListener('resize', hideQuickLinkContextMenu);
  }

  function openQuickLinkDialog(linkToEdit = null) {
    if (!elements.quickLinkDialog) return;
    hideQuickLinkContextMenu();

    if (linkToEdit) {
      state.editingQuickLinkId = linkToEdit.id;
      if (elements.quickLinkDialogTitle) elements.quickLinkDialogTitle.textContent = 'Edit Shortcut';
      if (elements.quickLinkTitleInput) elements.quickLinkTitleInput.value = linkToEdit.title;
      if (elements.quickLinkUrlInput) elements.quickLinkUrlInput.value = linkToEdit.url;
    } else {
      if (state.quickLinks.length >= MAX_QUICK_LINKS) {
        return;
      }
      state.editingQuickLinkId = null;
      if (elements.quickLinkDialogTitle) elements.quickLinkDialogTitle.textContent = 'Add Shortcut';
      if (elements.quickLinkTitleInput) elements.quickLinkTitleInput.value = '';
      if (elements.quickLinkUrlInput) elements.quickLinkUrlInput.value = '';
    }

    elements.quickLinkDialog.showModal();
    setTimeout(() => {
      if (elements.quickLinkTitleInput) elements.quickLinkTitleInput.focus();
    }, 50);
  }

  function closeQuickLinkDialog() {
    if (!elements.quickLinkDialog) return;
    elements.quickLinkDialog.close();
    state.editingQuickLinkId = null;
  }

  function setupQuickLinksEvents() {
    if (elements.quickLinkAddBtn) {
      elements.quickLinkAddBtn.addEventListener('click', () => openQuickLinkDialog());
    }

    if (elements.closeQuickLinkDialogBtn) {
      elements.closeQuickLinkDialogBtn.addEventListener('click', closeQuickLinkDialog);
    }
    if (elements.cancelQuickLinkBtn) {
      elements.cancelQuickLinkBtn.addEventListener('click', closeQuickLinkDialog);
    }

    if (elements.quickLinkDialog) {
      elements.quickLinkDialog.addEventListener('click', (e) => {
        if (e.target === elements.quickLinkDialog) {
          closeQuickLinkDialog();
        }
      });
    }

    if (elements.quickLinkForm) {
      elements.quickLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawUrl = elements.quickLinkUrlInput ? elements.quickLinkUrlInput.value : '';
        const normalized = normalizeUrl(rawUrl);
        if (!normalized) return;

        let title = (elements.quickLinkTitleInput ? elements.quickLinkTitleInput.value : '').trim();
        if (!title) {
          title = extractDomainTitle(normalized);
        }

        if (state.editingQuickLinkId) {
          const idx = state.quickLinks.findIndex(l => l.id === state.editingQuickLinkId);
          if (idx !== -1) {
            state.quickLinks[idx].title = title;
            state.quickLinks[idx].url = normalized;
          }
        } else {
          if (state.quickLinks.length >= MAX_QUICK_LINKS) {
            closeQuickLinkDialog();
            return;
          }
          state.quickLinks.push({
            id: `ql_${Date.now()}`,
            title,
            url: normalized
          });
        }

        await Storage.set('quickLinks', state.quickLinks);
        renderQuickLinks();
        closeQuickLinkDialog();

        if (state.soundEnabled && state.taskSoundEnabled) {
          Sound.playTaskAdd();
        }
      });
    }

    setupQuickLinkContextMenuEvents();
  }

  // =========================================================================
  // THEMES & CONTROLS MODULE
  // =========================================================================
  // =========================================================================
  // THEMES & SETTINGS MODULE
  // =========================================================================
  function syncColonAnimations() {
    const mainColon = elements.clockColonMain || document.getElementById('clock-colon-main');
    const secColon = elements.clockColonSec || document.getElementById('clock-colon-sec');
    if (mainColon && secColon && typeof mainColon.getAnimations === 'function') {
      const mainAnims = mainColon.getAnimations();
      const secAnims = secColon.getAnimations();
      if (mainAnims.length > 0 && secAnims.length > 0) {
        secAnims[0].currentTime = mainAnims[0].currentTime;
      }
    }
  }

  function applyTheme(color) {
    state.theme = color;
    document.documentElement.dataset.theme = color;
    if (elements.paletteSwatches) {
      elements.paletteSwatches.forEach(card => {
        const isSelected = card.dataset.color === color;
        card.setAttribute('aria-checked', String(isSelected));
      });
    }
    Storage.set('theme', color);
  }

  function updateFormatButtons() {
    if (!elements.format12hBtn || !elements.format24hBtn) return;
    if (state.clockFormat === '24h') {
      elements.format24hBtn.classList.add('active');
      elements.format12hBtn.classList.remove('active');
    } else {
      elements.format12hBtn.classList.add('active');
      elements.format24hBtn.classList.remove('active');
    }
  }

  function openSettingsSheet() {
    if (!elements.settingsSideSheet) return;
    if (state.isZenActive) toggleZenMode(false);

    // Sync inputs with current state before opening
    if (elements.settingsNameInput) elements.settingsNameInput.value = state.userName || '';
    if (elements.settingsGreetingToggle) elements.settingsGreetingToggle.checked = Boolean(state.showGreeting);
    if (elements.settingsMotivationToggle) elements.settingsMotivationToggle.checked = Boolean(state.showMotivation);
    if (elements.settingsSecondsToggle) elements.settingsSecondsToggle.checked = Boolean(state.showSeconds);
    if (elements.settingsDateToggle) elements.settingsDateToggle.checked = Boolean(state.showDate);
    if (elements.settingsSoundToggle) elements.settingsSoundToggle.checked = Boolean(state.soundEnabled);
    if (elements.settingsTaskSoundToggle) elements.settingsTaskSoundToggle.checked = Boolean(state.taskSoundEnabled);
    if (elements.settingsModeSoundToggle) elements.settingsModeSoundToggle.checked = Boolean(state.modeSoundEnabled);
    updateFormatButtons();
    applyTheme(state.theme);

    elements.settingsSideSheet.classList.add('open');
    elements.settingsSideSheet.setAttribute('aria-hidden', 'false');
    if (elements.settingsScrim) {
      elements.settingsScrim.classList.remove('hidden');
      void elements.settingsScrim.offsetWidth; // force reflow for smooth opacity fade
      elements.settingsScrim.classList.add('visible');
    }
    if (elements.settingsBtn) {
      elements.settingsBtn.classList.add('active');
    }
  }

  function closeSettingsSheet() {
    if (!elements.settingsSideSheet) return;
    elements.settingsSideSheet.classList.remove('open');
    elements.settingsSideSheet.setAttribute('aria-hidden', 'true');
    if (elements.settingsScrim) {
      elements.settingsScrim.classList.remove('visible');
      setTimeout(() => {
        if (!elements.settingsSideSheet.classList.contains('open')) {
          elements.settingsScrim.classList.add('hidden');
        }
      }, 250);
    }
    if (elements.settingsBtn) {
      elements.settingsBtn.classList.remove('active');
    }
  }

  function setupSettingsEvents() {
    if (!elements.settingsBtn || !elements.settingsSideSheet) return;

    // Toggle Settings Side Sheet
    elements.settingsBtn.addEventListener('click', () => {
      const isOpen = elements.settingsSideSheet.classList.contains('open');
      if (isOpen) {
        closeSettingsSheet();
      } else {
        openSettingsSheet();
      }
    });

    // Close triggers
    if (elements.closeSettingsBtn) {
      elements.closeSettingsBtn.addEventListener('click', closeSettingsSheet);
    }
    if (elements.confirmSettingsBtn) {
      elements.confirmSettingsBtn.addEventListener('click', closeSettingsSheet);
    }
    if (elements.settingsScrim) {
      elements.settingsScrim.addEventListener('click', closeSettingsSheet);
    }

    // Live Name Input
    if (elements.settingsNameInput) {
      elements.settingsNameInput.addEventListener('input', (e) => {
        state.userName = e.target.value;
        updateClock();
        Storage.set('userName', state.userName);
      });
    }

    // Greeting Toggle
    if (elements.settingsGreetingToggle) {
      elements.settingsGreetingToggle.addEventListener('change', (e) => {
        state.showGreeting = e.target.checked;
        updateClock();
        Storage.set('showGreeting', state.showGreeting);
      });
    }

    // Daily Supportive Motivation Message Toggle
    if (elements.settingsMotivationToggle) {
      elements.settingsMotivationToggle.addEventListener('change', (e) => {
        state.showMotivation = e.target.checked;
        updateClock();
        Storage.set('showMotivation', state.showMotivation);
      });
    }

    // 12h / 24h Format Buttons
    if (elements.format12hBtn) {
      elements.format12hBtn.addEventListener('click', () => {
        state.clockFormat = '12h';
        updateFormatButtons();
        updateClock();
        Storage.set('clockFormat', '12h');
      });
    }
    if (elements.format24hBtn) {
      elements.format24hBtn.addEventListener('click', () => {
        state.clockFormat = '24h';
        updateFormatButtons();
        updateClock();
        Storage.set('clockFormat', '24h');
      });
    }

    // Seconds Toggle
    if (elements.settingsSecondsToggle) {
      elements.settingsSecondsToggle.addEventListener('change', (e) => {
        state.showSeconds = e.target.checked;
        updateClock();
        syncColonAnimations();
        Storage.set('showSeconds', state.showSeconds);
      });
    }

    // Date Toggle
    if (elements.settingsDateToggle) {
      elements.settingsDateToggle.addEventListener('change', (e) => {
        state.showDate = e.target.checked;
        updateClock();
        Storage.set('showDate', state.showDate);
      });
    }

    // Sound Toggle in Settings Modal (synchronized with top bar icon)
    if (elements.settingsSoundToggle) {
      elements.settingsSoundToggle.addEventListener('change', (e) => {
        state.soundEnabled = e.target.checked;
        if (state.soundEnabled) {
          elements.soundIconOn.classList.remove('hidden');
          elements.soundIconOff.classList.add('hidden');
        } else {
          elements.soundIconOn.classList.add('hidden');
          elements.soundIconOff.classList.remove('hidden');
          if (state.ambientPlaying) toggleAmbientPlay(false);
        }
        Storage.set('soundEnabled', state.soundEnabled);
      });
    }

    // Task Sounds Toggle
    if (elements.settingsTaskSoundToggle) {
      elements.settingsTaskSoundToggle.addEventListener('change', async (e) => {
        state.taskSoundEnabled = e.target.checked;
        await Storage.set('taskSoundEnabled', state.taskSoundEnabled);
        if (state.taskSoundEnabled && state.soundEnabled) {
          Sound.playTaskAdd(); // Instant preview feedback
        }
      });
    }

    // Mode Switch Sounds Toggle
    if (elements.settingsModeSoundToggle) {
      elements.settingsModeSoundToggle.addEventListener('change', async (e) => {
        state.modeSoundEnabled = e.target.checked;
        await Storage.set('modeSoundEnabled', state.modeSoundEnabled);
        if (state.modeSoundEnabled && state.soundEnabled) {
          Sound.playFocusTap(); // Instant preview feedback
        }
      });
    }

    // Accent Palette Swatches
    if (elements.paletteSwatches) {
      elements.paletteSwatches.forEach(card => {
        card.addEventListener('click', () => {
          const color = card.dataset.color;
          applyTheme(color);
        });
      });
    }

    // Quick Links Toggle in Settings
    if (elements.settingsQuickLinksToggle) {
      elements.settingsQuickLinksToggle.addEventListener('change', async (e) => {
        state.showQuickLinks = e.target.checked;
        await Storage.set('showQuickLinks', state.showQuickLinks);
        renderQuickLinks();
      });
    }

    // Re-sync Chrome Top Sites
    if (elements.resyncTopSitesBtn) {
      elements.resyncTopSitesBtn.addEventListener('click', async () => {
        const span = elements.resyncTopSitesBtn.querySelector('span');
        const originalText = span ? span.textContent : 'Re-sync Top Sites';
        if (span) span.textContent = 'Syncing...';

        const sites = await fetchChromeTopSites();
        state.quickLinks = sites.slice(0, MAX_QUICK_LINKS);
        await Storage.set('quickLinks', state.quickLinks);
        renderQuickLinks();

        if (span) span.textContent = 'Synced!';
        if (state.soundEnabled && state.taskSoundEnabled) {
          Sound.playTaskAdd();
        }

        setTimeout(() => {
          if (span) span.textContent = originalText;
        }, 1800);
      });
    }
  }

  function setupControls() {
    // Master Sound Toggle
    elements.soundToggleBtn.addEventListener('click', async () => {
      state.soundEnabled = !state.soundEnabled;
      if (state.soundEnabled) {
        elements.soundIconOn.classList.remove('hidden');
        elements.soundIconOff.classList.add('hidden');
        // No chime played on unmute per user request
      } else {
        elements.soundIconOn.classList.add('hidden');
        elements.soundIconOff.classList.remove('hidden');
        // Muting master sound also mutes/stops active ambient soundscapes
        if (state.ambientPlaying) {
          toggleAmbientPlay(false);
        }
      }
      if (elements.settingsSoundToggle) {
        elements.settingsSoundToggle.checked = state.soundEnabled;
      }
      await Storage.set('soundEnabled', state.soundEnabled);
    });

    // Focus Toggle Button
    if (elements.focusToggleBtn) {
      elements.focusToggleBtn.addEventListener('click', () => toggleFocusMode());
    }

    // Calendar Toggle Button
    if (elements.calendarToggleBtn) {
      elements.calendarToggleBtn.addEventListener('click', () => toggleCalendarMode());
    }

    // Ambient Toggle Button
    if (elements.ambientToggleBtn) {
      elements.ambientToggleBtn.addEventListener('click', () => toggleAmbientMode());
    }

    // Digital Clock Click to Enter Zen Mode
    if (elements.digitalClock) {
      elements.digitalClock.addEventListener('click', (e) => {
        if (!state.isZenActive) {
          e.stopPropagation();
          toggleZenMode(true);
        } else {
          toggleZenMode(false);
        }
      });
      elements.digitalClock.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !state.isZenActive) {
          e.preventDefault();
          toggleZenMode(true);
        }
      });
    }

    // Clicking anywhere on screen exits Zen Mode smoothly
    window.addEventListener('click', () => {
      if (state.isZenActive) {
        toggleZenMode(false);
      }
    });

    // Shortcuts Modal
    elements.helpBtn.addEventListener('click', () => {
      elements.shortcutsDialog.showModal();
    });
    elements.closeDialogBtn.addEventListener('click', () => {
      elements.shortcutsDialog.close();
    });
    elements.confirmDialogBtn.addEventListener('click', () => {
      elements.shortcutsDialog.close();
    });
    elements.shortcutsDialog.addEventListener('click', (e) => {
      if (e.target === elements.shortcutsDialog) {
        elements.shortcutsDialog.close();
      }
    });

    // Request Notification permission if supported
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission();
      }, 3000);
    }
  }

  // =========================================================================
  // KEYBOARD SHORTCUTS
  // =========================================================================
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable;

      if (e.key === 'Escape') {
        if (state.isZenActive) {
          toggleZenMode(false);
        } else if (elements.quickLinkContextMenu && !elements.quickLinkContextMenu.classList.contains('hidden')) {
          hideQuickLinkContextMenu();
        } else if (elements.quickLinkDialog && elements.quickLinkDialog.open) {
          closeQuickLinkDialog();
        } else if (elements.settingsSideSheet && elements.settingsSideSheet.classList.contains('open')) {
          closeSettingsSheet();
        } else if (elements.shortcutsDialog && elements.shortcutsDialog.open) {
          elements.shortcutsDialog.close();
        } else if (isInput) {
          activeEl.blur();
        } else if (state.selectedDate) {
          state.selectedDate = null;
          renderCalendar();
          renderTasks();
        } else if (state.isAmbientActive) {
          toggleAmbientMode(false);
        } else if (state.isCalendarActive) {
          toggleCalendarMode(false);
        } else if (state.isFocusActive) {
          toggleFocusMode(false);
        }
        return;
      }

      if (!isInput) {
        if (e.key === '/' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          elements.taskInput.focus();
        } else if (e.key === ' ' || e.code === 'Space') {
          if (state.isFocusActive) {
            e.preventDefault();
            elements.timerStartBtn.click();
          }
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          toggleFocusMode();
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          toggleCalendarMode();
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          toggleAmbientMode();
        } else if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          toggleZenMode();
        } else if (e.key === '?') {
          e.preventDefault();
          elements.shortcutsDialog.showModal();
        }
      }
    });
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  async function init() {
    // Load persisted preferences
    const [theme, soundEnabled, taskSoundEnabled, modeSoundEnabled, timerPresets, activePresetType, savedPresetMins, tasks, savedPreset, savedVol, userName, showGreeting, showMotivation, clockFormat, showSeconds, showDate, showQuickLinks, savedQuickLinks] = await Promise.all([
      Storage.get('theme', 'indigo'),
      Storage.get('soundEnabled', true),
      Storage.get('taskSoundEnabled', true),
      Storage.get('modeSoundEnabled', true),
      Storage.get('timerPresets', { focus: 25, shortBreak: 5, longBreak: 15 }),
      Storage.get('activePresetType', 'focus'),
      Storage.get('activePresetMinutes', 25),
      Storage.get('tasks', [
        { id: 'default_1', text: 'Plan today\'s priorities', completed: false, createdAt: Date.now() - 1000 },
        { id: 'default_2', text: 'Stay hydrated', completed: true, createdAt: Date.now() - 2000 }
      ]),
      Storage.get('ambientPreset', 'rain'),
      Storage.get('ambientVolume', 70),
      Storage.get('userName', ''),
      Storage.get('showGreeting', true),
      Storage.get('showMotivation', true),
      Storage.get('clockFormat', '12h'),
      Storage.get('showSeconds', false),
      Storage.get('showDate', true),
      Storage.get('showQuickLinks', true),
      Storage.get('quickLinks', null)
    ]);

    // Apply loaded state
    applyTheme(theme);

    // Profile & Greeting Name
    state.userName = typeof userName === 'string' ? userName : '';
    state.showGreeting = typeof showGreeting !== 'undefined' ? Boolean(showGreeting) : true;
    state.showMotivation = typeof showMotivation !== 'undefined' ? Boolean(showMotivation) : true;
    state.clockFormat = clockFormat === '24h' ? '24h' : '12h';
    state.showSeconds = Boolean(showSeconds);
    state.showDate = typeof showDate !== 'undefined' ? Boolean(showDate) : true;

    state.soundEnabled = Boolean(soundEnabled);
    state.taskSoundEnabled = typeof taskSoundEnabled !== 'undefined' ? Boolean(taskSoundEnabled) : true;
    state.modeSoundEnabled = typeof modeSoundEnabled !== 'undefined' ? Boolean(modeSoundEnabled) : true;
    if (!state.soundEnabled) {
      elements.soundIconOn.classList.add('hidden');
      elements.soundIconOff.classList.remove('hidden');
    }

    // Initialize 3 Editable Presets
    if (timerPresets && typeof timerPresets === 'object') {
      state.timerPresets = {
        focus: Number(timerPresets.focus) || 25,
        shortBreak: Number(timerPresets.shortBreak) || 5,
        longBreak: Number(timerPresets.longBreak) || 15
      };
    }
    const validPresetType = ['focus', 'shortBreak', 'longBreak'].includes(activePresetType) ? activePresetType : 'focus';
    state.activePresetType = validPresetType;
    state.timerPresetMinutes = (state.timerPresets && state.timerPresets[state.activePresetType]) || Number(savedPresetMins) || 25;
    updatePresetChipsUI();

    state.tasks = sortTasksOnLoad(Array.isArray(tasks) ? tasks : []);
    await Storage.set('tasks', state.tasks);

    // Set up modules
    updateClock();
    syncColonAnimations();
    setInterval(updateClock, 1000);

    resetTimer();
    setupTimerEvents();

    renderTasks();
    setupTaskEvents();

    renderCalendar();
    setupCalendarEvents();

    if (savedPreset) setAmbientPreset(savedPreset);
    if (typeof savedVol !== 'undefined') setAmbientVolume(savedVol);
    setupAmbientEvents();

    // Quick Links
    state.showQuickLinks = typeof showQuickLinks !== 'undefined' ? Boolean(showQuickLinks) : true;
    if (elements.settingsQuickLinksToggle) {
      elements.settingsQuickLinksToggle.checked = state.showQuickLinks;
    }

    if (Array.isArray(savedQuickLinks) && savedQuickLinks.length > 0) {
      state.quickLinks = savedQuickLinks.slice(0, MAX_QUICK_LINKS);
    } else if (savedQuickLinks === null) {
      state.quickLinks = await fetchChromeTopSites();
      await Storage.set('quickLinks', state.quickLinks);
    } else {
      state.quickLinks = [];
    }

    renderQuickLinks();
    setupQuickLinksEvents();

    setupSettingsEvents();
    setupControls();
    setupKeyboardShortcuts();
    setupQuietModeEvents();
  }

  // =========================================================================
  // QUIET / ZEN AMBIENT IDLE MODE (Auto-fades options after 4s of inactivity)
  // =========================================================================
  let idleTimer = null;
  const IDLE_TIMEOUT_MS = 4000;

  function wakeFromQuietMode() {
    if (document.body.classList.contains('quiet-mode-active')) {
      document.body.classList.remove('quiet-mode-active');
    }
    resetIdleTimer();
  }

  function enterQuietMode() {
    // Check exemptions:
    // 1. If an input or editable element is focused
    const activeEl = document.activeElement;
    const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    if (isInputFocused) {
      resetIdleTimer();
      return;
    }

    // 2. If shortcuts dialog modal is open
    if (elements.shortcutsDialog && elements.shortcutsDialog.open) {
      resetIdleTimer();
      return;
    }

    // 3. If settings side sheet is open
    if (elements.settingsSideSheet && elements.settingsSideSheet.classList.contains('open')) {
      resetIdleTimer();
      return;
    }

    // 4. If Quick Link dialog is open or context menu is visible
    if (elements.quickLinkDialog && elements.quickLinkDialog.open) {
      resetIdleTimer();
      return;
    }
    if (elements.quickLinkContextMenu && !elements.quickLinkContextMenu.classList.contains('hidden')) {
      resetIdleTimer();
      return;
    }

    document.body.classList.add('quiet-mode-active');
  }

  function resetIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    idleTimer = setTimeout(enterQuietMode, IDLE_TIMEOUT_MS);
  }

  function setupQuietModeEvents() {
    // Activity triggers that wake or reset the quiet timer
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, wakeFromQuietMode, { passive: true });
    });

    // Start initial countdown
    resetIdleTimer();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
