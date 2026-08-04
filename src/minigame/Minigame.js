// ============================================================
// Minigame — a timing challenge played at MINIGAME map nodes.
// A moving indicator sweeps across a bar; the player clicks to
// stop it. Landing in the center band = hit (perfect if
// dead-center). Rewards scale with accuracy and are always
// granted (even a failed drill gives a small consolation).
// ============================================================

const MODES = {
  IDLE: 'idle',
  RUNNING: 'running',
  RESULT: 'result',
};

export class Minigame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = MODES.IDLE;
    this.progress = 0; // 0..1 sweep position
    this.direction = 1;
    this.speed = 0.55; // sweeps per second
    this.totalAttempts = 5;
    this.hits = 0;
    this.perfects = 0;
    this.attemptsLeft = this.totalAttempts;
    this.perfect = false;
    this.result = null;
    this.lastFeedback = null; // { text, color, timer }
    this.feedbackTimer = 0;

    this._onClick = this._onClick.bind(this);
    this.canvas.addEventListener('click', this._onClick);
  }

  start() {
    this.canvas.width = 1280;
    this.canvas.height = 750;
    this.mode = MODES.RUNNING;
    this.progress = 0;
    this.direction = 1;
    this.hits = 0;
    this.perfects = 0;
    this.attemptsLeft = this.totalAttempts;
    this.perfect = true;
    this.result = null;
    this.lastFeedback = null;
    this.feedbackTimer = 0;
  }

  get isActive() {
    return this.mode !== MODES.IDLE;
  }

  update(dt) {
    if (this.mode !== MODES.RUNNING) return;

    this.progress += this.direction * this.speed * dt;
    if (this.progress > 1) {
      this.progress = 1;
      this.direction = -1;
    } else if (this.progress < 0) {
      this.progress = 0;
      this.direction = 1;
    }

    if (this.feedbackTimer > 0) this.feedbackTimer -= dt;
  }

  _onClick() {
    if (this.mode !== MODES.RUNNING) return;

    const distFromCenter = Math.abs(this.progress - 0.5);
    const isHit = distFromCenter <= 0.08;
    const isPerfect = distFromCenter <= 0.02;

    if (isPerfect) {
      this.perfects += 1;
      this.hits += 1;
      this._setFeedback('PERFECT', '#5fd3a8');
    } else if (isHit) {
      this.hits += 1;
      this._setFeedback('HIT', '#8fe3c1');
    } else {
      this.perfect = false;
      this._setFeedback('MISS', '#e0655c');
    }

    if (!isPerfect) this.perfect = false;
    this.attemptsLeft -= 1;

    if (this.attemptsLeft <= 0) {
      this.mode = MODES.RESULT;
      const success = this.hits >= 3; // 3 of 5 hits to pass
      this.result = {
        success,
        perfect: success && this.perfect && this.hits === this.totalAttempts,
        hits: this.hits,
        perfects: this.perfects,
        totalAttempts: this.totalAttempts,
      };
    }
  }

  _setFeedback(text, color) {
    this.lastFeedback = { text, color };
    this.feedbackTimer = 0.6;
  }

  render() {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#e8edf5';
    ctx.font = '700 18px "Consolas", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRECISION DRILL // TIMING CHALLENGE', w / 2, 45);

    // Bar
    const barX = 120;
    const barW = w - 240;
    const barY = h / 2 - 12;
    const barH = 24;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(barX, barY, barW, barH);

    // Hit band (center)
    const bandW = 0.16 * barW;
    const bandX = barX + barW * 0.5 - bandW / 2;
    ctx.fillStyle = 'rgba(95, 211, 168, 0.25)';
    ctx.fillRect(bandX, barY, bandW, barH);

    // Perfect band (inner)
    const perfectW = 0.04 * barW;
    const perfectX = barX + barW * 0.5 - perfectW / 2;
    ctx.fillStyle = 'rgba(95, 211, 168, 0.5)';
    ctx.fillRect(perfectX, barY, perfectW, barH);

    // Border
    ctx.strokeStyle = 'rgba(122, 162, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Sweep indicator
    if (this.mode === MODES.RUNNING) {
      const ix = barX + this.progress * barW;
      ctx.fillStyle = '#e8a94c';
      ctx.beginPath();
      ctx.moveTo(ix, barY - 8);
      ctx.lineTo(ix - 6, barY + barH + 8);
      ctx.lineTo(ix + 6, barY + barH + 8);
      ctx.closePath();
      ctx.fill();
    }

    // Stats — total attempts in denominator, not remaining
    const attemptsUsed = this.totalAttempts - this.attemptsLeft;
    ctx.fillStyle = '#8a94a8';
    ctx.font = '500 13px "Segoe UI", sans-serif';
    ctx.fillText(`Hits: ${this.hits} / ${this.totalAttempts}`, w / 2, barY + barH + 28);
    ctx.fillText(
      attemptsUsed < this.totalAttempts
        ? `Click ${this.attemptsLeft} more time${this.attemptsLeft === 1 ? '' : 's'}`
        : 'Click when the marker is in the green band',
      w / 2,
      barY + barH + 50
    );

    // Per-click feedback
    if (this.lastFeedback && this.feedbackTimer > 0) {
      ctx.fillStyle = this.lastFeedback.color;
      ctx.font = '700 22px "Segoe UI", sans-serif';
      ctx.fillText(this.lastFeedback.text, w / 2, barY - 24);
    }

    // Result overlay
    if (this.mode === MODES.RESULT && this.result) {
      ctx.fillStyle = 'rgba(8, 12, 18, 0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = this.result.success ? '#5fd3a8' : '#e0655c';
      ctx.font = '700 26px "Segoe UI", sans-serif';
      ctx.fillText(
        this.result.perfect ? 'PERFECT!' : this.result.success ? 'SUCCESS' : 'DRILL FAILED',
        w / 2,
        h / 2 - 10
      );
      ctx.fillStyle = '#d6dde8';
      ctx.font = '500 15px "Segoe UI", sans-serif';
      ctx.fillText(
        `Hits: ${this.result.hits}/${this.result.totalAttempts} • Perfects: ${this.result.perfects}`,
        w / 2,
        h / 2 + 24
      );
      ctx.fillStyle = '#8a94a8';
      ctx.fillText('Click to continue', w / 2, h / 2 + 52);
    }
  }

  /** Consume a click after result shown: returns result and resets. */
  dismissResult() {
    if (this.mode !== MODES.RESULT) return null;
    const res = this.result;
    this.mode = MODES.IDLE;
    this.result = null;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    return res;
  }

  destroy() {
    this.canvas.removeEventListener('click', this._onClick);
  }
}