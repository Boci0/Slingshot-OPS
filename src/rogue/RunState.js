// ============================================================
// RunState — tactical roguelike run state.
// Tracks the player's run-long stats: HP, ATK, DEF, gold,
// boons, node progress, shop discount, and combat history.
// ============================================================

import { CONFIG } from '../config.js';
import { saveSystem } from '../meta/SaveSystem.js';

const RUN = CONFIG.run;

export class RunState {
  constructor(permanentStats = {}) {
    // permanentStats: { atkBonus, hpBonus, defBonus } from the tech tree
    this.reset(permanentStats);
  }

  reset(permanentStats = {}) {
    this.permanent = permanentStats;
    this.maxHp = RUN.maxHpBase + (permanentStats.hpBonus || 0);
    this.hp = this.maxHp;
    this.baseAtk = 10 + (permanentStats.baseAtkBonus || 0);
    this.atkMult = 1.0 + (permanentStats.atkBonus || 0);
    this.def = RUN.defBase + (permanentStats.defBonus || 0);
    this.gold = CONFIG.currency.startGold + (permanentStats.startGoldBonus || 0);
    this.totalGoldSpent = 0;
    this.maxRestHealed = 0;
    this.boons = []; // array of boon ids
    this.relics = []; // array of relic ids (permanent run-scoped items)
    this.shopDiscount = 1 - (permanentStats.shopDiscountBonus || 0);
    this.floor = 0;
    this.baseFloorActions = CONFIG.map.baseFloorActions || 5;
    this.floorActions = this.baseFloorActions;
    this.nodeIndex = -1; // current node on the map
    this.currentNode = null;
    this.nodesCompleted = 0;
    this.combatsWon = 0;
    this.combatsLost = 0;
    this.isBossFloor = false;
    this.runOver = false;
    this.runResult = null; // 'victory' | 'defeat' | 'retreat'
    this.history = []; // log of visited nodes for the map UI
  }

  resetFloorActions(bonus = 0) {
    this.floorActions = (CONFIG.map.baseFloorActions || 5) + bonus;
  }

  spendFloorAction() {
    this.floorActions = Math.max(0, this.floorActions - 1);
    return this.floorActions;
  }

  addFloorActions(amount = 1) {
    this.floorActions += amount;
    return this.floorActions;
  }

  get atkBonusPct() {
    return Math.max(0, this.atkMult - 1.0);
  }

  get atk() {
    return (this.baseAtk * this.atkMult) / 10;
  }

  get totalDef() {
    let base = this.def; // base def from tech tree & boons

    // Base DEF Relics
    if (this.relics.includes('rel_heavy_armor')) base += 8;
    if (this.relics.includes('rel_calcifying_gel')) base += 5;
    if (this.relics.includes('rel_victoria_crown')) base += 3;
    if (this.relics.includes('rel_tactical_edge')) base += 2;
    if (this.relics.includes('rel_plating')) base += 2;
    if (this.relics.includes('rel_titan_plate')) base += 8;
    if (this.relics.includes('rel_bulwark_core')) base += 12;
    if (this.relics.includes('rel_bastion_shield')) base += 16;
    if (this.relics.includes('rel_goliath_carapace')) base += 10;
    if (this.relics.includes('rel_fortress_seal')) base += 15;
    if (this.relics.includes('rel_apex_bulwark')) base += 20;
    if (this.relics.includes('rel_originium_cube')) base += 5;

    // DEF% Bonuses (Tech Tree & Relics)
    let pct = this.permanent?.defPctBonus || 0;
    if (this.relics.includes('rel_nanite_weave')) pct += 0.25;
    if (this.relics.includes('rel_harmonic_barrier')) pct += 0.40;
    if (this.relics.includes('rel_overcharged_plating')) pct += 0.60;
    if (this.relics.includes('rel_goliath_carapace')) pct += 0.30;
    if (this.relics.includes('rel_fortress_seal')) pct += 0.45;
    if (this.relics.includes('rel_apex_bulwark')) pct += 0.60;

    return Math.round(base * (1 + pct));
  }

  get damageReductionPct() {
    let pct = 0;
    if (this.relics.includes('rel_kinetic_absorber')) pct += 0.15;
    if (this.relics.includes('rel_stasis_field')) pct += 0.25;
    if (this.relics.includes('rel_calcifying_gel')) pct += 0.10;
    if (this.relics.includes('rel_bear_claw')) pct -= 0.10;
    return Math.max(0, Math.min(0.85, pct));
  }

  get floorProgress() {
    return `${this.floor + 1}/${CONFIG.map.floors}`;
  }

  /** Get count of a specific boon owned. */
  getBoonCount(boonId) {
    return this.boons.filter((id) => id === boonId).length;
  }

  /** Apply a boon by id at run time (supports stacking). */
  applyBoon(boonId) {
    const def = CONFIG.boons.find((b) => b.id === boonId);
    if (!def) return false;
    this.boons.push(boonId);

    switch (boonId) {
      case 'boon_atk':
        this.atkMult += 0.2;
        break;
      case 'boon_def':
        this.def += 4;
        break;
      case 'boon_hp':
        this.maxHp += 40;
        this.hp += 40;
        break;
      case 'boon_greed':
        this.maxHp -= 5;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        break;
      case 'boon_swift':
        // handled per stack in combat
        break;
      case 'boon_power':
        // handled per stack in combat launch power
        break;
      case 'boon_regen':
        // handled per stack in combat victory
        break;
      default:
        break;
    }
    return true;
  }

  hasBoon(boonId) {
    return this.boons.includes(boonId);
  }

  /** Add a relic to the run. */
  addRelic(relicId) {
    if (!this.relics.includes(relicId)) {
      this.relics.push(relicId);
      // Instant relic effects upon acquisition
      switch (relicId) {
        case 'rel_pawn_ticket':
          this.gold += 25;
          break;
        case 'rel_iron_ration':
          this.maxHp += 50;
          this.hp = Math.min(this.maxHp, this.hp + 50);
          break;
        case 'rel_rhodes_banner':
          this.maxHp += 30;
          this.hp += 30;
          this.atkMult += 0.1;
          break;
        case 'rel_plating':
          this.def += 2;
          break;
        case 'rel_calcifying_gel':
          this.def += 5;
          break;
        case 'rel_bear_claw':
          this.atkMult += 0.35;
          break;
        case 'rel_heavy_armor':
          this.def += 8;
          break;
        case 'rel_victoria_crown':
          this.atkMult += 0.2;
          this.maxHp += 30;
          this.hp += 30;
          this.def += 3;
          break;
        case 'rel_originium_cube':
          this.atkMult += 0.5;
          this.maxHp += 100;
          this.hp += 100;
          this.def += 5;
          this.gold += 100;
          break;
        case 'rel_waraxe':
          this.baseAtk += 3;
          break;
        case 'rel_tactical_edge':
          this.baseAtk += 2;
          this.maxHp += 15;
          this.hp += 15;
          break;
        default:
          break;
      }
    }
  }

  hasRelic(relicId) {
    return this.relics.includes(relicId);
  }

  /** Give gold, respecting Greed bonus and Risk Level Gold penalty. */
  gainGold(amount) {
    const greedCount = this.getBoonCount('boon_greed');
    const greedMult = 1 + greedCount * 0.25;
    const riskMult = saveSystem.getGoldMultiplier();
    const gained = Math.round(amount * greedMult * riskMult);
    this.gold += gained;
    return gained;
  }

  /** Pay gold; false if cannot afford. */
  spendGold(amount) {
    const cost = Math.round(amount * this.shopDiscount);
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.totalGoldSpent = (this.totalGoldSpent || 0) + cost;
    return true;
  }

  /** Discount next shop purchases (stacks multiplicatively). */
  applyShopDiscount() {
    this.shopDiscount *= CONFIG.run.shopDiscountPerVisit;
  }

  /** Heal HP (respects rest cap formula, Risk penalty, and Overflow Shielding). */
  heal(amount, capPct = CONFIG.run.hpRegenMaxPct, techStats = {}) {
    const effective = Math.round(amount * saveSystem.getHealingMultiplier());
    const cap = this.maxHp * capPct;
    const targetHp = Math.min(this.maxHp, this.hp + effective, this.hp + cap);

    if (techStats.hasOverflowShield && (this.hp + effective) > this.maxHp) {
      const overflow = (this.hp + effective) - this.maxHp;
      this.hp = this.maxHp;
      this.shieldHp = Math.min(this.maxHp, (this.shieldHp || 0) + overflow);
    } else {
      this.hp = targetHp;
    }
  }

  /** Restore a flat amount up to max HP (respects Risk penalty and Overflow Shielding). */
  healFlat(amount, techStats = {}) {
    const effective = Math.round(amount * saveSystem.getHealingMultiplier());
    if (techStats.hasOverflowShield && (this.hp + effective) > this.maxHp) {
      const overflow = (this.hp + effective) - this.maxHp;
      this.hp = this.maxHp;
      this.shieldHp = Math.min(this.maxHp, (this.shieldHp || 0) + overflow);
    } else {
      this.hp = Math.min(this.maxHp, this.hp + effective);
    }
  }

  /** Gain max HP (+ heal equal amount by default). */
  addMaxHp(amount) {
    this.maxHp += amount;
    this.hp += amount;
  }

  startBattle() {
    this.isBossFloor = false;
  }

  markBossFloor() {
    this.isBossFloor = true;
  }

  onCombatWon(regenBonus = 0) {
    this.combatsWon += 1;
    const regenCount = this.getBoonCount('boon_regen');
    if (regenCount > 0) {
      this.healFlat(10 * regenCount);
    }
    if (regenBonus) this.healFlat(regenBonus);
  }

  onCombatLost() {
    this.combatsLost += 1;
  }
}