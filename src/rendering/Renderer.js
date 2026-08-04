// ============================================================
// Renderer — tactical presentation layer.
// Draws the arena, combatants (player + multiple enemies),
// HP bars, barriers, trajectory, and overlays with a clean,
// professional military-HUD aesthetic.
// ============================================================

import { CONFIG } from '../config.js';

const C = CONFIG.colors;
const W = CONFIG.world;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = W.width;
    canvas.height = W.height;
  }

  render(world) {
    if (this.canvas.width !== W.width || this.canvas.height !== W.height) {
      this.canvas.width = W.width;
      this.canvas.height = W.height;
    }
    this.worldRef = world;
    const { ctx } = this;
    const { player, enemies, turnSystem, particles } = world || {};
    const enemyList = enemies || (world && world.enemy ? [world.enemy] : []);
    const livingEnemies = enemyList.filter((e) => e && e.hp > 0);

    this._drawArena(ctx);
    this._drawGrid(ctx);
    this._drawVignette(ctx);
    this._drawParticles(ctx, particles);
    this._drawBarriers(ctx, world.barriers || []);
    if (player.hp > 0) this._drawBall(ctx, player);
    for (const enemy of livingEnemies) this._drawBall(ctx, enemy);
    this._drawHpBars(ctx, player, livingEnemies);
    if (world.slingshotInput) {
      world.slingshotInput.draw(ctx);
    }
    this._drawTurnIndicator(ctx, turnSystem);
    if (turnSystem.phase === 'GAME_OVER') {
      this._drawGameOver(ctx, world.winner, world.battleSummary);
    }
  }

  _drawArena(ctx) {
    // Deep gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, W.groundY);
    grad.addColorStop(0, '#0c121e');
    grad.addColorStop(1, '#080c14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W.width, W.groundY);

    // Ground
    ctx.fillStyle = C.ground;
    ctx.fillRect(0, W.groundY, W.width, W.height - W.groundY);

    // Ground line accent
    ctx.fillStyle = C.accent;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, W.groundY, W.width, 2);
    ctx.globalAlpha = 1;
  }

  _drawGrid(ctx) {
    // Faint tactical grid in the playing area
    ctx.strokeStyle = 'rgba(122, 162, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, W.groundY);
      ctx.stroke();
    }
    for (let y = 0; y <= W.groundY; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W.width, y);
      ctx.stroke();
    }
  }

  _drawVignette(ctx) {
    const grad = ctx.createRadialGradient(
      W.width / 2,
      W.groundY / 2,
      W.width * 0.3,
      W.width / 2,
      W.groundY / 2,
      W.width * 0.75
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W.width, W.groundY);
  }

  _drawBall(ctx, ball) {
    const r = ball.radius;
    const isFlashing = ball.flashTimer > 0;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(ball.x, W.groundY + 5, r * 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Forcefield Barrier Bubble (Hexagon)
    if (ball.team === 'player' && this.worldRef?.forcefieldActive) {
      ctx.save();
      ctx.strokeStyle = '#5fd3a8';
      ctx.shadowColor = '#5fd3a8';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const sides = 6;
      const fr = r + 11;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const fx = ball.x + fr * Math.cos(a);
        const fy = ball.y + fr * Math.sin(a);
        if (i === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // Rim light ring behind the ball for a "unit" feel
    ctx.strokeStyle = isFlashing ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Ability Aura Effects
    if (ball.isOvercharged) {
      ctx.strokeStyle = '#ff8a65';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (ball.hasFortified) {
      ctx.strokeStyle = '#7aa2ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body gradient
    const grad = ctx.createRadialGradient(
      ball.x - r * 0.35,
      ball.y - r * 0.45,
      r * 0.15,
      ball.x,
      ball.y,
      r
    );
    if (isFlashing) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, ball.darkColor);
    } else {
      grad.addColorStop(0, this._lighten(ball.color, 0.25));
      grad.addColorStop(1, ball.darkColor);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tactical emblem instead of a cartoon face
    this._drawEmblem(ctx, ball, r);
  }

  _drawEmblem(ctx, ball, r) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.5;

    // Player: chevron ▲
    if (ball.team === 'player') {
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y - r * 0.45);
      ctx.lineTo(ball.x - r * 0.35, ball.y + r * 0.2);
      ctx.lineTo(ball.x + r * 0.35, ball.y + r * 0.2);
      ctx.closePath();
      ctx.stroke();
      return;
    }

    // Enemy archetypes get distinct tactical emblems
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    switch (ball.archetype) {
      case 'tank':
        // Shield block
        ctx.strokeRect(ball.x - r * 0.35, ball.y - r * 0.35, r * 0.7, r * 0.7);
        break;
      case 'striker':
        // Double slash
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fillRect(ball.x - r * 0.25, ball.y - r * 0.45, 3, r * 0.6);
        ctx.fillRect(ball.x + r * 0.15, ball.y - r * 0.45, 3, r * 0.6);
        break;
      default:
        // Standard inverted chevron
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y + r * 0.45);
        ctx.lineTo(ball.x - r * 0.35, ball.y - r * 0.2);
        ctx.lineTo(ball.x + r * 0.35, ball.y - r * 0.2);
        ctx.closePath();
        ctx.stroke();
        break;
    }
  }

  _drawHpBars(ctx, player, enemies) {
    const barWidth = 240;
    const barHeight = 20;
    const y = 42;

    this._drawHpBar(ctx, player, 35, y, barWidth, barHeight, C.hpBarFg);

    // Draw each enemy HP bar stacked on the right side
    enemies.forEach((enemy, i) => {
      const ey = y + i * 52;
      this._drawHpBar(ctx, enemy, W.width - 35 - barWidth, ey, barWidth, barHeight, C.hpBarEnemyFg);

      // Unit header label (Name + Ability)
      ctx.textAlign = 'right';
      ctx.font = '700 14px "Segoe UI", sans-serif';

      const arch = CONFIG.enemyArchetypes[enemy.archetype];
      const abilityTag = arch && arch.ability ? ` • ${arch.ability.toUpperCase()}` : '';
      const title = (enemy.displayName || 'HOSTILE') + abilityTag;

      ctx.fillStyle = enemy.displayName ? C.accent : C.text;
      ctx.fillText(title, W.width - 35, ey - 6);
    });

    // Player label
    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText('YOU', 35, y - 8);
  }

  _drawHpBar(ctx, ball, x, y, w, h, fillColor) {
    const pct = Math.max(0, ball.hp / ball.maxHp);

    ctx.fillStyle = C.hpBarBg;
    ctx.fillRect(x, y, w, h);

    const color = pct > 0.3 ? fillColor : C.hpBarFgLow;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * pct, h);

    // Cyan Shield HP overlay
    const shieldHp = ball.team === 'player' ? (this.worldRef?.run?.shieldHp || 0) : 0;
    if (shieldHp > 0) {
      const shieldPct = Math.min(1, shieldHp / ball.maxHp);
      ctx.fillStyle = 'rgba(79, 195, 247, 0.75)';
      ctx.fillRect(x, y, w * shieldPct, h);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = '#fff';
    ctx.font = '700 12px "Segoe UI", monospace';
    ctx.textAlign = 'center';
    const hpText = shieldHp > 0
      ? `${Math.ceil(ball.hp)} (+${Math.ceil(shieldHp)} Shield) / ${ball.maxHp}`
      : `${Math.ceil(ball.hp)} / ${ball.maxHp}`;
    ctx.fillText(hpText, x + w / 2, y + h - 4.5);
  }

  _drawBarriers(ctx, barriers) {
    for (const barrier of barriers) {
      if (!barrier.active) continue;
      const { x, y, w, h } = barrier;

      // Glowing shield panel
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, 'rgba(122, 162, 255, 0.15)');
      grad.addColorStop(0.5, 'rgba(122, 162, 255, 0.55)');
      grad.addColorStop(1, 'rgba(122, 162, 255, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Border
      ctx.strokeStyle = 'rgba(122, 162, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Energy core line
      ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
      ctx.fillRect(x + w / 2 - 1, y + 6, 2, h - 12);

      // Shield integrity bar
      const maxHp = CONFIG.damage.barrierHp;
      const barW = w + 8;
      const pct = Math.max(0, (barrier.hp ?? maxHp) / maxHp);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x - 4, y - 10, barW, 4);
      ctx.fillStyle = pct > 0.3 ? '#5fd3a8' : '#e0655c';
      ctx.fillRect(x - 4, y - 10, barW * pct, 4);
    }
  }

  _drawParticles(ctx, particles) {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      if (p.type === 'shockwave') {
        ctx.strokeStyle = '#ff8a65';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.currentRadius || p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawTurnIndicator(ctx, turnSystem) {
    let text = '';
    let color = 'rgba(255, 255, 255, 0.75)';

    switch (turnSystem.phase) {
      case 'PLAYER_AIM':
        text = '■ DEPLOYING — drag to charge';
        color = C.player;
        break;
      case 'ENEMY_AIM':
        text = '■ HOSTILE MANEUVERING...';
        color = C.enemy;
        break;
      case 'PLAYER_FLY':
      case 'ENEMY_FLY':
      default:
        return;
    }

    ctx.fillStyle = color;
    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, W.width / 2, W.height - 24);
  }

  _drawGameOver(ctx, winner, summary) {
    ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
    ctx.fillRect(0, 0, W.width, W.height);

    // Accent line
    ctx.fillStyle = C.accent;
    ctx.fillRect(W.width / 2 - 120, W.height / 2 - 86, 240, 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = winner === 'player' ? C.player : C.enemy;
    ctx.font = '700 44px "Segoe UI", sans-serif';
    ctx.fillText(winner === 'player' ? 'CONTRACT COMPLETE' : 'CONTRACT FAILED', W.width / 2, W.height / 2 - 30);

    ctx.fillStyle = C.text;
    ctx.font = '400 16px "Segoe UI", sans-serif';
    ctx.fillText(
      summary ? `${summary.kills} eliminations • ${summary.turns} turns` : 'Battle concluded',
      W.width / 2,
      W.height / 2 + 10
    );

    ctx.fillStyle = C.dim;
    ctx.font = '400 14px "Segoe UI", sans-serif';
    ctx.fillText('Press R or click to continue', W.width / 2, W.height / 2 + 46);
  }

  _lighten(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return `rgb(${r}, ${g}, ${b})`;
  }
}