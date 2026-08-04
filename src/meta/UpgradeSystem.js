// ============================================================
// UpgradeSystem — extension point for permanent upgrades,
// tech trees, and roguelike perks.
//
// Currently a stub with a clear interface. Future work:
//  - Define upgrade nodes (damage, hp, power, drag, etc.)
//  - Apply upgrade values to CONFIG via applyUpgrades()
//  - Track tech tree progress through SaveSystem
// ============================================================

export class UpgradeSystem {
  constructor(saveSystem) {
    this.saveSystem = saveSystem;
  }

  /**
   * Apply all owned upgrades to the game configuration.
   * Future: mutate CONFIG values based on saveSystem.data.upgrades.
   */
  applyUpgrades() {
    const upgrades = this.saveSystem.data.upgrades ?? {};

    // TODO: Example upgrade hooks:
    // if (upgrades.damageBoost) CONFIG.damage.damagePerSpeed *= 1 + 0.1 * upgrades.damageBoost;
    // if (upgrades.hpBoost) CONFIG.ball.maxHp *= 1 + 0.1 * upgrades.hpBoost;
    // if (upgrades.powerBoost) CONFIG.slingshot.maxPower *= 1 + 0.1 * upgrades.powerBoost;

    return upgrades;
  }

  /**
   * Purchase/acquire an upgrade. Future: check cost/requirements.
   */
  acquireUpgrade(id, level = 1) {
    const upgrades = this.saveSystem.data.upgrades;
    upgrades[id] = (upgrades[id] ?? 0) + level;
    this.saveSystem.save();
  }

  getUpgradeLevel(id) {
    return this.saveSystem.data.upgrades[id] ?? 0;
  }
}