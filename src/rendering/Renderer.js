// ============================================================
// Renderer — tactical presentation layer.
// Draws the arena, combatants (player + multiple enemies),
// HP bars, barriers, trajectory, speed motion trails, screen shake,
// and overlays with a clean, professional military-HUD aesthetic.
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

    this.shakeTime = 0;
    this.shakeIntensity = 0;
  }

  addScreenShake(intensity = 10) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = 0.3; // 300ms duration
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

    // Calculate camera shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= 0.016;
      shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= 0.88;
      if (this.shakeTime <= 0) this.shakeIntensity = 0;
    }

    ctx.save();
    if (shakeX !== 0 || shakeY !== 0) {
      ctx.translate(shakeX, shakeY);
    }

    this._drawArena(ctx);
    this._drawGrid(ctx);
    this._drawVignette(ctx);
    this._drawPlatformsAndObstacles(ctx, world.platforms || [], world.obstacles || []);
    this._drawParticles(ctx, particles);
    this._drawBarriers(ctx, world.barriers || []);
    if (player && player.hp > 0) this._drawBall(ctx, player);
    for (const enemy of livingEnemies) this._drawBall(ctx, enemy);
    this._drawHpBars(ctx, player, livingEnemies);
    if (world.slingshotInput) {
      world.slingshotInput.draw(ctx);
    }
    this._drawTurnIndicator(ctx, turnSystem);
    if (turnSystem.phase === 'GAME_OVER') {
      this._drawGameOver(ctx, world.winner, world.battleSummary);
    }

    ctx.restore();
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

  _drawPlatformsAndObstacles(ctx, platforms, obstacles) {
    // Floating platforms
    for (const p of platforms) {
      ctx.fillStyle = '#28364c';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Destructible obstacle blocks
    for (const ob of obstacles) {
      if (!ob.active) continue;
      const pct = Math.max(0, ob.hp / ob.maxHp);
      ctx.fillStyle = `rgba(224, 101, 92, ${0.2 + pct * 0.5})`;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = '#e0655c';
      ctx.lineWidth = 2;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

      // HP bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(ob.x, ob.y - 6, ob.w, 4);
      ctx.fillStyle = '#e0655c';
      ctx.fillRect(ob.x, ob.y - 6, ob.w * pct, 4);
    }
  }

  _drawBall(ctx, ball) {
    const r = ball.radius;
    const isFlashing = ball.flashTimer > 0;

    // Speed Motion Trail behind fast-moving ball
    const speed = Math.hypot(ball.vx || 0, ball.vy || 0);
    if (speed > 120) {
      const trailLength = Math.min(6, Math.floor(speed / 120));
      for (let i = 1; i <= trailLength; i++) {
        const tx = ball.x - ball.vx * 0.008 * i;
        const ty = ball.y - ball.vy * 0.008 * i;
        ctx.globalAlpha = (1 - i / (trailLength + 1)) * 0.45;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(tx, ty, r * (1 - i * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

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

    // Rim light ring behind the ball
    ctx.strokeStyle = isFlashing ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Ability Aura Effects
    const odStacks = ball.team === 'player' ? (this.worldRef?.battleStats?.overdriveStacks || 0) : 0;
    if (odStacks > 0) {
      ctx.save();
      ctx.strokeStyle = '#e8a94c';
      ctx.shadowColor = '#e8a94c';
      ctx.shadowBlur = 12 + odStacks * 4;
      ctx.lineWidth = 3 + Math.min(6, odStacks);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r + 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 12px Consolas, monospace';
      ctx.fillStyle = '#e8a94c';
      ctx.textAlign = 'center';
      ctx.fillText(`OVERDRIVE x${odStacks}`, ball.x, ball.y - r - 16);
      ctx.restore();
    }

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

    // Tactical emblem
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
        ctx.strokeRect(ball.x - r * 0.35, ball.y - r * 0.35, r * 0.7, r * 0.7);
        break;
      case 'striker':
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fillRect(ball.x - r * 0.25, ball.y - r * 0.45, 3, r * 0.6);
        ctx.fillRect(ball.x + r * 0.15, ball.y - r * 0.45, 3, r * 0.6);
        break;
      default:
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

    if (player) {
      this._drawHpBar(ctx, player, 35, y, barWidth, barHeight, C.hpBarFg);
    }

    enemies.forEach((enemy, i) => {
      const ey = y + i * 52;
      this._drawHpBar(ctx, enemy, W.width - 35 - barWidth, ey, barWidth, barHeight, C.hpBarEnemyFg);

      ctx.textAlign = 'right';
      ctx.font = '700 14px "Segoe UI", sans-serif';

      const arch = CONFIG.enemyArchetypes[enemy.archetype];
      const abilityTag = arch && arch.ability ? ` • ${arch.ability.toUpperCase()}` : '';
      const title = (enemy.displayName || 'HOSTILE') + abilityTag;

      ctx.fillStyle = enemy.displayName ? C.accent : C.text;
      ctx.fillText(title, W.width - 35, ey - 6);
    });

    if (player) {
      ctx.textAlign = 'left';
      ctx.fillStyle = C.text;
      ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText('YOU', 35, y - 8);
    }
  }

  _drawHpBar(ctx, ball, x, y, w, h, fillColor) {
    const pct = Math.max(0, ball.hp / ball.maxHp);

    ctx.fillStyle = C.hpBarBg;
    ctx.fillRect(x, y, w, h);

    const color = pct > 0.3 ? fillColor : C.hpBarFgLow;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * pct, h);

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

      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, 'rgba(122, 162, 255, 0.15)');
      grad.addColorStop(0.5, 'rgba(122, 162, 255, 0.55)');
      grad.addColorStop(1, 'rgba(122, 162, 255, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(122, 162, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
      ctx.fillRect(x + w / 2 - 1, y + 6, 2, h - 12);

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
        const radius = p.radius + (p.maxRadius - p.radius) * (1 - p.life / p.maxLife);
        ctx.strokeStyle = '#ff8a65';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
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