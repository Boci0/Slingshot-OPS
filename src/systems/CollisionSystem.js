// ============================================================
// CollisionSystem — processes physics collision events and
// translates them into game-level effects (damage, sounds, etc.)
// ============================================================

import { CONFIG } from '../config.js';

const D = CONFIG.damage;

export class CollisionSystem {
  constructor(events) {
    this.events = events;
    // Battle stats (ATK/DEF/DMG bonuses) injected by Game from
    // the active run + permanent tech tree. Defined outside the
    // constructor so a fresh battle starts with neutral stats.
    this.stats = {
      playerAtk: 1,
      playerDef: 0,
    };
  }

  setStats(stats) {
    this.stats = { ...this.stats, ...stats };
  }

  /**
   * Process a batch of collision events from the physics step.
   * @param {Array} collisionEvents - events from Physics.stepWorld
   * @param {Array} balls - all balls in the world
   */
  process(collisionEvents, balls) {
    for (const evt of collisionEvents) {
      if (evt.type === 'ball') {
        this.handleBallHit(evt);
      }
    }
  }

  handleBallHit(evt) {
    const { a, b, impactSpeed, speedAPre, speedBPre } = evt;

    // Only deal damage if impact is significant
    if (impactSpeed < D.minImpactSpeed) return;

    let baseDamage = Math.min(D.maxDamagePerHit, impactSpeed * D.damagePerSpeed);
    if (baseDamage <= 0) return;

    // Attribution uses PRE-collision speeds (captured before the
    // impulse was applied). The faster-moving ball is the attacker.
    const attacker = speedAPre >= speedBPre ? a : b;
    if (attacker.hitCooldown > 0) return;
    const victim = attacker === a ? b : a;

    // Per-ball attack/defense: player uses aggregated stats, enemies use their own
    const attackerAtk = attacker.team === 'player' ? this.stats.playerAtk : attacker.atk ?? 1;
    let victimDef = victim.team === 'player' ? this.stats.playerDef : victim.def ?? 0;

    // Armor Penetration tech: ignore 50% of enemy DEF
    if (attacker.team === 'player' && this.stats.techStats?.hasArmorPen && victim.team === 'enemy') {
      victimDef *= 0.5;
    }

    const base = speedAPre >= speedBPre ? speedAPre : speedBPre;
    baseDamage = Math.min(D.maxDamagePerHit, base * D.damagePerSpeed) * attackerAtk;

    // Apply player abilities and relic multipliers BEFORE deducting HP
    if (attacker.team === 'player') {
      const bs = this.stats.battleStats;
      const rels = this.stats.relics || [];
      const tech = this.stats.techStats || {};

      // Risk Resonance tech: damage relics scale with Risk Level (+2% per level)
      if (tech.hasRiskResonance && this.stats.riskLevel > 0) {
        const riskBonus = 1 + this.stats.riskLevel * 0.02;
        baseDamage *= riskBonus;
      }

      // Ballistic Apex tech: damage scales with distance
      if (tech.hasBallisticApex) {
        baseDamage *= 1.15;
      }

      // Overdrive ability (+60% damage, or +100% with Energy Well relic)
      if (bs && bs.overdriveActive) {
        const mult = rels.includes('rel_energy_well') ? 2.0 : CONFIG.abilities.overdrive.damageMult;
        baseDamage *= mult;
        bs.overdriveActive = false; // consume overdrive for this hit
      }

      // Kazimierz Lance (+35% damage on first shot)
      if (rels.includes('rel_knight_lance') && bs && !bs.lanceUsed) {
        baseDamage *= 1.35;
        bs.lanceUsed = true;
      }

      // Gladiator Glove (+25% damage against enemies >75% HP)
      if (rels.includes('rel_gladiator_glove') && victim.hp >= victim.maxHp * 0.75) {
        baseDamage *= 1.25;
      }

      // Originium Dust (+25% damage when player HP < 50%)
      if (rels.includes('rel_blood_sample') && attacker.hp < attacker.maxHp * 0.5) {
        baseDamage *= 1.25;
      }

      // Berserk Injection (+50% damage when player HP < 30%)
      if (rels.includes('rel_combat_drug') && attacker.hp < attacker.maxHp * 0.3) {
        baseDamage *= 1.5;
      }

      // Radiant Crest (+35% damage after wall bounce)
      if (rels.includes('rel_radiant_crest') && bs && bs.wallBounced) {
        baseDamage *= 1.35;
      }

      // Echo Core (+15 flat damage on first hit)
      if (rels.includes('rel_echo') && bs && !bs.echoUsed) {
        baseDamage += 15;
        bs.echoUsed = true;
      }
    }

    // Defense reduction
    const defenseReduction = victimDef * D.defensePerPoint;
    let finalDamage = Math.max(1, Math.round(baseDamage * (1 - defenseReduction)));

    // Kinetic Dampener tech: player takes 25% reduced damage from collisions
    if (victim.team === 'player' && this.stats.techStats?.hasKineticDampener) {
      finalDamage = Math.max(1, Math.round(finalDamage * 0.75));
    }

    // Siracusan Stiletto: execute non-boss enemies hit under 15% HP
    if (attacker.team === 'player' && this.stats.relics?.includes('rel_syndicate_blade') && victim.archetype !== 'boss' && victim.displayName !== 'SECTOR COMMANDER') {
      const remainingHp = victim.hp - finalDamage;
      if (remainingHp > 0 && remainingHp <= victim.maxHp * 0.15) {
        finalDamage = victim.hp; // execute!
      }
    }

    // Tank archetype "thorns": reflect a portion of incoming damage back
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