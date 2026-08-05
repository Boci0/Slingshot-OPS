// ============================================================
// ScreenManager — Manages application states and screen view transitions.
// Decouples state machine routing from core main logic.
// ============================================================

export const State = {
  MENU: 'MENU',
  TECH: 'TECH',
  RUN_MAP: 'RUN_MAP',
  BATTLE: 'BATTLE',
  RESULT: 'RESULT',
};

export class ScreenManager {
  constructor(uiManager) {
    this.ui = uiManager;
    this.currentState = State.MENU;
  }

  setState(newState, stateData = {}) {
    this.currentState = newState;

    switch (newState) {
      case State.MENU:
        this.ui.showMenu(stateData.profile, stateData.meta);
        break;

      case State.TECH:
        this.ui.showTech(stateData.techTree, stateData.saveSystem);
        break;

      case State.RUN_MAP:
        this.ui.showRunScreen(stateData.run, stateData.map, stateData.floor);
        break;

      case State.BATTLE:
        this.ui.showBattleHud(stateData.run, stateData.nodeType);
        break;

      case State.RESULT:
        this.ui.showResult(stateData.won, stateData.run, stateData.completedQuests, stateData.earnedTp);
        break;

      default:
        break;
    }
  }

  isState(state) {
    return this.currentState === state;
  }
}
