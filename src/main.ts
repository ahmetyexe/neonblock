import './style.css';
import { TetrominoType, Grid, Tetromino, Position } from './types';

import { COLS, ROWS, COLORS, SHAPES } from './constants';

type GameMode = 'normal' | 'hard' | 'timed';

class SoundManager {
  private ctx: AudioContext | null = null;
  sfxMuted = false;
  bgmMuted = false;
  private bgmInterval: number | null = null;
  private bgmGain: GainNode | null = null;
  private bgmPlaying = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  playDrop() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch { /* ignore */ }
  }

  playLineClear(lineCount: number) {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getCtx();
      const duration = 0.3 + lineCount * 0.05;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        const startFreq = 600 + i * 200;
        const endFreq = 1200 + lineCount * 200;
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime + i * 0.05);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + i * 0.05 + duration);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + duration);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + duration);
      }
    } catch { /* ignore */ }
  }

  playBombExplosion() {
    if (this.sfxMuted) return;
    try {
      const ctx = this.getCtx();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.6);
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(600, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.4);
    } catch { /* ignore */ }
  }

  startBGM() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    if (this.bgmMuted) return;
    this._startLoop();
  }

  stopBGM() {
    this.bgmPlaying = false;
    this._stopLoop();
  }

  private _startLoop() {
    if (this.bgmInterval !== null) return;
    try {
      const ctx = this.getCtx();
      this.bgmGain = ctx.createGain();
      this.bgmGain.gain.value = 0.08;
      this.bgmGain.connect(ctx.destination);

      const melody = [
        659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00,
        440.00, 523.25, 659.25, 587.33, 523.25, 493.88,
        523.25, 587.33, 659.25, 523.25, 440.00, 440.00,
        587.33, 698.46, 880.00, 783.99, 698.46, 659.25,
        523.25, 659.25, 587.33, 523.25, 493.88,
        493.88, 523.25, 587.33, 659.25, 523.25, 440.00, 440.00, 0
      ];
      let noteIndex = 0;
      const noteDuration = 0.18;
      const noteGap = 0.05;

      this.bgmInterval = window.setInterval(() => {
        if (this.bgmMuted || !this.bgmGain) return;
        const freq = melody[noteIndex % melody.length];
        noteIndex++;
        if (freq === 0) return;

        try {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.connect(noteGain);
          noteGain.connect(this.bgmGain!);
          osc.type = 'square';
          osc.frequency.value = freq;
          noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
          noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + noteDuration);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + noteDuration);
        } catch { /* ignore */ }
      }, (noteDuration + noteGap) * 1000);
    } catch { /* ignore */ }
  }

  private _stopLoop() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain) {
      try { this.bgmGain.disconnect(); } catch { /* ignore */ }
      this.bgmGain = null;
    }
  }

  toggleSFX(): boolean {
    this.sfxMuted = !this.sfxMuted;
    return this.sfxMuted;
  }

  toggleBGM(): boolean {
    this.bgmMuted = !this.bgmMuted;
    if (this.bgmMuted) {
      this._stopLoop();
    } else if (this.bgmPlaying) {
      this._startLoop();
    }
    return this.bgmMuted;
  }
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private activePiece: Tetromino | null = null;
  private nextPiece: TetrominoType;
  private holdPiece: TetrominoType | null = null;
  private canHold = true;
  private score = 0;
  private bestScore = 0;
  private level = 1;
  private lines = 0;
  private isPaused = false;
  private gameOver = false;
  private clearingLines: number[] = [];
  private lastTime = 0;
  private dropCounter = 0;
  private logicalWidth = 200;
  private logicalHeight = 400;

  private clearTime = 0;
  private sound = new SoundManager();

  // Game mode
  private gameMode: GameMode = 'normal';
  private timerRemaining = 120; // 2 minutes in seconds
  private timerInterval: number | null = null;
  private hasUsedContinue = false;
  private consecutiveClears = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    this.nextPiece = this.getRandomType();
    // Load best score
    const saved = localStorage.getItem('tetris-best-score');
    this.bestScore = saved ? parseInt(saved, 10) : 0;
    this.init();
    // Show best score on menu
    const menuBest = document.getElementById('menu-best-score');
    if (menuBest) menuBest.textContent = this.bestScore.toLocaleString();
    const settingsBest = document.getElementById('settings-best');
    if (settingsBest) settingsBest.textContent = this.bestScore.toLocaleString();
  }

  private init() {
    this.setupControls();
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Main menu mode buttons
    document.getElementById('mode-normal')?.addEventListener('click', () => this.startGame('normal'));
    document.getElementById('mode-hard')?.addEventListener('click', () => this.startGame('hard'));
    document.getElementById('mode-timed')?.addEventListener('click', () => this.startGame('timed'));

    // In-game buttons
    document.getElementById('restart-btn')?.addEventListener('click', () => this.startGame(this.gameMode));
    document.getElementById('resume-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('pause-toggle')?.addEventListener('click', () => this.togglePause());

    // Quit / menu buttons
    document.getElementById('quit-btn')?.addEventListener('click', () => this.goToMenu());
    document.getElementById('menu-btn')?.addEventListener('click', () => this.goToMenu());

    // Ad continue buttons
    document.getElementById('ad-watch-btn')?.addEventListener('click', () => this.continueAfterAd());
    document.getElementById('ad-skip-btn')?.addEventListener('click', () => this.skipAd());

    // Settings
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      document.getElementById('main-menu')?.classList.add('hidden');
      document.getElementById('settings-panel')?.classList.remove('hidden');
    });

    document.getElementById('settings-back')?.addEventListener('click', () => {
      document.getElementById('settings-panel')?.classList.add('hidden');
      document.getElementById('main-menu')?.classList.remove('hidden');
    });

    // How to play
    document.getElementById('howto-btn')?.addEventListener('click', () => {
      document.getElementById('main-menu')?.classList.add('hidden');
      document.getElementById('howto-panel')?.classList.remove('hidden');
    });

    document.getElementById('howto-back')?.addEventListener('click', () => {
      document.getElementById('howto-panel')?.classList.add('hidden');
      document.getElementById('main-menu')?.classList.remove('hidden');
    });

    // Policies
    document.getElementById('btn-policy-kullanim')?.addEventListener('click', () => this.showPolicy('Kullanım Politikası', '/belgeler/kullanım_polikası.txt'));
    document.getElementById('btn-policy-gizlilik')?.addEventListener('click', () => this.showPolicy('Gizlilik Politikası', '/belgeler/gizlilik_polikası.txt'));
    document.getElementById('btn-policy-cerez')?.addEventListener('click', () => this.showPolicy('Çerez Politikası', '/belgeler/çerez_polikası.txt'));
    document.getElementById('policy-close-btn')?.addEventListener('click', () => {
      document.getElementById('policy-overlay')?.classList.remove('active');
    });

    // Audio toggles in pause overlay
    document.getElementById('sfx-toggle')?.addEventListener('click', () => {
      const muted = this.sound.toggleSFX();
      this.updateAudioButton('sfx-toggle', muted, 'sound');
      this.updateAudioButton('settings-sfx', muted, 'sound');
    });

    document.getElementById('bgm-toggle')?.addEventListener('click', () => {
      const muted = this.sound.toggleBGM();
      this.updateAudioButton('bgm-toggle', muted, 'music');
      this.updateAudioButton('settings-bgm', muted, 'music');
    });

    // Audio toggles in settings
    document.getElementById('settings-sfx')?.addEventListener('click', () => {
      const muted = this.sound.toggleSFX();
      this.updateAudioButton('settings-sfx', muted, 'sound');
      this.updateAudioButton('sfx-toggle', muted, 'sound');
    });

    document.getElementById('settings-bgm')?.addEventListener('click', () => {
      const muted = this.sound.toggleBGM();
      this.updateAudioButton('settings-bgm', muted, 'music');
      this.updateAudioButton('bgm-toggle', muted, 'music');
    });
  }

  private updateAudioButton(id: string, muted: boolean, type: 'sound' | 'music') {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('muted', muted);
    const icon = btn.querySelector('svg use');
    if (icon) {
      if (type === 'sound') {
        icon.setAttribute('href', muted ? '#icon-sound-off' : '#icon-sound-on');
      } else {
        icon.setAttribute('href', muted ? '#icon-music-off' : '#icon-music-on');
      }
    }
  }

  private goToMenu() {
    this.gameOver = true;
    this.isPaused = false;
    this.sound.stopBGM();
    this.stopTimer();

    document.getElementById('game-screen')?.classList.add('hidden');
    document.getElementById('game-over-overlay')?.classList.remove('active');
    document.getElementById('pause-overlay')?.classList.remove('active');
    document.getElementById('ad-continue-overlay')?.classList.remove('active');
    document.getElementById('main-menu')?.classList.remove('hidden');

    // Update best score on menu
    const menuBest = document.getElementById('menu-best-score');
    if (menuBest) menuBest.textContent = this.bestScore.toLocaleString();
    const settingsBest = document.getElementById('settings-best');
    if (settingsBest) settingsBest.textContent = this.bestScore.toLocaleString();
  }

  private startGame(mode: GameMode) {
    this.gameMode = mode;

    // Hide menus, show game
    document.getElementById('main-menu')?.classList.add('hidden');
    document.getElementById('settings-panel')?.classList.add('hidden');
    document.getElementById('game-screen')?.classList.remove('hidden');
    document.getElementById('game-over-overlay')?.classList.remove('active');
    document.getElementById('pause-overlay')?.classList.remove('active');
    const icon = document.querySelector('#pause-toggle svg use');
    if (icon) icon.setAttribute('href', '#icon-pause');

    // Show/hide timer stat
    const timerStat = document.getElementById('timer-stat');
    if (timerStat) {
      timerStat.style.display = mode === 'timed' ? 'flex' : 'none';
    }

    // Recalculate canvas
    requestAnimationFrame(() => this.resize());

    // Reset game state
    this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    this.score = 0;
    this.lines = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.holdPiece = null;
    this.hasUsedContinue = false;
    this.consecutiveClears = 0;
    this.clearTime = 0;

    // Mode-specific setup
    if (mode === 'hard') {
      this.level = 5; // Start at level 5 for hard mode
    } else {
      this.level = 1;
    }

    if (mode === 'timed') {
      this.timerRemaining = 120; // 2 minutes
      this.updateTimerDisplay();
      this.startTimer();
    } else {
      this.stopTimer();
    }

    this.updateStats();
    this.spawnPiece();
    this.sound.startBGM();
    this.animate();
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = window.setInterval(() => {
      if (this.isPaused || this.gameOver) return;
      this.timerRemaining--;
      this.updateTimerDisplay();
      if (this.timerRemaining <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimerDisplay() {
    const timerEl = document.getElementById('timer-val');
    if (!timerEl) return;
    const minutes = Math.floor(this.timerRemaining / 60);
    const seconds = this.timerRemaining % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Make timer red when low
    if (this.timerRemaining <= 10) {
      timerEl.style.color = 'var(--color-z)';
      timerEl.style.animation = 'pulse-timer 0.5s ease-in-out infinite';
    } else if (this.timerRemaining <= 30) {
      timerEl.style.color = 'var(--color-l)';
      timerEl.style.animation = '';
    } else {
      timerEl.style.color = 'var(--color-z)';
      timerEl.style.animation = '';
    }
  }

  private togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    document.getElementById('pause-overlay')?.classList.toggle('active', this.isPaused);
    const icon = document.querySelector('#pause-toggle svg use');
    if (icon) {
      icon.setAttribute('href', this.isPaused ? '#icon-play' : '#icon-pause');
    }
    if (this.isPaused) {
      this.sound.stopBGM();
    } else {
      this.sound.startBGM();
      this.lastTime = performance.now();
      this.animate();
    }
  }

  private getRandomType(): TetrominoType {
    // ~2% chance for bomb (rare)
    if (Math.random() < 0.02) return 'BOMB';
    const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private spawnPiece() {
    const type = this.nextPiece;
    const shape = SHAPES[type];
    const piece: Tetromino = {
      type,
      shape,
      color: COLORS[type],
      position: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 }
    };

    this.nextPiece = this.getRandomType();

    if (this.checkCollision(piece.position, piece.shape)) {
      this.endGame();
      return;
    }

    this.activePiece = piece;
    this.canHold = true;
    this.updateStats();
  }

  private checkCollision(pos: Position, shape: number[][], grid = this.grid) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid[newY][newX] !== null)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private rotate() {
    if (!this.activePiece || this.isPaused || this.gameOver || this.clearingLines.length) return;

    const shape = this.activePiece.shape;
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());

    const offsets = [0, -1, 1, -2, 2];

    for (const offsetX of offsets) {
      const testPos = {
        x: this.activePiece.position.x + offsetX,
        y: this.activePiece.position.y
      };

      if (!this.checkCollision(testPos, newShape)) {
        this.activePiece.shape = newShape;
        this.activePiece.position = testPos;
        return;
      }
    }
  }

  private move(dir: number) {
    if (!this.activePiece || this.isPaused || this.gameOver || this.clearingLines.length) return;
    const newPos = { ...this.activePiece.position, x: this.activePiece.position.x + dir };
    if (!this.checkCollision(newPos, this.activePiece.shape)) {
      this.activePiece.position = newPos;
    }
  }

  private drop() {
    if (!this.activePiece || this.isPaused || this.gameOver || this.clearingLines.length) return;
    const newPos = { ...this.activePiece.position, y: this.activePiece.position.y + 1 };
    if (!this.checkCollision(newPos, this.activePiece.shape)) {
      this.activePiece.position = newPos;
    } else {
      this.lockPiece();
    }
    this.dropCounter = 0;
  }

  private hardDrop() {
    if (!this.activePiece || this.isPaused || this.gameOver || this.clearingLines.length) return;
    let newY = this.activePiece.position.y;
    while (!this.checkCollision({ ...this.activePiece.position, y: newY + 1 }, this.activePiece.shape)) {
      newY++;
    }
    this.activePiece.position.y = newY;
    this.lockPiece();
  }

  private lockPiece() {
    if (!this.activePiece) return;

    // Handle bomb explosion
    if (this.activePiece.type === 'BOMB') {
      const bombRow = this.activePiece.position.y;
      const rowsToClear: number[] = [bombRow];
      if (bombRow + 1 < ROWS) {
        rowsToClear.push(bombRow + 1);
      } else if (bombRow - 1 >= 0) {
        rowsToClear.push(bombRow - 1);
      }
      const validRows = rowsToClear.filter(y => y >= 0 && y < ROWS);

      this.clearingLines = validRows;
      this.clearTime = 0;
      this.sound.playBombExplosion();
      this.activePiece = null;

      setTimeout(() => {
        this.grid = this.grid.filter((_, y) => !validRows.includes(y));
        while (this.grid.length < ROWS) this.grid.unshift(Array(COLS).fill(null));
        
        if (validRows.length > 0) {
          this.consecutiveClears++;
        } else {
          this.consecutiveClears = 0;
        }

        let multiplier = this.consecutiveClears >= 2 ? this.consecutiveClears : 1;
        if (multiplier >= 2) {
          this.showComboAnimation(multiplier);
        }

        const points = 300 * this.level * multiplier;
        this.score += points;
        this.lines += validRows.length;
        if (Math.floor(this.lines / 10) >= this.level) this.level++;
        this.clearingLines = [];
        this.spawnPiece();
        this.updateStats();
      }, 250);
      return;
    }

    this.activePiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const gridY = this.activePiece!.position.y + y;
          const gridX = this.activePiece!.position.x + x;
          if (gridY >= 0) this.grid[gridY][gridX] = this.activePiece!.type;
        }
      });
    });

    const fullLines: number[] = [];
    this.grid.forEach((row, y) => {
      if (row.every(cell => cell !== null)) fullLines.push(y);
    });

    if (fullLines.length > 0) {
      this.consecutiveClears++;
      let multiplier = this.consecutiveClears >= 2 ? this.consecutiveClears : 1;

      this.clearingLines = fullLines;
      this.clearTime = 0;
      if (multiplier >= 2) {
        this.showComboAnimation(multiplier);
      }
      this.sound.playLineClear(fullLines.length);

      this.activePiece = null;

      setTimeout(() => {
        this.grid = this.grid.filter((_, y) => !fullLines.includes(y));
        while (this.grid.length < ROWS) this.grid.unshift(Array(COLS).fill(null));

        let multiplier = this.consecutiveClears >= 2 ? this.consecutiveClears : 1;
        const points = [0, 100, 300, 500, 800][fullLines.length] * this.level * multiplier;
        this.score += points;
        this.lines += fullLines.length;
        if (Math.floor(this.lines / 10) >= this.level) this.level++;

        this.clearingLines = [];
        this.spawnPiece();
        this.updateStats();
      }, 200);
    } else {
      this.consecutiveClears = 0;
      this.activePiece = null;
      this.spawnPiece();
    }
  }

  private hold() {
    if (!this.activePiece || !this.canHold || this.isPaused || this.gameOver) return;
    const currentType = this.activePiece.type;
    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      this.spawnPiece();
    } else {
      const type = this.holdPiece;
      this.holdPiece = currentType;
      const shape = SHAPES[type];
      this.activePiece = {
        type,
        shape,
        color: COLORS[type],
        position: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 }
      };
    }
    this.canHold = false;
    this.updateStats();
  }

  private vibrate(ms: number) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  private showComboAnimation(multiplier: number) {
    const comboEl = document.getElementById('combo-text');
    if (!comboEl) return;
    comboEl.textContent = `${multiplier}X KOMBO!`;
    comboEl.classList.remove('hidden');
    comboEl.style.animation = 'none';
    
    // Determine effect intensity
    let effectName = 'pop-combo-2x';
    if (multiplier === 3) effectName = 'pop-combo-3x';
    if (multiplier >= 4) effectName = 'pop-combo-4x';
    
    void comboEl.offsetWidth; // trigger reflow
    comboEl.style.animation = `${effectName} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`;
    
    setTimeout(() => {
      comboEl.classList.add('hidden');
    }, 800);
  }

  private updateStats() {
    document.getElementById('score-val')!.textContent = this.score.toLocaleString();
    document.getElementById('level-val')!.textContent = this.level.toString();
    // Live-update best score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('tetris-best-score', this.bestScore.toString());
    }
    document.getElementById('best-score-val')!.textContent = this.bestScore.toLocaleString();
    this.drawPreview('next-preview', this.nextPiece);
    this.drawPreview('hold-preview', this.holdPiece);
  }

  private drawPreview(canvasId: string, type: TetrominoType | null) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!type) return;

    const shape = SHAPES[type];
    const size = 12;
    const color = COLORS[type];
    const offsetX = (canvas.width - shape[0].length * size) / 2;
    const offsetY = (canvas.height - shape.length * size) / 2;

    shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          if (type === 'BOMB') {
            this.drawBombBlock(ctx, offsetX + x * size, offsetY + y * size, size);
          } else {
            this.drawBlock(ctx, offsetX + x * size, offsetY + y * size, size, color);
          }
        }
      });
    });
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;

    const wrapper = this.canvas.parentElement;
    let availableWidth: number;
    let availableHeight: number;

    if (wrapper) {
      const wrapperStyle = getComputedStyle(wrapper);
      const wrapperPaddingH = parseFloat(wrapperStyle.paddingLeft) + parseFloat(wrapperStyle.paddingRight);
      const wrapperPaddingV = parseFloat(wrapperStyle.paddingTop) + parseFloat(wrapperStyle.paddingBottom);
      availableWidth = wrapper.clientWidth - wrapperPaddingH;
      availableHeight = wrapper.clientHeight - wrapperPaddingV;
    } else {
      availableWidth = Math.min(window.innerWidth - 32, 460);
      availableHeight = window.innerHeight - 200;
    }

    let width = Math.floor(availableWidth);
    let height = width * 2;

    if (height > availableHeight) {
      height = Math.floor(availableHeight);
      width = Math.floor(height / 2);
    }

    if (width > 460) {
      width = 460;
      height = 920;
    }

    width = Math.max(width, 100);
    height = Math.max(height, 200);

    this.logicalWidth = width;
    this.logicalHeight = height;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  private getDropInterval(): number {
    if (this.gameMode === 'hard') {
      // Hard mode: much faster drop, starting effectively at level 5+ with faster curve
      return Math.max(50, 600 - (this.level - 1) * 80);
    }
    return Math.max(100, 1000 - (this.level - 1) * 100);
  }

  private animate = (time = 0) => {
    if (this.isPaused || this.gameOver) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;

    const dropInterval = this.getDropInterval();
    if (!this.clearingLines.length && this.dropCounter > dropInterval) this.drop();

    if (this.clearingLines.length) {
      this.clearTime += deltaTime;
    }

    this.draw();
    requestAnimationFrame(this.animate);
  }

  private draw() {
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const blockSize = width / COLS;

    this.ctx.clearRect(0, 0, width, height);

    // Grid lines - batch into single path for performance
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    for (let x = 0; x <= COLS; x++) {
      this.ctx.moveTo(x * blockSize, 0);
      this.ctx.lineTo(x * blockSize, height);
    }
    for (let y = 0; y <= ROWS; y++) {
      this.ctx.moveTo(0, y * blockSize);
      this.ctx.lineTo(width, y * blockSize);
    }
    this.ctx.stroke();

    // Locked blocks
    const clearSet = this.clearingLines.length > 0 ? new Set(this.clearingLines) : null;
    for (let y = 0; y < ROWS; y++) {
      const row = this.grid[y];
      const isClearing = clearSet?.has(y) ?? false;
      for (let x = 0; x < COLS; x++) {
        const type = row[x];
        if (type) {
          if (isClearing) {
            const progress = Math.min(1, this.clearTime / 200);
            if (progress < 1) {
              this.ctx.globalAlpha = 1 - progress;
              this.drawBlock(this.ctx, x * blockSize, y * blockSize, blockSize, COLORS[type]);
              this.ctx.globalAlpha = 1.0;
            }
          } else {
            this.drawBlock(this.ctx, x * blockSize, y * blockSize, blockSize, COLORS[type]);
          }
        }
      }
    }

    // Active piece + ghost
    if (this.activePiece && !this.clearingLines.length) {
      const isBomb = this.activePiece.type === 'BOMB';
      // Ghost
      let ghostY = this.activePiece.position.y;
      while (!this.checkCollision({ ...this.activePiece.position, y: ghostY + 1 }, this.activePiece.shape)) ghostY++;

      const shape = this.activePiece.shape;
      const px = this.activePiece.position.x;
      const py = this.activePiece.position.y;

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            // Ghost piece
            this.ctx.globalAlpha = 0.15;
            if (isBomb) {
              this.drawBombBlock(this.ctx, (px + x) * blockSize, (ghostY + y) * blockSize, blockSize);
            } else {
              this.drawBlock(this.ctx, (px + x) * blockSize, (ghostY + y) * blockSize, blockSize, this.activePiece!.color);
            }
            // Active piece
            this.ctx.globalAlpha = 1.0;
            if (isBomb) {
              this.drawBombBlock(this.ctx, (px + x) * blockSize, (py + y) * blockSize, blockSize);
            } else {
              this.drawBlock(this.ctx, (px + x) * blockSize, (py + y) * blockSize, blockSize, this.activePiece!.color);
            }
          }
        }
      }
      this.ctx.globalAlpha = 1.0;
    }
  }

  private drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    const p = 1;
    const bx = x + p;
    const by = y + p;
    const bs = size - p * 2;
    const r = 3;

    // Fill block — no shadowBlur for performance
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, bs, bs, r);
    ctx.fill();

    // Simple top highlight line instead of expensive radial gradient
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + r, by + 1);
    ctx.lineTo(bx + bs - r, by + 1);
    ctx.stroke();
  }

  private drawBombBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const cx = x + size / 2;
    const cy = y + size / 2 + size * 0.05;
    const radius = size * 0.35;

    // Bomb body - simple dark circle
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Shine highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.2, cy - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Fuse nozzle
    ctx.fillStyle = '#888';
    const nw = size * 0.1;
    const nh = size * 0.08;
    ctx.fillRect(cx - nw / 2, cy - radius - nh, nw, nh);

    // Fuse rope
    ctx.strokeStyle = '#aa7733';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - nh);
    ctx.lineTo(cx + size * 0.12, cy - radius - size * 0.28);
    ctx.stroke();

    // Spark - simple orange dot
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(cx + size * 0.12, cy - radius - size * 0.28, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private endGame() {
    this.gameOver = true;
    this.sound.stopBGM();
    this.stopTimer();
    // Check and update best score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('tetris-best-score', this.bestScore.toString());
    }

    // Show ad continue popup if not used yet
    if (!this.hasUsedContinue) {
      document.getElementById('ad-continue-overlay')?.classList.add('active');
      return;
    }

    this.showGameOver();
  }

  private showGameOver() {
    document.getElementById('ad-continue-overlay')?.classList.remove('active');
    document.getElementById('game-over-overlay')?.classList.add('active');
    document.getElementById('final-score')!.textContent = this.score.toLocaleString();
    document.getElementById('best-score')!.textContent = this.bestScore.toLocaleString();
    // Update menu best score
    const menuBest = document.getElementById('menu-best-score');
    if (menuBest) menuBest.textContent = this.bestScore.toLocaleString();
    const settingsBest = document.getElementById('settings-best');
    if (settingsBest) settingsBest.textContent = this.bestScore.toLocaleString();
  }

  private continueAfterAd() {
    this.hasUsedContinue = true;
    document.getElementById('ad-continue-overlay')?.classList.remove('active');

    // TODO: Integrate actual ad API here
    // For now, simulate ad watched and continue

    // Clear top 4 rows to give player breathing room
    for (let y = 0; y < Math.min(4, ROWS); y++) {
      this.grid[y] = Array(COLS).fill(null);
    }

    // Resume the game
    this.gameOver = false;
    this.sound.startBGM();

    // Restart timer for timed mode
    if (this.gameMode === 'timed' && this.timerRemaining > 0) {
      this.startTimer();
    }

    this.spawnPiece();
    this.lastTime = performance.now();
    this.dropCounter = 0;
    this.animate();
  }

  private skipAd() {
    this.hasUsedContinue = true;
    this.showGameOver();
  }

  private setupControls() {
    document.getElementById('btn-left')?.addEventListener('click', () => this.move(-1));
    document.getElementById('btn-right')?.addEventListener('click', () => this.move(1));
    document.getElementById('btn-down')?.addEventListener('click', () => this.drop());
    document.getElementById('btn-hard-drop')?.addEventListener('click', () => this.hardDrop());
    document.getElementById('btn-hold')?.addEventListener('click', () => this.hold());
    document.getElementById('btn-rotate')?.addEventListener('click', () => this.rotate());

    window.addEventListener('keydown', (e) => {
      if (this.isPaused || this.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': this.move(-1); break;
        case 'ArrowRight': this.move(1); break;
        case 'ArrowDown': this.drop(); break;
        case 'ArrowUp': this.rotate(); break;
        case ' ': this.hardDrop(); break;
        case 'c': case 'C': this.hold(); break;
        case 'p': case 'P': this.togglePause(); break;
      }
    });

    // Touch gesture controls for mobile (real-time drag)
    this.setupTouchControls();
  }

  private setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTouching = false;
    let movedColumns = 0; // how many columns we've moved so far during this drag
    let droppedRows = 0; // how many rows we've soft-dropped during this drag
    let gestureDecided = false; // have we decided horizontal vs vertical?
    let gestureDirection: 'horizontal' | 'vertical' | null = null;
    let didAction = false; // did we perform any meaningful action?

    const COL_THRESHOLD = 28; // pixels per column of movement
    const ROW_THRESHOLD = 35; // pixels per row of soft drop
    const DECIDE_THRESHOLD = 12; // pixels before we decide gesture direction

    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return;

    gameScreen.addEventListener('touchstart', (e: TouchEvent) => {
      // Don't intercept touches on control buttons
      const target = e.target as HTMLElement;
      if (target.closest('.controls') || target.closest('.top-stats-bar') || target.closest('.overlay.active')) {
        return;
      }

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isTouching = true;
      movedColumns = 0;
      droppedRows = 0;
      gestureDecided = false;
      gestureDirection = null;
      didAction = false;
    }, { passive: true });

    gameScreen.addEventListener('touchmove', (e: TouchEvent) => {
      if (!isTouching || this.isPaused || this.gameOver) return;

      const target = e.target as HTMLElement;
      if (target.closest('.controls') || target.closest('.top-stats-bar') || target.closest('.overlay.active')) {
        return;
      }

      // Prevent page scroll during game touches
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Decide gesture direction once we move enough
      if (!gestureDecided && (absDeltaX > DECIDE_THRESHOLD || absDeltaY > DECIDE_THRESHOLD)) {
        gestureDecided = true;
        gestureDirection = absDeltaX >= absDeltaY ? 'horizontal' : 'vertical';
      }

      if (!gestureDecided) return;

      if (gestureDirection === 'horizontal') {
        // Real-time horizontal movement: move piece as finger drags
        const targetColumns = Math.round(deltaX / COL_THRESHOLD);
        const diff = targetColumns - movedColumns;

        if (diff !== 0) {
          const dir = diff > 0 ? 1 : -1;
          const steps = Math.abs(diff);
          for (let i = 0; i < steps; i++) {
            this.move(dir);
          }
          movedColumns = targetColumns;
          didAction = true;
        }
      } else if (gestureDirection === 'vertical' && deltaY > 0) {
        // Real-time vertical (downward) movement: soft drop as finger drags down
        const targetRows = Math.floor(deltaY / ROW_THRESHOLD);
        const diff = targetRows - droppedRows;

        if (diff > 0) {
          for (let i = 0; i < diff; i++) {
            this.drop();
          }
          droppedRows = targetRows;
          didAction = true;
        }
      }
    }, { passive: false });

    gameScreen.addEventListener('touchend', (e: TouchEvent) => {
      if (!isTouching || this.isPaused || this.gameOver) return;

      const target = e.target as HTMLElement;
      if (target.closest('.controls') || target.closest('.top-stats-bar') || target.closest('.overlay.active')) {
        isTouching = false;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const elapsed = Date.now() - touchStartTime;

      isTouching = false;

      // If we already handled movement during drag, check for fast vertical swipe
      if (gestureDirection === 'vertical' && deltaY > 0) {
        // Fast long swipe down = hard drop
        if (absDeltaY > 100 && elapsed < 250) {
          this.hardDrop();
          return;
        }
      }

      // Swipe up = rotate (can only be detected on end since it's a quick gesture)
      if (gestureDirection === 'vertical' && deltaY < 0 && absDeltaY > 30) {
        this.rotate();
        return;
      }

      // If nothing happened and it was a very small movement, treat as tap (no action)
      if (!didAction && absDeltaX < 10 && absDeltaY < 10) {
        // Tap on canvas area - could be used for rotate or ignored
        return;
      }
    }, { passive: true });
  }

  private async showPolicy(title: string, url: string) {
    document.getElementById('policy-overlay')?.classList.add('active');
    document.getElementById('policy-title')!.textContent = title;
    const contentEl = document.getElementById('policy-content')!;
    contentEl.textContent = 'Yükleniyor...';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Dosya bulunamadı.');
      const text = await res.text();
      contentEl.textContent = text || 'Bu belge henüz hazırlanmamıştır.';
    } catch (e) {
      contentEl.textContent = 'Belge yüklenirken bir hata oluştu.';
    }
  }
}

new Game();

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('intro-screen')?.classList.remove('active');
    setTimeout(() => {
      document.getElementById('intro-screen')?.remove(); 
      document.getElementById('main-menu')?.classList.remove('hidden');
    }, 500); // Wait for fade out
  }, 2000); // 2 seconds delay
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
