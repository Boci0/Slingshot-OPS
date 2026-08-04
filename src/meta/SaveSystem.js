// ============================================================
// SaveSystem — persistence foundation for permanent upgrades,
// tech trees, and roguelike meta-progression.
//
// Stores data in localStorage. Old saves are migrated by merging
// defaults so missing fields (techPoints, techTreePurchases, etc.)
// never cause runtime errors.
// ============================================================

import { CONFIG } from '../config.js';

const STORAGE_KEY = 'slingshot-save-v1';

export class SaveSystem {
  constructor() {
    this.data = this._load();
  }

  _defaults() {
    return {
      version: 2,
      profile: {
        name: 'operator',
        callsign: 'SLING-01',
      },
      meta: {
        totalWins: 0,
        totalLosses: 0,
        totalMatches: 0,
        totalRuns: 0,
        questsCompleted: 0,
      },
      techPoints: 0, // currency earned from quests/roguelike runs
      difficultyLevel: 0, // 0 to 15 risk level (+1% enemy stats per level)
      techTreePurchases: {}, // nodeId -> level purchased (1)
      upgrades: {}, // legacy field kept for compatibility
      unlockedPerks: [], // roguelike perk ids
      techTree: {}, // legacy: placeholder
      progression: {
        completedLevels: 1,
        unlockedLevels: 1,
      },
    };
  }

  _load() {
    const defaults = this._defaults();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate old saves: merge defaults so missing fields are filled
        return {
          ...defaults,
          ...parsed,
          profile: { ...defaults.profile, ...(parsed.profile || {}) },
          meta: { ...defaults.meta, ...(parsed.meta || {}) },
          techTreePurchases: (typeof parsed.techPoints === 'number' ? parsed : {})?.techTreePurchases || {},
          upgrades: parsed.upgrades || {},
          unlockedPerks: parsed.unlockedPerks || [],
          techTree: parsed.techTree || {},
          progression: { ...defaults.progression, ...(parsed.progression || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return defaults;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn('Failed to save:', e);
      return false;
    }
  }

  recordMatch(win) {
    this.data.meta.totalMatches += 1;
    if (win) {
      this.data.meta.totalWins += 1;
    } else {
      this.data.meta.totalLosses += 1;
    }
    this.save();
  }

  recordRun(win) {
    this.data.meta.totalRuns += 1;
    if (win) {
      this.data.meta.totalWins += 1;
    } else {
      this.data.meta.totalLosses += 1;
    }
    this.save();
  }

  addTechPoints(amount) {
    this.data.techPoints += amount;
    this.save();
  }

  spendTechPoints(amount) {
    if (this.data.techPoints < amount) return false;
    this.data.techPoints -= amount;
    this.save();
    return true;
  }

  getTechLevel(nodeId) {
    const val = (this.data.techTreePurchases || {})[nodeId];
    if (val === true) return 1;
    if (typeof val === 'number') return val;
    return 0;
  }

  purchaseTechNode(nodeId) {
    const current = this.getTechLevel(nodeId);
    this.data.techTreePurchases[nodeId] = current + 1;
    this.save();
    return current + 1;
  }

  hasTechNode(nodeId) {
    return this.getTechLevel(nodeId) > 0;
  }

  recordQuestCompleted() {
    this.data.meta.questsCompleted += 1;
    this.save();
  }

  getProfile() {
    return this.data.profile;
  }

  getMeta() {
    return this.data.meta;
  }

  getDifficultyLevel() {
    return Math.max(0, Math.min(15, this.data.difficultyLevel || 0));
  }

  setDifficultyLevel(level) {
    this.data.difficultyLevel = Math.max(0, Math.min(15, Math.floor(level)));
    this.save();
  }

  getRiskData() {
    const level = this.getDifficultyLevel();
    return CONFIG.riskTable[level] || CONFIG.riskTable[0];
  }

  getHealingMultiplier() {
    const risk = this.getRiskData();
    return Math.max(0.2, 1 - (risk.minusHeal || 0) / 100);
  }

  getGoldMultiplier() {
    const risk = this.getRiskData();
    return Math.max(0.2, 1 - (risk.minusGold || 0) / 100);
  }

  getShopPriceMultiplier() {
    const risk = this.getRiskData();
    return 1 + (risk.plusCost || 0) / 100;
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this._load();
  }
}

export const saveSystem = new SaveSystem();