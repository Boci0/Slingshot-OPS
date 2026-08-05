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
    let victimDef = victim.team === 'player' ? (this.stats.playerTotalDef || this.stats.playerDef || 0) : victim.def ?? 0;
    let victimDmgReductionPct = victim.team === 'player' ? (this.stats.playerDamageReductionPct || 0) : 0;

    if (attacker.team === 'player' && this.stats.techStats?.hasArmorPen && victim.team === 'enemy') {
      victimDef = Math.round(victimDef * 0.5);
    }

    const base = speedAPre >= speedBPre ? speedAPre : speedBPre;
    const maxCap = attacker.team === 'enemy' ? 60 : D.maxDamagePerHit;
    baseDamage = Math.min(maxCap, base * D.damagePerSpeed) * attackerAtk;

    if (attacker.team === 'player') {
      const bs = this.stats.battleStats;
      const rels = this.stats.relics || [];
      const tech = this.stats.techStats || {};

      if (tech.hasRiskResonance && this.stats.riskLevel > 0) {
        const riskBonus = 1 + this.stats.riskLevel * 0.02;
        baseDamage *= riskBonus;
      }

      if (attacker.ballType === 'juggernaut') {
        baseDamage *= 1.4;
      }

      if (tech.hasBallisticApex) {
        baseDamage *= 1.15;
      }

      const stacks = (bs && bs.overdriveStacks) ? bs.overdriveStacks : (bs && bs.overdriveActive ? 1 : 0);
      if (stacks > 0) {
        const baseMult = rels.includes('rel_energy_well') ? 2.0 : CONFIG.abilities.overdrive.damageMult;
        const totalMult = baseMult + (stacks - 1) * 0.5;
        baseDamage *= totalMult;
        if (bs.overdriveStacks && bs.overdriveStacks > 0) {
          bs.overdriveStacks -= 1;
        }
        if (!bs.overdriveStacks || bs.overdriveStacks <= 0) {
          bs.overdriveActive = false;
        }
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

      // Elemental Relic: Thermal Engine (Ignites target with 3 turns of Thermal Burn DOT)
      if (rels.includes('rel_pyro')) {
        victim.burnTicks = 3;
        victim.burnDmg = 6;
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

    // DEF Subtraction & Damage Reduction Logic
    let finalDamage;
    if (victim.team === 'player' && attacker.team === 'enemy') {
      finalDamage = this.calculatePlayerDamage(baseDamage, { bypassDef: false });
    } else {
      let damageAfterDef = Math.max(1, baseDamage - victimDef);
      finalDamage = Math.max(1, Math.round(damageAfterDef * (1 - victimDmgReductionPct)));
    }

    if (attacker.team === 'player' && this.stats.relics?.includes('rel_syndicate_blade') && victim.archetype !== 'boss' && victim.displayName !== 'SECTOR COMMANDER') {
      const remainingHp = victim.hp - finalDamage;
      if (remainingHp > 0 && remainingHp <= victim.maxHp * 0.15) {
        finalDamage = victim.hp;
      }
    }

    let isThorn = false;
    if (victim.team === 'enemy' && victim.archetype === 'tank') {
      let rawReflected = Math.max(1, Math.round(finalDamage * D.thornsReturn));

      // Thorns now affected by player's Total DEF!
      const playerDef = this.stats.playerTotalDef || this.stats.playerDef || 0;
      let reflectedAfterDef = Math.max(1, rawReflected - playerDef);

      const thornsResist = this.stats.techStats?.thornsResistPct || 0;
      const playerDmgRed = this.stats.playerDamageReductionPct || 0;
      let finalReflected = Math.max(0, Math.round(reflectedAfterDef * (1 - thornsResist) * (1 - playerDmgRed)));

      if (attacker.team === 'player' && attacker.hitCooldown <= 0 && finalReflected > 0) {
        attacker.takeDamage(finalReflected);
        attacker.flashTimer = 0.15;
        this.events.emit('damage', {
          attacker: victim,
          victim: attacker,
          damage: finalReflected,
          killed: attacker.hp <= 0,
          isThorn: true,
        });
      }
    }

    this.applyDamage(attacker, victim, finalDamage);
  }

  calculatePlayerDamage(rawDamage, { bypassDef = false } = {}) {
    let damage = rawDamage;

    // 1. Flat DEF reduction (unless bypassing DEF, e.g. status DOTs)
    if (!bypassDef) {
      const def = this.stats.playerTotalDef || this.stats.playerDef || 0;
      const effectiveDef = def * 0.75; // Enemies pierce 25% DEF
      const maxDefReduction = damage * 0.70; // 30% min damage floor
      const actualDefReduction = Math.min(maxDefReduction, effectiveDef);
      damage = Math.max(damage * 0.30, damage - actualDefReduction);
    }

    // 2. Percentage Damage Reduction (Relics + Tech Tree Kinetic Dampener)
    let redPct = this.stats.playerDamageReductionPct || 0;
    if (this.stats.techStats?.hasKineticDampener) {
      redPct += 0.25;
    }
    redPct = Math.max(0, Math.min(0.85, redPct));
    damage = Math.max(1, Math.round(damage * (1 - redPct)));

    // 3. Risk Modifier (+X% DMG TAKEN)
    if (this.stats.riskPlusDmgTaken > 0) {
      damage = Math.max(1, Math.round(damage * (1 + this.stats.riskPlusDmgTaken / 100)));
    }

    return Math.max(1, damage);
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