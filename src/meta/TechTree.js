// ============================================================
// TechTree — permanent upgrades for ATK / HP / DEF.
// Nodes are bought with Tech Points earned from quests and
// roguelike runs. Purchases persist in SaveSystem.
// ============================================================

import { CONFIG } from '../config.js';

export class TechTree {
  constructor(saveSystem) {
    this.saveSystem = saveSystem;
    this.nodes = CONFIG.techTree;
  }

  getAllNodes() {
    return Object.values(this.nodes);
  }

  getNodeLevel(nodeId) {
    return this.saveSystem.getTechLevel(nodeId);
  }

  isPurchased(nodeId) {
    return this.getNodeLevel(nodeId) > 0;
  }

  isMaxed(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) return true;
    return this.getNodeLevel(nodeId) >= (node.maxLevel || 1);
  }

  getNodeNextCost(nodeId) {
    const node = this.nodes[nodeId];
    if (!node || this.isMaxed(nodeId)) return 0;
    const lvl = this.getNodeLevel(nodeId);
    return node.costs[lvl] ?? node.costs[node.costs.length - 1];
  }

  isUnlocked(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) return false;
    if (!node.requires) return true;
    return this.isPurchased(node.requires);
  }

  canPurchase(nodeId) {
    const node = this.nodes[nodeId];
    if (!node || this.isMaxed(nodeId)) return false;
    if (!this.isUnlocked(nodeId)) return false;
    const cost = this.getNodeNextCost(nodeId);
    return this.saveSystem.data.techPoints >= cost;
  }

  purchase(nodeId) {
    if (!this.canPurchase(nodeId)) return false;
    const cost = this.getNodeNextCost(nodeId);
    if (!this.saveSystem.spendTechPoints(cost)) return false;
    this.saveSystem.purchaseTechNode(nodeId);
    return true;
  }

  /**
   * Compute permanent stat bonuses and feature flags from all purchased nodes.
   */
  getPermanentStats() {
    let atkBonus = 0;
    let baseAtkBonus = 0;
    let hpBonus = 0;
    let defBonus = 0;
    let startGoldBonus = 0;

    const sharpshooterLvl = this.getNodeLevel('atk_sharpshooter');
    atkBonus += sharpshooterLvl * 0.05;

    const basePowerLvl = this.getNodeLevel('atk_base_power');
    baseAtkBonus += basePowerLvl * 0.5;

    const vitLvl = this.getNodeLevel('vit_health');
    hpBonus += vitLvl * 15;

    const aegisLvl = this.getNodeLevel('def_aegis');
    defBonus += aegisLvl * 1.5;

    const matrixPctLvl = this.getNodeLevel('def_matrix_pct');
    const defPctBonus = matrixPctLvl * 0.05;

    const thornsResistLvl = this.getNodeLevel('def_thorns_resist');
    const thornsResistPct = thornsResistLvl * 0.15;

    const warChestLvl = this.getNodeLevel('tac_war_chest');
    startGoldBonus += warChestLvl * 8;

    return {
      atkBonus,
      baseAtkBonus,
      hpBonus,
      defBonus,
      defPctBonus,
      thornsResistPct,
      startGoldBonus,

      // Feature flags
      hasArmorPen: this.isPurchased('atk_armor_pen'),
      hasRiskResonance: this.isPurchased('atk_risk_resonance'),
      hasBallisticApex: this.isPurchased('atk_ballistic_apex'),

      hasOverflowShield: this.isPurchased('vit_overflow_shield'),
      hasEmergencyMedkit: this.isPurchased('vit_emergency_medkit'),
      hasTitanCore: this.isPurchased('vit_titan_core'),

      hasForcefield: this.isPurchased('def_forcefield'),
      hasFortifiedMatrix: this.isPurchased('def_fortified_matrix'),
      hasKineticDampener: this.isPurchased('def_kinetic_dampener'),

      hasMerchant: this.isPurchased('tac_merchant'),
      hasLogistics: this.isPurchased('tac_logistics'),
      hasIntellect: this.isPurchased('tac_intellect'),
    };
  }

  /** Total spent Tech Points across all purchased nodes (for HUD). */
  getTotalSpent() {
    let total = 0;
    for (const node of this.getAllNodes()) {
      const lvl = this.getNodeLevel(node.id);
      for (let i = 0; i < lvl; i++) {
        total += node.costs[i] || 0;
      }
    }
    return total;
  }
}