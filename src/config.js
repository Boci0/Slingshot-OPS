// ============================================================
// Slingshot — Central Game Configuration
// All tunable constants and content data (quests, tech tree,
// perks, roguelike map rules) live here.
// ============================================================

export const CONFIG = {
  // --- World ---
  world: {
    width: 1280,
    height: 750,
    groundY: 620, // y-coordinate of the ground surface
    gravity: 1500, // px/s^2
    airDrag: 0.0012, // velocity damping per second (0 = none)
    groundFriction: 0.85, // horizontal velocity multiplier per second on ground contact
    groundRestitution: 0.55, // bounce factor off ground
    wallRestitution: 0.7, // bounce factor off side walls
    ballRestitution: 0.75, // bounce factor between balls
    settleSpeed: 12, // px/s — below this both balls are "settled"
    settleTime: 0.5, // seconds both balls must be settled to end turn
  },

  // --- Ball / Character ---
  ball: {
    radius: 32,
    maxHp: 100,
  },

  // --- Slingshot (player) ---
  slingshot: {
    maxPower: 1400, // max launch speed px/s
    minPower: 150,
    powerScale: 4.5, // drag distance (px) → launch speed multiplier
    maxDragDistance: 300,
    trajectoryPoints: 40,
    trajectoryStep: 0.05,
  },

  // --- Damage ---
  damage: {
    minImpactSpeed: 120, // below this, no damage on hit
    damagePerSpeed: 0.02, // damage = impactSpeed * this (e.g. 900px/s → 18 dmg)
    maxDamagePerHit: 30,
    hitCooldown: 0.4,
    defensePerPoint: 0.04, // damage reduction per DEF point (cap 60%)
    thornsReturn: 0.3, // tank enemy reflects 30% of damage taken
    barrierHp: 60, // barriers break after taking this much damage
    barrierImpactMinSpeed: 200, // min ball speed to damage a barrier
  },

  // --- Enemy archetypes (unique abilities) ---
  enemyArchetypes: {
    standard: {
      name: 'HOSTILE UNIT',
      hpMult: 1, atkMult: 1, defBonus: 0, aiShift: 0,
      ability: null, abilityDesc: 'Standard combatant unit',
      color: '#e0655c', darkColor: '#a83b35',
    },
    tank: {
      name: 'WALL UNIT',
      hpMult: 1.6, atkMult: 0.85, defBonus: 4, aiShift: -0.05,
      ability: 'thorns',
      abilityDesc: 'Reflects 20% impact damage & deploys cover barriers',
      color: '#4a6572', darkColor: '#263238',
    },
    striker: {
      name: 'SNIPER UNIT',
      hpMult: 1.1, atkMult: 1.3, defBonus: 0, aiShift: 0.15,
      ability: 'aggressive',
      abilityDesc: 'Fires faster & charges Overdrive pulse shots (+50% velocity & ATK)',
      color: '#f57c00', darkColor: '#e65100',
    },
    vampire: {
      name: 'SIPHON DRONE',
      hpMult: 1.25, atkMult: 1.1, defBonus: 2, aiShift: 0.05,
      ability: 'vampire',
      abilityDesc: 'Heals 40% of damage dealt to player and restores HP to squad',
      color: '#d32f2f', darkColor: '#8b0000',
    },
    pyromancer: {
      name: 'BLAZE MORTAR',
      hpMult: 1.2, atkMult: 1.25, defBonus: 1, aiShift: 0.1,
      ability: 'pyro',
      abilityDesc: 'Ignites target with 2 turns of Thermal Burn (8 DMG/turn) and melts player barriers',
      color: '#ff5722', darkColor: '#bf360c',
    },
    disruptor: {
      name: 'GRAVITON WEAVER',
      hpMult: 1.3, atkMult: 1.0, defBonus: 3, aiShift: 0.08,
      ability: 'disrupt',
      abilityDesc: 'Emits a gravitic pulse pulling player ball toward obstacles on turn start',
      color: '#7b1fa2', darkColor: '#4a148c',
    },
    tactician: {
      name: 'FIELD COMMANDER',
      hpMult: 1.4, atkMult: 1.15, defBonus: 3, aiShift: 0.12,
      ability: 'command',
      abilityDesc: 'Rallies all hostiles on turn start granting +20% ATK and +3 DEF',
      color: '#ffb300', darkColor: '#ff8f00',
    },
    corroder: {
      name: 'ACID DRONE',
      hpMult: 1.2, atkMult: 1.05, defBonus: 1, aiShift: 0.08,
      ability: 'corrode',
      abilityDesc: 'Emits a corrosive acid splash reducing player DEF by -4 for the battle',
      color: '#aeea00', darkColor: '#33691e',
    },
  },

  // --- Enemy Tiers (Initial Base Enemy Stats per Floor) ---
  enemyTiers: {
    1: { hp: 95, atk: 1.05, def: 0, aiDifficulty: 0.35 },
    2: { hp: 120, atk: 1.25, def: 1, aiDifficulty: 0.45 },
    3: { hp: 150, atk: 1.50, def: 2, aiDifficulty: 0.60 },
    4: { hp: 185, atk: 1.80, def: 3, aiDifficulty: 0.72 },
    5: { hp: 225, atk: 2.15, def: 4, aiDifficulty: 0.85 },
    elite: { hp: 280, atk: 2.30, def: 5, aiDifficulty: 0.92 },
    miniboss: { hp: 340, atk: 2.45, def: 5, aiDifficulty: 0.94 },
    boss: { hp: 400, atk: 2.65, def: 6, aiDifficulty: 0.96 },
  },

  // --- Risk Level Scaling Table (1 to 15) ---
  riskTable: {
    0: { hpPct: 0, atkPct: 0, defPct: 0, minusHeal: 0, plusCost: 0, minusGold: 0 },
    1: { hpPct: 1, atkPct: 1, defPct: 1, minusHeal: 0, plusCost: 0, minusGold: 0 },
    2: { hpPct: 2, atkPct: 2, defPct: 2, minusHeal: 0, plusCost: 0, minusGold: 0 },
    3: { hpPct: 3, atkPct: 3, defPct: 3, minusHeal: 0, plusCost: 0, minusGold: 0 },
    4: { hpPct: 4, atkPct: 4, defPct: 4, minusHeal: 0, plusCost: 0, minusGold: 0 },
    5: { hpPct: 5, atkPct: 5, defPct: 5, minusHeal: 2, plusCost: 0, minusGold: 0 },
    6: { hpPct: 7, atkPct: 7, defPct: 7, minusHeal: 3, plusCost: 0, minusGold: 0 },
    7: { hpPct: 9, atkPct: 9, defPct: 9, minusHeal: 5, plusCost: 0, minusGold: 0 },
    8: { hpPct: 12, atkPct: 12, defPct: 12, minusHeal: 10, plusCost: 2, minusGold: 0 },
    9: { hpPct: 15, atkPct: 15, defPct: 15, minusHeal: 15, plusCost: 4, minusGold: 0 },
    10: { hpPct: 18, atkPct: 18, defPct: 18, minusHeal: 20, plusCost: 6, minusGold: 0, plusDmgTaken: 2 },
    11: { hpPct: 21, atkPct: 21, defPct: 21, minusHeal: 25, plusCost: 8, minusGold: 0, plusDmgTaken: 3.5 },
    12: { hpPct: 24, atkPct: 24, defPct: 24, minusHeal: 30, plusCost: 10, minusGold: 5, plusDmgTaken: 5 },
    13: { hpPct: 27, atkPct: 27, defPct: 27, minusHeal: 35, plusCost: 13, minusGold: 10, plusDmgTaken: 6.5 },
    14: { hpPct: 30, atkPct: 30, defPct: 30, minusHeal: 40, plusCost: 15, minusGold: 15, plusDmgTaken: 8 },
    15: { hpPct: 35, atkPct: 35, defPct: 35, minusHeal: 50, plusCost: 20, minusGold: 20, plusDmgTaken: 10 },
  },
  // Multi-enemy waves per node type + floor (1 to 3 enemies per stage)
  enemyCounts: {
    combat: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 },
    elite: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 },
    miniboss: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    boss: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
  },
  // Archetype pick weights per floor (proportion of each type)
  archetypeWeights: {
    1: { standard: 0.6, tank: 0.2, striker: 0.2 },
    2: { standard: 0.3, tank: 0.2, striker: 0.2, vampire: 0.15, pyromancer: 0.15 },
    3: { standard: 0.2, tank: 0.15, striker: 0.15, disruptor: 0.15, tactician: 0.15, corroder: 0.2 },
    4: { standard: 0.1, tank: 0.15, striker: 0.15, vampire: 0.15, pyromancer: 0.15, disruptor: 0.1, tactician: 0.1, corroder: 0.1 },
    5: { standard: 0.1, tank: 0.15, striker: 0.15, vampire: 0.15, pyromancer: 0.15, disruptor: 0.1, tactician: 0.1, corroder: 0.1 },
    elite: { tank: 0.15, striker: 0.15, vampire: 0.15, pyromancer: 0.15, disruptor: 0.1, tactician: 0.15, corroder: 0.15 },
    miniboss: { tank: 0.15, striker: 0.15, vampire: 0.15, pyromancer: 0.15, disruptor: 0.1, tactician: 0.15, corroder: 0.15 },
    boss: { tank: 0.2, striker: 0.2, disruptor: 0.2, tactician: 0.2, pyromancer: 0.1, corroder: 0.1 },
  },

  // --- Enemy AI ---
  ai: {
    difficulty: 0.5, // 0 = easy, 1 = hard
    maxErrorDegrees: 6,
    maxPowerError: 0.12,
    thinkDelay: 0.8,
    simulationSteps: 200,
    simulationDt: 1 / 60,
  },

  // --- Turn timing ---
  turn: {
    minTurnTime: 0.3,
  },

  // --- Battle abilities (used every few turns) ---
  abilities: {
    overdrive: {
      id: 'overdrive',
      name: 'OVERDRIVE',
      desc: 'Next shot deals 1.5x damage (+50% bonus damage)',
      cooldown: 3, // turns between uses
      duration: 1, // applies to next shot
      damageMult: 1.5,
      color: '#e8a94c',
    },
    barrier: {
      id: 'barrier',
      name: 'DEPLOY BARRIER',
      desc: 'Place a protective barrier shield',
      cooldown: 4, // turns between uses
      maxActive: 2, // max barriers on the field at once
      color: '#7aa2ff',
    },
  },

  // --- Roguelike run modifiers ---
  run: {
    maxHpBase: 100,
    atkBase: 1,
    defBase: 0,
    maxDefCap: 15, // DEF cap = 60% damage reduction
    hpRegenPerRest: 30, // HP restored at a Rest node
    hpRegenMaxPct: 0.5, // ... but capped at 50% of max HP
    shopDiscountPerVisit: 0.9, // ×0.9 gold cost per shop visit (stacks)
  },

  // --- Roguelike map generation ---
  map: {
    floors: 5,
    rows: 5, // 5 rows for 4-directional grid
    cols: 5, // 5 columns centered on row 2, col 2
    baseFloorActions: 5, // 5 actions minimum per floor
    colGap: 180, // horizontal spacing between columns
    rowGap: 125, // vertical spacing between rows
    nodeRadius: 28,
    floorWidth: 1280, // floor map canvas width
    floorHeight: 750, // floor map canvas height
  },

  // --- Arena Obstacles & Floating Platforms ---
  arenaLayouts: {
    1: { platforms: [], obstacles: [] },
    2: {
      platforms: [{ x: 540, y: 380, w: 200, h: 20, active: true }],
      obstacles: [{ x: 620, y: 480, w: 40, h: 120, hp: 60, maxHp: 60, active: true }],
    },
    3: {
      platforms: [
        { x: 420, y: 340, w: 160, h: 20, active: true },
        { x: 700, y: 340, w: 160, h: 20, active: true },
      ],
      obstacles: [{ x: 620, y: 450, w: 40, h: 150, hp: 90, maxHp: 90, active: true }],
    },
    4: {
      platforms: [
        { x: 380, y: 320, w: 140, h: 20, active: true },
        { x: 760, y: 320, w: 140, h: 20, active: true },
      ],
      obstacles: [
        { x: 520, y: 420, w: 35, h: 180, hp: 120, maxHp: 120, active: true },
        { x: 720, y: 420, w: 35, h: 180, hp: 120, maxHp: 120, active: true },
      ],
    },
    5: {
      platforms: [
        { x: 340, y: 280, w: 180, h: 20, active: true },
        { x: 760, y: 280, w: 180, h: 20, active: true },
      ],
      obstacles: [
        { x: 615, y: 360, w: 50, h: 240, hp: 200, maxHp: 200, active: true },
      ],
    },
  },

  // --- Currency ---
  currency: {
    techPointName: 'Tech Points',
    goldName: 'Gold',
    startGold: 30,
  },

  // --- Relics (permanent run-scoped items bought at shops) ---
  relics: [
    { id: 'rel_family_feast', name: 'Family Feast', desc: 'Safe Zone nodes grant +15 Max HP in addition to healing', cost: 28 },
    { id: 'rel_echo', name: 'Echo Core', desc: 'First hit each combat deals +15 damage', cost: 25 },
    { id: 'rel_thorns', name: 'Thorns Sigil', desc: 'Reflect 25% of damage taken back to attackers', cost: 28 },
    { id: 'rel_overcharge', name: 'Overcharge Cell', desc: 'Abilities recharge 1 turn faster', cost: 30 },
    { id: 'rel_magnet', name: 'Gold Magnet', desc: '+5 gold after every combat', cost: 20 },
    { id: 'rel_plating', name: 'Reactive Plating', desc: '+10% launch power', cost: 22 },
    { id: 'rel_medic', name: 'Auto-Medic', desc: 'Restore 5 HP at the end of every turn', cost: 26 },
  ],

  // --- Roguelike node definitions ---
  nodes: {
    // Appearance weights per floor
    floorWeights: {
      1: { combat: 6, encounter: 3, shop: 1, rest: 1, minigame: 1, elite: 1 },
      2: { combat: 4, encounter: 3, shop: 2, rest: 2, minigame: 2, elite: 2 },
      3: { combat: 4, encounter: 2, shop: 2, rest: 2, minigame: 2, elite: 2 },
      4: { combat: 3, encounter: 2, shop: 2, rest: 1, minigame: 2, elite: 3 },
      5: { combat: 3, encounter: 2, shop: 2, rest: 2, minigame: 2, elite: 3 },
    },
    rewards: {
      combat: { gold: 12, tech: 1, healMax: 15 },
      elite: { gold: 25, tech: 2, healMax: 25 },
      miniboss: { gold: 50, tech: 4, healMax: 30, relics: 2 },
      boss: { gold: 40, tech: 4, healMax: 50 },
      encounter: { gold: 8, tech: 1, minHpLoss: 5, maxHpLoss: 14 },
      minigame: { gold: 15, tech: 1 },
      shop: {},
      rest: {},
    },
  },

  // --- Shop content ---
  shop: {
    items: [
      { id: 'atk_up', name: 'Refined Cores', desc: '+25% ATK for the rest of the run', cost: 20, type: 'atk', value: 0.25 },
      { id: 'def_up', name: 'Plating Module', desc: '+3 DEF for the rest of the run', cost: 20, type: 'def', value: 3 },
      { id: 'hp_up', name: 'Vitality Injector', desc: '+30 max HP for the rest of the run', cost: 18, type: 'maxhp', value: 30 },
      { id: 'heal', name: 'Medkit', desc: 'Restore 40 HP', cost: 15, type: 'heal', value: 40 },
      { id: 'gold_vault', name: 'Smuggler Cache', desc: 'Gain 18 Gold', cost: 0, type: 'gold', value: 18, requireGold: true, getGold: 18 },
    ],
  },

  // --- AI-generated quests (complete during roguelike runs) ---
  quests: [
    { id: 'quest_first_blood', name: 'First Blood', desc: 'Deal damage to an enemy in a combat node', reward: 1 },
    { id: 'quest_one_turn_win', name: 'One Shot', desc: 'End a combat in a single turn without taking damage', reward: 2 },
    { id: 'quest_no_damage', name: 'Untouchable', desc: 'Win a combat node without taking damage', reward: 3 },
    { id: 'quest_speed_win', name: 'Blitz', desc: 'Win a combat in 3 turns or fewer', reward: 2 },
    { id: 'quest_shopping', name: 'All In', desc: 'Spend 40+ Gold at shops across one run', reward: 2 },
    { id: 'quest_boss_kill', name: 'Slayer', desc: 'Defeat a boss node', reward: 4 },
    { id: 'quest_minigame', name: 'Precision', desc: 'Win a minigame node with perfect timing', reward: 2 },
    { id: 'quest_perfect', name: 'Flawless Run', desc: 'Reach floor 5 without losing a combat', reward: 5 },
    { id: 'quest_elite', name: 'Elite Killer', desc: 'Defeat an elite combat node', reward: 3 },
    { id: 'quest_rest', name: 'Recovery', desc: 'Use a Safe Zone node to heal 40+ HP in one run', reward: 1 },
    { id: 'quest_bounce', name: 'Pinball', desc: 'Hit an enemy after a wall bounce', reward: 1 },
    { id: 'quest_lowhp', name: 'Survivor', desc: 'Win a combat with 10 HP or less', reward: 3 },
  ],

  // --- Permanent Tech Tree (bought with Tech Points) ---
  techTree: {
    // ATK branch
    atk_sharpshooter: { id: 'atk_sharpshooter', label: 'Sharpshooter', desc: 'Increases damage dealt (+5% per rank)', maxLevel: 10, costs: [6, 10, 14, 18, 22, 28, 34, 40, 48, 56], branch: 'atk', icon: '[+]', requires: null },
    atk_base_power: { id: 'atk_base_power', label: 'Base ATK Core', desc: 'Increases squad Base ATK (+0.5 Base ATK per rank)', maxLevel: 10, costs: [8, 12, 16, 20, 26, 32, 40, 48, 58, 70], branch: 'atk', icon: '[ATK]', requires: 'atk_sharpshooter' },
    atk_armor_pen: { id: 'atk_armor_pen', label: 'Armor Penetration', desc: 'Direct ball impacts ignore enemy DEF (+5% per rank)', maxLevel: 10, costs: [10, 14, 18, 24, 30, 38, 46, 56, 68, 82], branch: 'atk', icon: '[PEN]', requires: 'atk_base_power' },
    atk_risk_resonance: { id: 'atk_risk_resonance', label: 'Risk Resonance', desc: 'Deals extra damage per Risk Level (+0.5% per rank)', maxLevel: 10, costs: [12, 16, 20, 26, 34, 42, 52, 64, 78, 94], branch: 'atk', icon: '[R]', requires: 'atk_armor_pen' },
    atk_ballistic_apex: { id: 'atk_ballistic_apex', label: 'Ballistic Apex', desc: 'Impact damage increases with launch distance (+0.2% per 30px per rank)', maxLevel: 10, costs: [14, 18, 24, 30, 38, 48, 60, 74, 90, 108], branch: 'atk', icon: '[^]', requires: 'atk_risk_resonance' },

    // VITALITY branch
    vit_health: { id: 'vit_health', label: 'Vitality', desc: 'Increases Max HP (+15 HP per rank)', maxLevel: 10, costs: [6, 10, 14, 18, 22, 28, 34, 40, 48, 56], branch: 'vit', icon: '[HP]', requires: null },
    vit_overflow_shield: { id: 'vit_overflow_shield', label: 'Overflow Shielding', desc: 'Excess healing converts to Shield HP (+10% max HP cap per rank)', maxLevel: 10, costs: [8, 12, 16, 20, 26, 32, 40, 48, 58, 70], branch: 'vit', icon: '[SHD]', requires: 'vit_health' },
    vit_emergency_medkit: { id: 'vit_emergency_medkit', label: 'Emergency Medkit', desc: 'Restore HP when dropping below 25% HP (+5 HP per rank)', maxLevel: 10, costs: [10, 14, 18, 24, 30, 38, 46, 56, 68, 82], branch: 'vit', icon: '[MED]', requires: 'vit_overflow_shield' },
    vit_titan_core: { id: 'vit_titan_core', label: 'Titan Core', desc: 'Safe Zone nodes restore more HP (+5% per rank) & gain Max HP (+2 per rank)', maxLevel: 10, costs: [12, 16, 20, 26, 34, 42, 52, 64, 78, 94], branch: 'vit', icon: '[CORE]', requires: 'vit_emergency_medkit' },
    vit_vampiric_vitality: { id: 'vit_vampiric_vitality', label: 'Vampiric Vitality', desc: 'Absorbs damage dealt as healing (+2.5% per rank, affected by Risk)', maxLevel: 10, costs: [14, 18, 24, 30, 38, 48, 60, 74, 90, 108], branch: 'vit', icon: '[VAMP]', requires: 'vit_titan_core' },

    // DEFENSE branch
    def_aegis: { id: 'def_aegis', label: 'Aegis', desc: 'Increases Base DEF (+1.5 Base DEF per rank)', maxLevel: 10, costs: [6, 10, 14, 18, 22, 28, 34, 40, 48, 56], branch: 'def', icon: '[DEF]', requires: null },
    def_matrix_pct: { id: 'def_matrix_pct', label: 'Aegis Amplifier', desc: 'Increases Total DEF (+3% DEF per rank)', maxLevel: 10, costs: [8, 12, 16, 20, 26, 32, 40, 48, 58, 70], branch: 'def', icon: '[DEF%]', requires: 'def_aegis' },
    def_thorns_resist: { id: 'def_thorns_resist', label: 'Thorns Dampener', desc: 'Reduces enemy reflect/thorns damage taken (-5% per rank)', maxLevel: 10, costs: [10, 14, 18, 24, 30, 38, 46, 56, 68, 82], branch: 'def', icon: '[THN]', requires: 'def_matrix_pct' },
    def_forcefield: { id: 'def_forcefield', label: 'Forcefield Barrier', desc: 'Generates a Forcefield Bubble blocking 1 attack (cooldown -1 turn per rank)', maxLevel: 10, costs: [12, 16, 20, 26, 34, 42, 52, 64, 78, 94], branch: 'def', icon: '[FLD]', requires: 'def_thorns_resist' },
    def_fortified_matrix: { id: 'def_fortified_matrix', label: 'Fortified Matrix', desc: 'Taking heavy hits (>20 DMG) grants bonus DEF (+1 DEF per rank)', maxLevel: 10, costs: [14, 18, 24, 30, 38, 48, 60, 74, 90, 108], branch: 'def', icon: '[MTX]', requires: 'def_forcefield' },
    def_kinetic_dampener: { id: 'def_kinetic_dampener', label: 'Kinetic Dampener', desc: 'Takes reduced damage from collisions & wall bounces (-3% per rank)', maxLevel: 10, costs: [16, 20, 26, 34, 44, 56, 70, 86, 104, 124], branch: 'def', icon: '[KIN]', requires: 'def_fortified_matrix' },

    // TACTICS branch
    tac_war_chest: { id: 'tac_war_chest', label: 'War Chest', desc: 'Increases Starting Gold (+8 Gold per rank)', maxLevel: 10, costs: [6, 10, 14, 18, 22, 28, 34, 40, 48, 56], branch: 'tac', icon: '[GOLD]', requires: null },
    tac_merchant: { id: 'tac_merchant', label: 'Merchant Network', desc: 'Shop prices cost less (-2% per rank) & Rerolls cost less (-5% per rank)', maxLevel: 10, costs: [8, 12, 16, 20, 26, 32, 40, 48, 58, 70], branch: 'tac', icon: '[SHOP]', requires: 'tac_war_chest' },
    tac_logistics: { id: 'tac_logistics', label: 'Field Logistics', desc: 'Squad ability cooldowns reduced (-0.2 turns per rank)', maxLevel: 10, costs: [10, 14, 18, 24, 30, 38, 46, 56, 68, 82], branch: 'tac', icon: '[LOG]', requires: 'tac_merchant' },
    tac_intellect: { id: 'tac_intellect', label: 'Tactical Intellect', desc: 'Earn extra Tech Points from all sources (+3% per rank)', maxLevel: 10, costs: [12, 16, 20, 26, 34, 42, 52, 64, 78, 94], branch: 'tac', icon: '[TP]', requires: 'tac_logistics' },
    tac_relic_synergy: { id: 'tac_relic_synergy', label: 'Relic Synergy', desc: 'Grants +0.2% ATK, +0.2% Max HP, and +0.1 DEF per Collectible per rank', maxLevel: 10, costs: [14, 18, 24, 30, 38, 48, 60, 74, 90, 108], branch: 'tac', icon: '[SYN]', requires: 'tac_intellect' },
  },

  // --- Roguelike boons (collected as map rewards) ---
  boons: [
    { id: 'boon_atk', name: 'Overcharge', desc: '+20% ATK this run', color: '#e8a94c' },
    { id: 'boon_def', name: 'Hardened Shell', desc: '+4 DEF this run', color: '#7aa2ff' },
    { id: 'boon_hp', name: 'Colossus', desc: '+40 max HP this run', color: '#5fd3a8' },
    { id: 'boon_greed', name: 'Greed', desc: '+25% Gold from combat, but -5 max HP', color: '#ffd75e' },
    { id: 'boon_swift', name: 'Swift Loader', desc: '+15% launch velocity and +15% ATK boost', color: '#c792ea' },
    { id: 'boon_power', name: 'Overdrive', desc: '+15% launch max power', color: '#e0655c' },
    { id: 'boon_regen', name: 'Regeneration', desc: '+10 HP after every combat', color: '#8fe3c1' },
  ],

  // --- 40 Collectibles / Relics Roster ---
  relics: [
    // Tactical & Recovery
    { id: 'rel_echo', name: 'Echo Core', desc: 'First hit each combat deals +15 bonus damage', cost: 24, icon: '[!]', category: 'Tactical' },
    { id: 'rel_medic', name: 'Emergency Kit', desc: 'Restore 6 HP at the end of your turn', cost: 26, icon: '[+]', category: 'Tactical' },
    { id: 'rel_overcharge', name: 'Overcharge Cell', desc: 'Ability cooldowns reduced by 1 turn', cost: 30, icon: '[=]', category: 'Tactical' },
    { id: 'rel_magnet', name: 'Gold Magnet', desc: 'Gain +6 extra Gold after every combat victory', cost: 22, icon: '[U]', category: 'Tactical' },
    { id: 'rel_plating', name: 'Reactive Plating', desc: '+15% launch max power and +2 DEF', cost: 24, icon: '[#]', category: 'Tactical' },
    { id: 'rel_thorns', name: 'Thorns Sigil', desc: 'Reflect 25% of impact damage taken back to attackers', cost: 28, icon: '[x]', category: 'Tactical' },
    { id: 'rel_rhodes_banner', name: "Commander's Banner", desc: '+30 Max HP and +10% ATK', cost: 32, icon: '[>]', category: 'Tactical' },
    { id: 'rel_blood_sample', name: 'Singularity Dust', desc: 'Deal +25% damage when your HP is below 50%', cost: 28, icon: '(o)', category: 'Tactical' },
    { id: 'rel_adrenaline', name: 'Adrenaline Pump', desc: 'Launching at max power deals +20% damage', cost: 26, icon: '[i]', category: 'Tactical' },
    { id: 'rel_nanite', name: 'Nanite Injector', desc: 'Restore 20 HP upon entering any Combat node', cost: 25, icon: '(s)', category: 'Tactical' },

    // Trade & Economy
    { id: 'rel_lungmen_coin', name: "Merchant's Lucky Coin", desc: '+30% Gold earned from all sources', cost: 28, icon: '[$]', category: 'Economy' },
    { id: 'rel_blackmarket_pass', name: 'Black-Market Pass', desc: 'Collectible prices discounted by 20%', cost: 25, icon: '[=]', category: 'Economy' },
    { id: 'rel_pawn_ticket', name: 'Pawnshop Ticket', desc: 'Gain +25 Gold immediately upon obtaining', cost: 20, icon: '[~]', category: 'Economy' },
    { id: 'rel_golden_apple', name: 'Golden Apple', desc: 'Rest nodes heal to 100% max HP', cost: 30, icon: '(o)', category: 'Economy' },
    { id: 'rel_jade_pendant', name: 'Jade Pendant', desc: 'Gain +1 Tech Point whenever you defeat an Elite node', cost: 35, icon: '(o)', category: 'Economy' },

    // Gladiator Might & Critical Strikes
    { id: 'rel_knight_lance', name: "Paladin's Lance", desc: '+35% damage on your first shot of every combat', cost: 28, icon: '[/]', category: 'Gladiator' },
    { id: 'rel_pegasus_feather', name: 'Pegasus Feather', desc: 'Ball velocity dampening reduced by 40% (ball glides further)', cost: 26, icon: '[~]', category: 'Gladiator' },
    { id: 'rel_radiant_crest', name: 'Radiant Crest', desc: 'Wall bounces boost your next impact damage by +35%', cost: 30, icon: '[*]', category: 'Gladiator' },
    { id: 'rel_gladiator_glove', name: 'Gladiator Glove', desc: '+25% impact damage against high-HP enemies (>75% HP)', cost: 27, icon: '[x]', category: 'Gladiator' },
    { id: 'rel_silver_shield', name: 'Silver Knight Shield', desc: 'Start every combat with 1 pre-deployed Barrier', cost: 32, icon: '[#]', category: 'Gladiator' },

    // High-Tech & Energy
    { id: 'rel_calcifying_gel', name: 'Calcifying Gel', desc: '+5 DEF and -10% damage taken from all impacts', cost: 30, icon: '(o)', category: 'High-Tech' },
    { id: 'rel_energy_well', name: 'Energy Well', desc: 'Overdrive damage multiplier increased from 1.5x to 2.0x (+100% damage)', cost: 35, icon: '[!]', category: 'High-Tech' },
    { id: 'rel_cluster', name: 'Cluster Splitter', desc: 'First wall bounce splits your shot into a micro-bullet cluster', cost: 32, icon: '[::]', category: 'High-Tech' },
    { id: 'rel_graviton', name: 'Singularity Core', desc: 'Direct impacts create a gravity pull drawing nearby enemies in', cost: 34, icon: '(@)', category: 'High-Tech' },
    { id: 'rel_pyro', name: 'Thermal Engine', desc: 'Impacts ignite targets, dealing +5 burn damage over time', cost: 30, icon: '(^)', category: 'Frontier' },
    { id: 'rel_cryo', name: 'Cryo Coil', desc: 'Freezes target on hit, slowing enemy launch speed on next turn', cost: 30, icon: '[*]', category: 'High-Tech' },
    { id: 'rel_chain_lightning', name: 'Chain Reactor', desc: 'Defeating an enemy discharges chain lightning dealing 25 damage to all hostiles', cost: 35, icon: '[Z]', category: 'High-Tech' },
    { id: 'rel_time_warp', name: 'Flux Capacitor', desc: 'Overdrive ability cooldown reduced by 1 turn', cost: 30, icon: '[t]', category: 'High-Tech' },
    { id: 'rel_vector_engine', name: 'Vector Amplifier', desc: 'Launching at maximum power deals +30% bonus impact damage', cost: 32, icon: '[>]', category: 'High-Tech' },
    { id: 'rel_waraxe', name: 'Vanguard Waraxe', desc: '+3 Base ATK to squad', cost: 30, icon: '[x]', category: 'Frontier' },
    { id: 'rel_graviton_lens', name: 'Graviton Lens', desc: 'Barrier HP increased from 60 to 120', cost: 28, icon: '[o]', category: 'High-Tech' },
    { id: 'rel_drone_blueprint', name: 'Targeting Drone', desc: 'Enemy AI shot precision reduced (enemies miss more)', cost: 27, icon: '(^)', category: 'High-Tech' },
    { id: 'rel_cryo_fluid', name: 'Cryo Fluid', desc: 'Impacting an enemy reduces their launch speed on next turn by 25%', cost: 29, icon: '[*]', category: 'High-Tech' },

    // Frontier Force & Survival
    { id: 'rel_bear_claw', name: 'Grizzly Bear Claw', desc: '+35% ATK, but take +10% impact damage', cost: 32, icon: '[m]', category: 'Frontier' },
    { id: 'rel_iron_ration', name: 'Iron Ration', desc: '+50 Max HP and heal 50 HP immediately', cost: 34, icon: '[=]', category: 'Frontier' },
    { id: 'rel_heavy_armor', name: 'Heavy Plating', desc: '+8 DEF, but max launch power reduced by 5%', cost: 28, icon: '[#]', category: 'Frontier' },
    { id: 'rel_scavenger_pack', name: 'Scavenger Pack', desc: 'Encounter nodes yield +12 extra Gold', cost: 22, icon: '[=]', category: 'Frontier' },
    { id: 'rel_combat_drug', name: 'Berserk Injection', desc: 'Gain +50% ATK when player HP drops below 30%', cost: 30, icon: '(o)', category: 'Frontier' },

    // Sanctuary & Tactical Ordnance
    { id: 'rel_laterano_cross', name: 'Aegis Cross', desc: 'Shots deal +20% damage to secondary targets', cost: 36, icon: '[+]', category: 'Sanctuary' },
    { id: 'rel_tactical_edge', name: 'Tactical Edge', desc: '+2 Base ATK and +15 Max HP', cost: 28, icon: '[/]', category: 'Royal Guard' },
    { id: 'rel_smoke_bomb', name: 'Smoke Canister', desc: 'Enemies have a 25% chance to miss their shot entirely', cost: 30, icon: '[~]', category: 'Royal Guard' },
    { id: 'rel_victoria_crown', name: 'Royal Crest Seal', desc: '+20% ATK, +30 Max HP, +3 DEF', cost: 40, icon: '[^]', category: 'Royal Guard' },
    { id: 'rel_artillery_shell', name: 'High-Explosive Shell', desc: 'Direct impacts deal +10 splash damage', cost: 34, icon: '(o)', category: 'Royal Guard' },

    // Shadow Operatives & Ancient Relics
    { id: 'rel_syndicate_blade', name: 'Shadow Stiletto', desc: 'Instantly execute non-boss enemies hit under 15% HP', cost: 35, icon: '[/]', category: 'Shadow' },
    { id: 'rel_shadow_cloak', name: 'Shadow Cloak', desc: 'Take 50% reduced damage on the first turn of combat', cost: 28, icon: '[#]', category: 'Shadow' },
    { id: 'rel_horn_of_war', name: 'Horn of Valor', desc: 'Defeating an enemy restores 15 HP to squad', cost: 32, icon: '[>]', category: 'Relics' },

    // Defensive Citadel Relics (Flat DEF, DEF%, and Damage Reduction %)
    { id: 'rel_titan_plate', name: 'Titanium Plating', desc: '+8 Base DEF', cost: 28, icon: '[#]', category: 'Citadel' },
    { id: 'rel_bulwark_core', name: 'Bulwark Core', desc: '+12 Base DEF', cost: 34, icon: '[#]', category: 'Citadel' },
    { id: 'rel_bastion_shield', name: 'Bastion Aegis', desc: '+16 Base DEF', cost: 40, icon: '[#]', category: 'Citadel' },
    { id: 'rel_nanite_weave', name: 'Nanite Weave', desc: '+25% DEF bonus', cost: 30, icon: '[%]', category: 'Citadel' },
    { id: 'rel_harmonic_barrier', name: 'Harmonic Field', desc: '+40% DEF bonus', cost: 36, icon: '[%]', category: 'Citadel' },
    { id: 'rel_overcharged_plating', name: 'Overcharged Plating', desc: '+60% DEF bonus', cost: 44, icon: '[%]', category: 'Citadel' },
    { id: 'rel_goliath_carapace', name: 'Goliath Carapace', desc: '+10 Base DEF and +30% DEF bonus', cost: 42, icon: '[M]', category: 'Citadel' },
    { id: 'rel_fortress_seal', name: 'Fortress Seal', desc: '+15 Base DEF and +45% DEF bonus', cost: 48, icon: '[M]', category: 'Citadel' },
    { id: 'rel_apex_bulwark', name: 'Apex Bulwark', desc: '+20 Base DEF and +60% DEF bonus', cost: 55, icon: '[M]', category: 'Citadel' },
    { id: 'rel_kinetic_absorber', name: 'Kinetic Absorber', desc: 'Reduces all damage taken by 15%', cost: 32, icon: '[-]', category: 'Citadel' },
    { id: 'rel_stasis_field', name: 'Stasis Barrier', desc: 'Reduces all damage taken by 25%', cost: 42, icon: '[-]', category: 'Citadel' },
    { id: 'rel_spaghetti_plate', name: 'Family Feast', desc: 'Rest nodes grant +15 Max HP in addition to healing', cost: 26, icon: '(o)', category: 'Shadow' },
    { id: 'rel_originium_cube', name: 'Apex Catalyst', desc: '+50% ATK, +100 Max HP, +5 DEF, +100 Starting Gold', cost: 50, icon: '<*>', category: 'Tactical' },
  ],

  // --- Visuals: professional tactical palette ---
  colors: {
    skyTop: '#10151d',
    skyBottom: '#1d2634',
    ground: '#2a313d',
    groundDark: '#1e242e',
    player: '#7aa2ff',
    playerDark: '#3d5c8a',
    enemy: '#e0655c',
    enemyDark: '#7a302c',
    trajectory: 'rgba(122, 162, 255, 0.5)',
    hpBarBg: 'rgba(0, 0, 0, 0.5)',
    hpBarFg: '#7aa2ff',
    hpBarEnemyFg: '#e0655c',
    hpBarFgLow: '#e0655c',
    text: '#d6dde8',
    accent: '#e8a94c',
    dim: '#8a94a8',
  },
};