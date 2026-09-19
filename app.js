/**
 * Momentum M3 - Focus & Tasks Chrome New Tab Extension
 * Complete application logic: Storage, 2-Digit 12H Clock, Greeting (Saipavan),
 * Slide-in Focus Timer, Right-Docked To-Do, Themes, Audio.
 */

(function () {
  'use strict';

  // =========================================================================
  // STORAGE ADAPTER (Chrome Storage Local with LocalStorage Fallback)
  // =========================================================================
  const Storage = {
    async get(key, defaultValue) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            if (result && result[key] !== undefined) {
              resolve(result[key]);
            } else {
              resolve(defaultValue);
            }
          });
        });
      } else {
        try {
          const val = localStorage.getItem(key);
          return val !== null ? JSON.parse(val) : defaultValue;
        } catch (e) {
          console.warn('LocalStorage error:', e);
          return defaultValue;
        }
      }
    },

    async set(key, value) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, resolve);
        });
      } else {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      }
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
  // AMBIENT SOUNDSCAPES ENGINE (Authentic Natural Audio & Seamless Looping)
  // =========================================================================
  const AmbientSound = {
    currentPreset: null,
    isPlaying: false,
    players: {},
    fadeTimers: {},

    soundMap: {
      rain: 'audio/rain.mp3',
      waves: 'audio/ocean.mp3',
      brown: 'audio/brown.wav',
      fire: 'audio/fireplace.mp3',
      wind: 'audio/wind.mp3',
      cafe: 'audio/cafe.mp3',
      night: 'audio/night.mp3'
    },

    init() {
      if (Object.keys(this.players).length > 0) return;
      Object.keys(this.soundMap).forEach(key => {
        try {
          const audio = new Audio();
          audio.src = this.soundMap[key];
          audio.loop = true;
          audio.preload = 'auto';
          audio.volume = 0;
          this.players[key] = audio;
        } catch (e) {
          console.warn('Failed to initialize audio player:', key, e);
        }
      });
    },

    setVolume(val) {
      this.init();
      const clamped = Math.max(0, Math.min(1.0, val));
      if (this.currentPreset && this.players[this.currentPreset] && this.isPlaying) {
        if (!this.fadeTimers[this.currentPreset]) {
          this.players[this.currentPreset].volume = clamped;
        }
      }
    },

    fadeVolume(key, targetVolume, durationMs, onComplete) {
      const player = this.players[key];
      if (!player) return;

      if (this.fadeTimers[key]) {
        clearInterval(this.fadeTimers[key]);
        delete this.fadeTimers[key];
      }

      const startVol = player.volume;
      const startTime = performance.now();

      this.fadeTimers[key] = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const currentVol = startVol + (targetVolume - startVol) * progress;
        player.volume = Math.max(0, Math.min(1.0, currentVol));

        if (progress >= 1) {
          clearInterval(this.fadeTimers[key]);
          delete this.fadeTimers[key];
          player.volume = Math.max(0, Math.min(1.0, targetVolume));
          if (onComplete) onComplete();
        }
      }, 25);
    },

    play(presetName) {
      this.init();
      const key = this.soundMap[presetName] ? presetName : 'rain';
      const targetVol = Math.max(0, Math.min(1.0, state.ambientVolume));

      // If already playing this preset, ensure volume is synced
      if (this.isPlaying && this.currentPreset === key) {
        const player = this.players[key];
        if (player) {
          if (player.paused) {
            player.play().catch(e => console.warn('Ambient play warning:', e));
          }
          this.fadeVolume(key, targetVol, 200);
        }
        return;
      }

      // Smoothly crossfade: fade out previous player simultaneously
      if (this.currentPreset && this.currentPreset !== key && this.players[this.currentPreset]) {
        const prevKey = this.currentPreset;
        const prevPlayer = this.players[prevKey];
        this.fadeVolume(prevKey, 0, 350, () => {
          if (prevPlayer) prevPlayer.pause();
        });
      }

      this.currentPreset = key;
      this.isPlaying = true;

      const newPlayer = this.players[key];
      if (newPlayer) {
        newPlayer.volume = 0;
        const playPromise = newPlayer.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (this.isPlaying && this.currentPreset === key) {
              this.fadeVolume(key, targetVol, 350);
            }
          }).catch(err => {
            console.warn('Ambient sound play error:', err);
          });
        }
      }
    },

    stopCurrent(fadeDuration = 0.3) {
      this.isPlaying = false;
      const key = this.currentPreset;
      if (!key || !this.players[key]) return;

      const player = this.players[key];
      const durationMs = Math.max(100, fadeDuration * 1000);
      this.fadeVolume(key, 0, durationMs, () => {
        if (!this.isPlaying && player) {
          player.pause();
        }
      });
    }
  };

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  const state = {
    colorScheme: 'dark', // 'dark' | 'light' | 'system'
    theme: 'indigo',
    userName: 'Saipavan',
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

    // Focus Timer State
    timerPresetMinutes: 25,
    customFocusMinutes: 45,
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
    tasks: []
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
    settingsCustomFocusInput: document.getElementById('settings-custom-focus-input'),
    modeDarkBtn: document.getElementById('mode-dark-btn'),
    modeLightBtn: document.getElementById('mode-light-btn'),
    modeSystemBtn: document.getElementById('mode-system-btn'),
    paletteSwatches: document.querySelectorAll('.palette-swatch-card'),
    helpBtn: document.getElementById('help-btn'),
    shortcutsDialog: document.getElementById('shortcuts-dialog'),
    closeDialogBtn: document.getElementById('close-dialog-btn'),
    confirmDialogBtn: document.getElementById('confirm-dialog-btn'),

    // Clock & Greeting
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
    customTimerChip: document.getElementById('timer-chip-custom'),
    customChipLabel: document.getElementById('custom-chip-label'),
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
    taskEmptyState: document.getElementById('task-empty-state')
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
  // CLOCK & GREETING MODULE (Two-Digit 12H Format + Saipavan)
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

  function resetTimer() {
    pauseTimer();
    state.timerTotalSeconds = state.timerPresetMinutes * 60;
    state.timerRemainingSeconds = state.timerTotalSeconds;
    elements.timerLabel.textContent = state.timerPresetMinutes >= 20 ? 'Focus Session' : 'Break Time';
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

        const isCustom = chip.dataset.isCustom === 'true' || chip.id === 'timer-chip-custom';
        const alreadyActive = chip.classList.contains('active');

        if (isCustom && alreadyActive) {
          startEditingCustomChip();
          return;
        }

        elements.timerChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');

        const minutes = isCustom
          ? (state.customFocusMinutes || parseInt(chip.dataset.minutes, 10) || 45)
          : (parseInt(chip.dataset.minutes, 10) || 25);

        state.timerPresetMinutes = minutes;
        Storage.set('activePresetMinutes', minutes);
        resetTimer();
      });
    });

    if (elements.customTimerChip) {
      elements.customTimerChip.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        elements.timerChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        elements.customTimerChip.classList.add('active');
        elements.customTimerChip.setAttribute('aria-checked', 'true');
        startEditingCustomChip();
      });
    }
  }

  // Update Custom Chip UI and Settings Sync
  function updateCustomChipUI(minutes) {
    if (elements.customTimerChip) {
      elements.customTimerChip.dataset.minutes = String(minutes);
    }
    if (elements.customChipLabel) {
      elements.customChipLabel.textContent = `Custom (${minutes}m)`;
    }
    if (elements.settingsCustomFocusInput) {
      elements.settingsCustomFocusInput.value = minutes;
    }
  }

  // Inline Editing for Custom Chip in Focus View
  function startEditingCustomChip() {
    if (!elements.customTimerChip || elements.customTimerChip.querySelector('.chip-inline-input')) return;

    const currentMinutes = state.customFocusMinutes || 45;
    const labelSpan = elements.customChipLabel;
    if (!labelSpan) return;

    labelSpan.classList.add('hidden');

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '180';
    input.className = 'chip-inline-input';
    input.value = currentMinutes;
    input.setAttribute('aria-label', 'Edit custom focus minutes');

    const unitText = document.createTextNode('m');

    elements.customTimerChip.appendChild(input);
    elements.customTimerChip.appendChild(unitText);
    input.focus();
    input.select();

    let isFinished = false;

    const finishEdit = async (save) => {
      if (isFinished) return;
      isFinished = true;

      let val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1) val = currentMinutes;
      if (val > 180) val = 180;

      input.remove();
      if (unitText.parentNode) unitText.remove();
      labelSpan.classList.remove('hidden');

      if (save && val > 0) {
        state.customFocusMinutes = val;
        state.timerPresetMinutes = val;
        updateCustomChipUI(val);
        resetTimer();
        Storage.set('customFocusMinutes', val);
        Storage.set('activePresetMinutes', val);
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
      if (state.isCalendarActive) toggleCalendarMode(false);
      if (state.isAmbientActive) toggleAmbientMode(false);
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
      if (state.isFocusActive) toggleFocusMode(false);
      if (state.isAmbientActive) toggleAmbientMode(false);
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
      if (state.isFocusActive) toggleFocusMode(false);
      if (state.isCalendarActive) toggleCalendarMode(false);
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

  let mediaQueryList = null;

  function handleSystemThemeChange(e) {
    if (state.colorScheme === 'system') {
      const isDark = e.matches;
      document.documentElement.setAttribute('data-color-scheme', isDark ? 'dark' : 'light');
    }
  }

  function applyColorScheme(scheme, save = true) {
    state.colorScheme = scheme || 'dark';
    let resolvedScheme = state.colorScheme;

    if (state.colorScheme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        resolvedScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolvedScheme = 'dark';
      }
    }

    document.documentElement.setAttribute('data-color-scheme', resolvedScheme);

    // Update segmented control buttons
    const modeBtns = [
      { btn: elements.modeDarkBtn || document.getElementById('mode-dark-btn'), mode: 'dark' },
      { btn: elements.modeLightBtn || document.getElementById('mode-light-btn'), mode: 'light' },
      { btn: elements.modeSystemBtn || document.getElementById('mode-system-btn'), mode: 'system' }
    ];

    modeBtns.forEach(({ btn, mode }) => {
      if (btn) {
        const isActive = mode === state.colorScheme;
        if (isActive) {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        }
      }
    });

    // Setup OS system listener if supported
    if (typeof window !== 'undefined' && window.matchMedia && !mediaQueryList) {
      try {
        mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof mediaQueryList.addEventListener === 'function') {
          mediaQueryList.addEventListener('change', handleSystemThemeChange);
        } else if (typeof mediaQueryList.addListener === 'function') {
          mediaQueryList.addListener(handleSystemThemeChange);
        }
      } catch (err) {
        console.warn('matchMedia listener error:', err);
      }
    }

    if (save) {
      Storage.set('colorScheme', state.colorScheme);
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

    // Sync inputs with current state before opening
    if (elements.settingsNameInput) elements.settingsNameInput.value = state.userName || '';
    if (elements.settingsGreetingToggle) elements.settingsGreetingToggle.checked = Boolean(state.showGreeting);
    if (elements.settingsMotivationToggle) elements.settingsMotivationToggle.checked = Boolean(state.showMotivation);
    if (elements.settingsSecondsToggle) elements.settingsSecondsToggle.checked = Boolean(state.showSeconds);
    if (elements.settingsDateToggle) elements.settingsDateToggle.checked = Boolean(state.showDate);
    if (elements.settingsSoundToggle) elements.settingsSoundToggle.checked = Boolean(state.soundEnabled);
    if (elements.settingsTaskSoundToggle) elements.settingsTaskSoundToggle.checked = Boolean(state.taskSoundEnabled);
    if (elements.settingsModeSoundToggle) elements.settingsModeSoundToggle.checked = Boolean(state.modeSoundEnabled);
    if (elements.settingsCustomFocusInput) elements.settingsCustomFocusInput.value = state.customFocusMinutes || 45;
    updateFormatButtons();
    applyColorScheme(state.colorScheme, false);
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

    // Custom Focus Duration Input in Settings
    if (elements.settingsCustomFocusInput) {
      elements.settingsCustomFocusInput.addEventListener('change', async (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 180) val = 180;
        e.target.value = val;

        state.customFocusMinutes = val;
        updateCustomChipUI(val);
        await Storage.set('customFocusMinutes', val);

        if (elements.customTimerChip && elements.customTimerChip.classList.contains('active')) {
          state.timerPresetMinutes = val;
          await Storage.set('activePresetMinutes', val);
          resetTimer();
        }
      });
    }

    // Color Mode (Dark / Light / Auto) Buttons
    const modeBtns = [
      elements.modeDarkBtn || document.getElementById('mode-dark-btn'),
      elements.modeLightBtn || document.getElementById('mode-light-btn'),
      elements.modeSystemBtn || document.getElementById('mode-system-btn')
    ];
    modeBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.mode;
          if (mode) applyColorScheme(mode, true);
        });
      }
    });

    // Accent Palette Swatches
    if (elements.paletteSwatches) {
      elements.paletteSwatches.forEach(card => {
        card.addEventListener('click', () => {
          const color = card.dataset.color;
          applyTheme(color);
        });
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
        if (elements.settingsSideSheet && elements.settingsSideSheet.classList.contains('open')) {
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
    const [colorScheme, theme, soundEnabled, taskSoundEnabled, modeSoundEnabled, presetMins, customFocusMins, tasks, savedPreset, savedVol, userName, showGreeting, showMotivation, clockFormat, showSeconds, showDate] = await Promise.all([
      Storage.get('colorScheme', 'dark'),
      Storage.get('theme', 'indigo'),
      Storage.get('soundEnabled', true),
      Storage.get('taskSoundEnabled', true),
      Storage.get('modeSoundEnabled', true),
      Storage.get('activePresetMinutes', 25),
      Storage.get('customFocusMinutes', 45),
      Storage.get('tasks', [
        { id: 'default_1', text: 'Plan today\'s priorities', completed: false, createdAt: Date.now() - 1000 },
        { id: 'default_2', text: 'Stay hydrated', completed: true, createdAt: Date.now() - 2000 }
      ]),
      Storage.get('ambientPreset', 'rain'),
      Storage.get('ambientVolume', 70),
      Storage.get('userName', 'Saipavan'),
      Storage.get('showGreeting', true),
      Storage.get('showMotivation', true),
      Storage.get('clockFormat', '12h'),
      Storage.get('showSeconds', false),
      Storage.get('showDate', true)
    ]);

    // Apply loaded state
    applyColorScheme(colorScheme, false);
    applyTheme(theme);

    // Profile & Greeting Name
    state.userName = typeof userName === 'string' ? userName : 'Saipavan';
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

    state.customFocusMinutes = Number(customFocusMins) || 45;
    updateCustomChipUI(state.customFocusMinutes);

    state.timerPresetMinutes = Number(presetMins) || 25;
    let foundActive = false;
    elements.timerChips.forEach(chip => {
      const chipMins = parseInt(chip.dataset.minutes, 10);
      if (chipMins === state.timerPresetMinutes) {
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
        foundActive = true;
      } else {
        chip.classList.remove('active');
        chip.setAttribute('aria-checked', 'false');
      }
    });

    if (!foundActive && elements.customTimerChip) {
      elements.customTimerChip.classList.add('active');
      elements.customTimerChip.setAttribute('aria-checked', 'true');
    }

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
