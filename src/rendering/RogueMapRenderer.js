// ============================================================
// RogueMapRenderer — draws the tactical run map:
// floor graph with node types, connections, lock states, and
// the player's current position.
// ============================================================

import { CONFIG } from '../config.js';

const M = CONFIG.map;
const C = CONFIG.colors;

// Node type → label + icon + color + subtitle
export const NODE_STYLE = {
  entry: { label: 'ENTRY POINT', tag: 'Start Sector', icon: 'S', color: '#7aa2ff' },
  combat: { label: 'COMBAT ZONE', tag: 'Normal Sector', icon: 'X', color: '#e0655c' },
  elite: { label: 'ELITE HOSTILE', tag: 'High Risk Area', icon: 'E', color: '#e8a94c' },
  miniboss: { label: 'MINI-BOSS', tag: 'Commander', icon: 'M', color: '#ff6b6b' },
  boss: { label: 'FINAL SECTOR', tag: 'Target Area', icon: 'B', color: '#e8a94c' },
  encounter: { label: 'UNKNOWN FOG', tag: 'Dense Fog', icon: '?', color: '#c792ea' },
  shop: { label: 'SUPPLY DEPOT', tag: 'Trading Post', icon: '$', color: '#5fd3a8' },
  rest: { label: 'SAFE ZONE', tag: 'Outpost', icon: '+', color: '#5fd3a8' },
  minigame: { label: 'DRILL ZONE', tag: 'Calibration', icon: '*', color: '#8fe3c1' },
};

export class RogueMapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.max(1, window.devicePixelRatio || 1);

    this.canvas.width = M.floorWidth * this.dpr;
    this.canvas.height = M.floorHeight * this.dpr;

    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.didDrag = false;
    this.lastFloor = null;
    this.lastOpts = null;

    this._initZoomAndPan();
  }

  _initZoomAndPan() {
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.88;
      this.setScale(this.scale * factor);
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.didDrag = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      if (Math.hypot(dx, dy) > 4) {
        this.didDrag = true;
      }
      this.offsetX += dx;
      this.offsetY += dy;
      this.dragStart = { x: e.clientX, y: e.clientY };
      if (this.lastFloor) {
        this.render(this.lastFloor, this.lastOpts);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  setScale(newScale) {
    this.scale = Math.max(0.65, Math.min(2.0, newScale));
    const label = document.getElementById('zoom-level');
    if (label) label.textContent = `${Math.round(this.scale * 100)}%`;
    if (this.lastFloor) {
      this.render(this.lastFloor, this.lastOpts);
    }
  }

  resetZoom() {
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.setScale(1.0);
  }

  /**
   * Screen pixel (x, y) → map space (x, y)
   */
  screenToMap(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = M.floorWidth / rect.width;
    const scaleY = M.floorHeight / rect.height;
    const canvasX = (screenX - rect.left) * scaleX;
    const canvasY = (screenY - rect.top) * scaleY;

    const cx = M.floorWidth / 2;
    const cy = M.floorHeight / 2;

    const mapX = (canvasX - cx - this.offsetX) / this.scale + cx;
    const mapY = (canvasY - cy - this.offsetY) / this.scale + cy;

    return { x: mapX, y: mapY };
  }

  /**
   * @param {Object} floor - floor data from RogueMap
   * @param {Object} opts { currentNodeId, canSelect: Set of selectable ids }
   */
  render(floor, opts = {}) {
    this.lastFloor = floor;
    this.lastOpts = opts;

    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    const targetW = Math.round(M.floorWidth * this.dpr);
    const targetH = Math.round(M.floorHeight * this.dpr);
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }

    const { ctx } = this;
    const { currentNodeId, canSelect = new Set() } = opts;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, M.floorWidth, M.floorHeight);

    const cx = M.floorWidth / 2;
    const cy = M.floorHeight / 2;
    ctx.translate(cx + this.offsetX, cy + this.offsetY);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-cx, -cy);

    this._drawBackground(ctx);
    this._drawEdges(ctx, floor, canSelect, currentNodeId);
    this._drawNodes(ctx, floor, currentNodeId, canSelect);

    ctx.restore();
  }

  _drawBackground(ctx) {
    const margin = 8000;
    const minX = -margin;
    const maxX = M.floorWidth + margin;
    const minY = -margin;
    const maxY = M.floorHeight + margin;

    // Solid dark tactical navy fill
    ctx.fillStyle = '#0e131f';
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  }

  _drawEdges(ctx, floor, canSelect, currentNodeId) {
    for (const e of floor.edges) {
      const a = floor.nodes.find((n) => n.id === e.from);
      const b = floor.nodes.find((n) => n.id === e.to);
      if (!a || !b) continue;

      const isSelectablePath =
        (a.id === currentNodeId && canSelect.has(b.id)) ||
        (b.id === currentNodeId && canSelect.has(a.id)) ||
        (a.cleared && b.cleared);

      ctx.save();
      ctx.strokeStyle = isSelectablePath ? '#ffffff' : 'rgba(122, 162, 255, 0.35)';
      ctx.lineWidth = isSelectablePath ? 4.0 : 2.5;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawNodes(ctx, floor, currentNodeId, canSelect) {
    for (const node of floor.nodes) {
      this._drawNode(ctx, node, currentNodeId, canSelect);
    }
  }

  _drawNode(ctx, node, currentNodeId, canSelect) {
    const style = NODE_STYLE[node.type] || NODE_STYLE.combat;
    const isCurrent = node.id === currentNodeId;
    const selectable = canSelect.has(node.id);

    const cardW = 138;
    const cardH = 80;
    const x = node.x - cardW / 2;
    const y = node.y - cardH / 2;

    ctx.save();

    if (node.locked && !isCurrent && !selectable) {
      ctx.globalAlpha = 0.5;
    }

    // Main Card Background
    ctx.fillStyle = isCurrent ? '#192334' : 'rgba(14, 18, 26, 0.96)';
    ctx.fillRect(x, y, cardW, cardH);

    // Border styling & glow
    let borderColor = 'rgba(255, 255, 255, 0.35)';
    if (isCurrent) {
      borderColor = '#7aa2ff';
      ctx.shadowColor = '#7aa2ff';
      ctx.shadowBlur = 14;
    } else if (selectable) {
      borderColor = C.accent;
      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 12;
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isCurrent || selectable ? 2.8 : 1.5;
    ctx.strokeRect(x, y, cardW, cardH);
    ctx.shadowBlur = 0; // reset shadow

    // 1. TOP TITLE BANNER (Crisp high-contrast font)
    ctx.fillStyle = isCurrent || selectable ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(style.label, node.x, y + 7);

    // 2. DIAMOND EMBLEM CONTAINER (Center)
    const diamSize = 22;
    const iconY = node.y + 4;

    ctx.save();
    ctx.translate(node.x, iconY);
    ctx.rotate(Math.PI / 4);

    ctx.fillStyle = node.cleared ? 'rgba(95, 211, 168, 0.25)' : 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(-diamSize / 2, -diamSize / 2, diamSize, diamSize);
    ctx.strokeStyle = node.cleared ? '#5fd3a8' : style.color;
    ctx.lineWidth = 2.0;
    ctx.strokeRect(-diamSize / 2, -diamSize / 2, diamSize, diamSize);
    ctx.restore();

    // Node Type Icon inside Diamond
    ctx.fillStyle = node.cleared ? '#5fd3a8' : style.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.cleared ? '✓' : style.icon, node.x, iconY);

    // 3. BLACK BOTTOM TAG BAR (Solid background, sharp typography)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 1, y + cardH - 22, cardW - 2, 21);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(style.tag, node.x, y + cardH - 11);

    ctx.restore();
  }
}