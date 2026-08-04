// ============================================================
// Custom physics engine.
// Pure functions operating on ball state — usable both for the
// live game and for deterministic AI simulation.
// ============================================================

import { CONFIG } from '../config.js';

const W = CONFIG.world;
const B = CONFIG.ball;

/**
 * Apply gravity + air drag to a ball's velocity.
 */
export function applyForces(ball, dt) {
  ball.vy += W.gravity * dt;
  const drag = 1 - W.airDrag * dt;
  ball.vx *= drag;
  ball.vy *= drag;
}

/**
 * Integrate position from velocity.
 */
export function integrate(ball, dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
}

/**
 * Resolve collisions against the ground and side walls.
 * Returns an array of collision events: { type: 'ground' | 'wall', ball }
 */
export function resolveWorldCollisions(ball) {
  const events = [];
  const r = B.radius;

  // Ground
  if (ball.y + r > W.groundY) {
    ball.y = W.groundY - r;
    if (ball.vy > 0) {
      ball.vy = -ball.vy * W.groundRestitution;
      // Ground friction
      ball.vx *= W.groundFriction;
      events.push({ type: 'ground', ball });
    }
  }

  // Left wall
  if (ball.x - r < 0) {
    ball.x = r;
    if (ball.vx < 0) {
      ball.vx = -ball.vx * W.wallRestitution;
      events.push({ type: 'wall', ball });
    }
  }

  // Right wall
  if (ball.x + r > W.width) {
    ball.x = W.width - r;
    if (ball.vx > 0) {
      ball.vx = -ball.vx * W.wallRestitution;
      events.push({ type: 'wall', ball });
    }
  }

  return events;
}

/**
 * Resolve collision between two balls.
 * Returns a collision event: { type: 'ball', a, b, impactSpeed } or null.
 */
export function resolveBallCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = B.radius * 2;

  if (dist >= minDist || dist === 0) return null;

  // Capture pre-collision speeds for damage attribution.
  // The impulse is applied below BEFORE the event is returned, so
  // post-collision speeds would misattribute the attacker (the
  // striking ball loses speed, the victim gains it).
  const speedAPre = Math.hypot(a.vx, a.vy);
  const speedBPre = Math.hypot(b.vx, b.vy);

  // Separate overlapping balls
  const overlap = minDist - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  a.x -= (nx * overlap) / 2;
  a.y -= (ny * overlap) / 2;
  b.x += (nx * overlap) / 2;
  b.y += (ny * overlap) / 2;

  // Relative velocity along the normal
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;

  // Only resolve if balls are approaching
  if (velAlongNormal > 0) return null;

  const restitution = W.ballRestitution;
  const j = -(1 + restitution) * velAlongNormal;

  // Equal mass assumption (both balls same radius/density)
  a.vx -= (j * nx) / 2;
  a.vy -= (j * ny) / 2;
  b.vx += (j * nx) / 2;
  b.vy += (j * ny) / 2;

  return {
    type: 'ball',
    a,
    b,
    impactSpeed: Math.abs(velAlongNormal),
    speedAPre,
    speedBPre,
  };
}

/**
 * Resolve collisions between a ball and static barrier rectangles.
 * Barriers are axis-aligned rectangles { x, y, w, h } that block shots.
 * Returns collision events: { type: 'barrier', ball, barrier, side }
 */
export function resolveBarrierCollisions(ball, barriers) {
  const events = [];
  const r = B.radius;

  for (const barrier of barriers) {
    if (!barrier.active) continue;

    // Closest point on the rectangle to the ball center
    const cx = Math.max(barrier.x, Math.min(ball.x, barrier.x + barrier.w));
    const cy = Math.max(barrier.y, Math.min(ball.y, barrier.y + barrier.h));
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const distSq = dx * dx + dy * dy;

    if (distSq > r * r) continue;

    const dist = Math.sqrt(distSq);
    let nx, ny;

    if (dist > 0.0001) {
      nx = dx / dist;
      ny = dy / dist;
    } else {
      // Ball center is inside the barrier — push out along the smallest axis
      const left = ball.x - barrier.x;
      const right = barrier.x + barrier.w - ball.x;
      const top = ball.y - barrier.y;
      const bottom = barrier.y + barrier.h - ball.y;
      const minSide = Math.min(left, right, top, bottom);
      if (minSide === left) { nx = -1; ny = 0; }
      else if (minSide === right) { nx = 1; ny = 0; }
      else if (minSide === top) { nx = 0; ny = -1; }
      else { nx = 0; ny = 1; }
    }

    // Reflect velocity if moving into the barrier
    const velDot = ball.vx * nx + ball.vy * ny;
    if (velDot < 0) {
      const impactSpeed = Math.abs(velDot);
      // Damage the barrier on hard impacts (breakable shields)
      if (impactSpeed >= CONFIG.damage.barrierImpactMinSpeed) {
        const dmg = Math.round(impactSpeed * 0.05);
        barrier.hp = Math.max(0, (barrier.hp ?? CONFIG.damage.barrierHp) - dmg);
        if (barrier.hp <= 0) barrier.active = false;
      }
      ball.vx -= (1 + W.wallRestitution) * velDot * nx;
      ball.vy -= (1 + W.wallRestitution) * velDot * ny;
      events.push({ type: 'barrier', ball, barrier, side: { nx, ny }, impactSpeed });
    }
  }

  return events;
}

/**
 * Step the physics for a single ball (forces + integration + world collisions).
 */
export function stepBall(ball, dt) {
  applyForces(ball, dt);
  integrate(ball, dt);
  return resolveWorldCollisions(ball);
}

/**
 * Step the full simulation for a list of balls, including barriers.
 * Returns all collision events this step.
 */
export function stepWorld(balls, dt, barriers = []) {
  const events = [];

  for (const ball of balls) {
    events.push(...stepBall(ball, dt));
    events.push(...resolveBarrierCollisions(ball, barriers));
  }

  // Ball-ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const evt = resolveBallCollision(balls[i], balls[j]);
      if (evt) events.push(evt);
    }
  }

  return events;
}

/**
 * Check if a ball is settled (slow enough to count as stopped).
 */
export function isSettled(ball) {
  return Math.hypot(ball.vx, ball.vy) < W.settleSpeed;
}