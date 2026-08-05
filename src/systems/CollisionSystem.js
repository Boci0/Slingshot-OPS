// ============================================================
// CollisionSystem — processes physics collision events and
// translates them into game-level damage, status effects, and
// elemental relic triggers (Singularity pull, Thermal burn, Cryo slow).
// ============================================================

import { CONFIG } from '../config.js';

const D = CONFIG.damage;

export class CollisionSystem {
  constructor(events) {
    this.events = events;
    this.stats = {
      playerAtk: 1,
      playerDef: 0,
    };
  }

  setStats(stats) {
    this.stats = { ...this.stats, ...stats };
  }

  process(collisionEvents, balls) {
    for (const evt of collisionEvents) {
      if (evt.type === 'ball') {
        this.handleBallHit(evt, balls);
      }
    }
  }

  handleBallHit(evt, allBalls) {
    const { a, b, impactSpeed, speedAPre, speedBPre } = evt;

    if (impactSpeed < D.minImpactSpeed) return;

    let baseDamage = Math.min(D.maxDamagePerHit, impactSpeed * D.damagePerSpeed);
    if (baseDamage <= 0) return;

    const attacker = speedAPre >= speedBPre ? a : b;
    if (attacker.hitCooldown > 0) return;
    const victim = attacker === a ? b : a;

    const attackerAtk = attacker.team === 'player' ? this.stats.playerAtk : attacker.atk ?? 1;
    let victimDef = victim.team === 'player' ? this.stats.playerDef : victim.def ?? 0;

    if (attacker.team === 'player' && this.stats.techStats?.hasArmorPen && victim.team === 'enemy') {
      victimDef *= 0.5;
    }

    const base = speedAPre >= speedBPre ? speedAPre : speedBPre;
    baseDamage = Math.min(D.maxDamagePerHit, base * D.damagePerSpeed) * attackerAtk;

    if (attacker.team === 'player') {
      const bs = this.stats.battleStats;
      const rels = this.stats.relics || [];
      const tech = this.stats.techStats || {};

      if (tech.hasRiskResonance && this.stats.riskLevel > 0) {
        const riskBonus = 1 + this.stats.riskLevel * 0.02;
        baseDamage *= riskBonus;
      }

      if (tech.hasBallisticApex) {
        baseDamage *= 1.15;
      }

      if (bs && bs.overdriveActive) {
        const mult = rels.includes('rel_energy_well') ? 2.0 : CONFIG.abilities.overdrive.damageMult;
        baseDamage *= mult;
        bs.overdriveActive = false;
      }

      if (rels.includes('rel_knight_lance') && bs && !bs.lanceUsed) {
        baseDamage *= 1.35;
        bs.lanceUsed = true;
      }

      if (rels.includes('rel_gladiator_glove') && victim.hp >= victim.maxHp * 0.75) {
        baseDamage *= 1.25;
      }

      if (rels.includes('rel_blood_sample') && attacker.hp < attacker.maxHp * 0.5) {
        baseDamage *= 1.25;
      }

      if (rels.includes('rel_combat_drug') && attacker.hp < attacker.maxHp * 0.3) {
        baseDamage *= 1.5;
      }

      if (rels.includes('rel_radiant_crest') && bs && bs.wallBounced) {
        baseDamage *= 1.35;
      }

      if (rels.includes('rel_echo') && bs && !bs.echoUsed) {
        baseDamage += 15;
        bs.echoUsed = true;
      }

      // Elemental Relic: Thermal Engine (+5 Burn DOT)
      if (rels.includes('rel_pyro')) {
        baseDamage += 5;
      }

      // Elemental Relic: Cryo Coil (Freezes target, slows next turn launch)
      if (rels.includes('rel_cryo')) {
        victim.isFrozen = true;
      }

      // Elemental Relic: Singularity Core (Pulls nearby enemies toward crash site)
      if (rels.includes('rel_graviton') && allBalls) {
        for (const ball of allBalls) {
          if (ball !== victim && ball.team === 'enemy' && ball.hp > 0) {
            const dx = victim.x - ball.x;
            const dy = victim.y - ball.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 350) {
              const pullForce = (1 - dist / 350) * 380;
              ball.vx += (dx / dist) * pullForce;
              ball.vy += (dy / dist) * pullForce;
            }
          }
        }
      }
    }

    const defenseReduction = victimDef * D.defensePerPoint;
    let finalDamage = Math.max(1, Math.round(baseDamage * (1 - defenseReduction)));

    if (victim.team === 'player' && this.stats.techStats?.hasKineticDampener) {
      finalDamage = Math.max(1, Math.round(finalDamage * 0.75));
    }

    if (attacker.team === 'player' && this.stats.relics?.includes('rel_syndicate_blade') && victim.archetype !== 'boss' && victim.displayName !== 'SECTOR COMMANDER') {
      const remainingHp = victim.hp - finalDamage;
      if (remainingHp > 0 && remainingHp <= victim.maxHp * 0.15) {
        finalDamage = victim.hp;
      }
    }

    let isThorn = false;
    if (victim.team === 'enemy' && victim.archetype === 'tank') {
      let reflected = Math.max(1, Math.round(finalDamage * D.thornsReturn));
      const thornsResist = this.stats.techStats?.thornsResistPct || 0;
      if (thornsResist > 0) {
        reflected = Math.max(0, Math.round(reflected * (1 - thornsResist)));
      }
      if (attacker.team === 'player' && attacker.hitCooldown <= 0 && reflected > 0) {
        attacker.takeDamage(reflected);
        attacker.flashTimer = 0.15;
        this.events.emit('damage', {
          attacker: victim,
          victim: attacker,
          damage: reflected,
          killed: attacker.hp <= 0,
          isThorn: true,
        });
      }
    }

    this.applyDamage(attacker, victim, finalDamage);
  }

  applyDamage(attacker, victim, damage) {
    attacker.hitCooldown = D.hitCooldown;
    const killed = victim.takeDamage(damage);
    this.events.emit('damage', {
      attacker,
      victim,
      damage,
      killed,
    });
  }
}