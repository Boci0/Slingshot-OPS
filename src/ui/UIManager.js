// ============================================================
// UIManager — DOM-based interface layer.
// Owns the main menu, tech tree view, run map screen, node
// modals (encounter/shop/rest/combat), battle HUD, save export/import,
// and results screen.
// ============================================================

import { CONFIG } from '../config.js';
import { NODE_STYLE } from '../rendering/RogueMapRenderer.js';
import { saveSystem } from '../meta/SaveSystem.js';
import { soundEngine } from '../utils/SoundEngine.js';

const C = CONFIG.colors;

export class UIManager {
  /**
   * @param {Object} callbacks - action handlers owned by the App
   */
  constructor(callbacks) {
    this.cb = callbacks;
    this.screens = {
      menu: document.getElementById('screen-menu'),
      tech: document.getElementById('screen-tech'),
      run: document.getElementById('screen-run'),
      battleHud: document.getElementById('battle-hud'),
      result: document.getElementById('screen-result'),
    };
    this.nodeModal = document.getElementById('node-modal');
    this.modalTitle = document.getElementById('node-modal-title');
    this.modalBody = document.getElementById('node-modal-body');
    this.modalActions = document.getElementById('node-modal-actions');

    this.bindGlobalEvents();
  }

  bindGlobalEvents() {
    // Menu buttons
    const btnPlay = document.getElementById('btn-play');
    const btnTech = document.getElementById('btn-tech');
    if (btnPlay) btnPlay.addEventListener('click', () => this.cb.onPlay());
    if (btnTech) btnTech.addEventListener('click', () => this.cb.onOpenTech());

    // Save Export & Import buttons
    const btnExportSave = document.getElementById('btn-export-save');
    const btnImportSave = document.getElementById('btn-import-save');
    const btnResetData = document.getElementById('btn-reset-data');

    if (btnExportSave) {
      btnExportSave.addEventListener('click', () => {
        soundEngine.playUI();
        const json = saveSystem.exportSaveData();
        navigator.clipboard?.writeText(json).then(() => {
          alert('Save data copied to clipboard!');
        }).catch(() => {
          prompt('Copy save JSON manually:', json);
        });
      });
    }

    if (btnImportSave) {
      btnImportSave.addEventListener('click', () => {
        soundEngine.playUI();
        const input = prompt('Paste your save data JSON string:');
        if (input) {
          if (saveSystem.importSaveData(input)) {
            alert('Save data successfully imported!');
            location.reload();
          } else {
            alert('Invalid save data JSON!');
          }
        }
      });
    }

    if (btnResetData) {
      btnResetData.addEventListener('click', () => {
        soundEngine.playUI();
        if (confirm('Are you sure you want to reset ALL save data and tech tree progress?')) {
          saveSystem.reset();
          location.reload();
        }
      });
    }

    // Audio Mute Toggle button
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    if (btnAudioToggle) {
      btnAudioToggle.addEventListener('click', () => {
        const muted = soundEngine.toggleMute();
        btnAudioToggle.textContent = muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
      });
    }

    // Tech screen
    const btnTechBack = document.getElementById('btn-tech-back');
    if (btnTechBack) btnTechBack.addEventListener('click', () => this.cb.onBackToMenu());

    // Run map screen
    const btnRetreat = document.getElementById('btn-retreat');
    if (btnRetreat) {
      btnRetreat.addEventListener('click', () => {
        soundEngine.playUI();
        if (confirm('Abandon current operation? All run progress will be lost.')) {
          this.closeModal();
          this.cb.onRetreat();
        }
      });
    }

    // Result screen
    const btnRunEnd = document.getElementById('btn-run-end');
    if (btnRunEnd) btnRunEnd.addEventListener('click', () => this.cb.onRunEndConfirm());
  }

  // ---------- Generic screen switching ----------

  showMenu(profile, meta) {
    this._setVisible('menu');
    const el = document.getElementById('menu-stats');
    if (el) {
      el.innerHTML = `
        <div class="menu-stat"><span>Runs</span><strong>${meta.totalRuns}</strong></div>
        <div class="menu-stat"><span>Wins</span><strong>${meta.totalWins}</strong></div>
        <div class="menu-stat"><span>Tech Pts</span><strong class="accent">${this._tp()}</strong></div>
      `;
    }
  }

  showTech(techTree, saveSystem) {
    this._setVisible('tech');
    document.getElementById('tech-points').textContent = this._tp();
    const container = document.getElementById('tech-tree');
    container.innerHTML = '';

    const branches = [
      { key: 'atk', title: 'ATTACK', color: '#e0655c' },
      { key: 'vit', title: 'VITALITY', color: '#5fd3a8' },
      { key: 'def', title: 'DEFENSE', color: '#7aa2ff' },
      { key: 'tac', title: 'TACTICS', color: '#c792ea' },
    ];

    for (const branch of branches) {
      const col = document.createElement('div');
      col.className = 'tech-column';
      col.innerHTML = `<h3 style="color:${branch.color}">${branch.title}</h3>`;

      const nodes = techTree
        .getAllNodes()
        .filter((n) => n.branch === branch.key);

      for (const node of nodes) {
        const card = document.createElement('div');
        const purchased = saveSystem.hasTechNode(node.id);
        card.className = `tech-card ${purchased ? 'purchased' : ''}`;
        card.innerHTML = `
          <div class="tech-name">${node.name}</div>
          <div class="tech-desc">${node.desc}</div>
          <div class="tech-cost">${purchased ? 'PURCHASED' : `${node.cost} TP`}</div>
        `;
        if (!purchased) {
          card.addEventListener('click', () => {
            soundEngine.playUI();
            this.cb.onBuyTech(node.id);
          });
        }
        col.appendChild(card);
      }
      container.appendChild(col);
    }
  }

  showRunMap() {
    this._setVisible('run');
    this.screens.battleHud.classList.add('hidden');
    document.getElementById('battle-view').classList.add('hidden');
    document.getElementById('map-view').classList.remove('hidden');
  }

  showBattleView() {
    this.screens.battleHud.classList.remove('hidden');
    document.getElementById('map-view').classList.add('hidden');
    document.getElementById('battle-view').classList.remove('hidden');
  }

  showResult(won, summary, questsCompleted = []) {
    this._setVisible('result');
    this.screens.battleHud.classList.add('hidden');

    const titleEl = document.getElementById('result-title');
    const subEl = document.getElementById('result-sub');
    const tpEl = document.getElementById('result-tp');

    if (won) {
      titleEl.textContent = 'OPERATION SUCCESSFUL';
      titleEl.style.color = '#5fd3a8';
      subEl.textContent = `Completed 5 Floor Operation • ${summary.kills || 0} Hostiles Eliminated`;
    } else {
      titleEl.textContent = 'OPERATION FAILED';
      titleEl.style.color = '#e0655c';
      subEl.textContent = `Squad wiped on Floor ${summary.floor || 1} • ${summary.kills || 0} Hostiles Eliminated`;
    }

    const tpEarned = (summary.floorsCleared || 1) * 3 + (won ? 15 : 0);
    tpEl.innerHTML = `GAINED <strong class="accent">+${tpEarned} TECH POINTS</strong>`;
  }

  // ---------- HUD updates ----------

  updateRunSidebar(run) {
    if (!run) return;
    document.getElementById('run-hp').textContent = `${Math.ceil(run.hp)}/${run.maxHp}`;
    document.getElementById('run-actions').textContent = run.floorActions;
    document.getElementById('run-gold').textContent = `${run.gold}G`;
    document.getElementById('run-atk').textContent = `${(run.atk * 100).toFixed(0)}%`;
    document.getElementById('run-def').textContent = run.def;
    document.getElementById('run-floor').textContent = `${run.floor}/${CONFIG.map.floors}`;

    // Render floor tabs
    const tabsContainer = document.getElementById('run-floortabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      for (let f = 1; f <= CONFIG.map.floors; f++) {
        const tab = document.createElement('button');
        const isCurrent = f === run.floor;
        tab.className = `floor-tab ${isCurrent ? 'active' : ''}`;
        tab.textContent = `FL ${f}`;
        tabsContainer.appendChild(tab);
      }
    }

    // Render Relics
    const relicsContainer = document.getElementById('run-relics');
    if (relicsContainer) {
      relicsContainer.innerHTML = '';
      if (!run.relics.length) {
        relicsContainer.innerHTML = '<span class="dim-text">No collectibles acquired</span>';
      } else {
        for (const relId of run.relics) {
          const def = CONFIG.relics.find((r) => r.id === relId);
          if (!def) continue;
          const chip = document.createElement('div');
          chip.className = 'relic-chip';
          chip.title = `${def.name}: ${def.desc}`;
          chip.innerHTML = `<span>${def.icon}</span> <strong>${def.name}</strong>`;
          relicsContainer.appendChild(chip);
        }
      }
    }

    // Render Quests
    const questsContainer = document.getElementById('run-quests');
    if (questsContainer && run.questSystem) {
      questsContainer.innerHTML = '';
      const active = run.questSystem.getActiveQuests();
      for (const q of active) {
        const div = document.createElement('div');
        div.className = `quest-item ${q.completed ? 'completed' : ''}`;
        div.innerHTML = `
          <div class="quest-title">${q.title}</div>
          <div class="quest-desc">${q.desc}</div>
          <div class="quest-progress">${q.progress}/${q.target}</div>
        `;
        questsContainer.appendChild(div);
      }
    }
  }

  updateBattleHud(nodeType, floor, gold, abilities) {
    document.getElementById('battle-node').textContent = nodeType.toUpperCase();
    document.getElementById('battle-floor').textContent = `FLOOR ${floor}`;
    document.getElementById('battle-gold').textContent = `${gold}G`;

    if (abilities) {
      const ov = abilities.overdrive;
      const ba = abilities.barrier;

      const btnOv = document.getElementById('btn-overdrive');
      const cdOv = document.getElementById('cd-overdrive');
      if (btnOv && cdOv) {
        btnOv.disabled = !ov.ready;
        cdOv.textContent = ov.ready ? 'READY' : `${ov.cooldownLeft}T`;
      }

      const btnBa = document.getElementById('btn-barrier');
      const cdBa = document.getElementById('cd-barrier');
      if (btnBa && cdBa) {
        btnBa.disabled = !ba.ready;
        cdBa.textContent = ba.ready ? 'READY' : `${ba.cooldownLeft}T`;
      }
    }
  }

  // ---------- Modals ----------

  showNodeModal(title, bodyHtml, actionsArray) {
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = bodyHtml;
    this.modalActions.innerHTML = '';

    for (const act of actionsArray) {
      const btn = document.createElement('button');
      btn.className = `btn ${act.btnClass || 'btn-primary'}`;
      btn.textContent = act.label;
      btn.addEventListener('click', () => {
        soundEngine.playUI();
        act.onClick();
      });
      this.modalActions.appendChild(btn);
    }

    this.nodeModal.classList.remove('hidden');
  }

  closeModal() {
    this.nodeModal.classList.add('hidden');
  }

  // ---------- Internal Helpers ----------

  _setVisible(screenKey) {
    for (const k in this.screens) {
      if (this.screens[k]) {
        this.screens[k].classList.toggle('hidden', k !== screenKey);
      }
    }
  }

  _tp() {
    return saveSystem.data.techPoints;
  }
}