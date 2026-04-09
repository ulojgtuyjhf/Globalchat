// ═══════════════════════════════════════════
//   TANK1.JS  —  Tank One character config
//   Edit this file to change the tank image,
//   skins, or drawing behaviour.
// ═══════════════════════════════════════════

// ── Tank image (Tank One) ──
var TANK1_IMG = new Image();
TANK1_IMG.src = 'https://i.ibb.co/145VXtQ/tank-isolated-on-background-3d-rendering-illustration-png.png';
var _tank1Loaded = false;
TANK1_IMG.onload = function () { _tank1Loaded = true; };

// ── Tank skins (tint overlays applied on top of TANK1_IMG) ──
var TANK_SKINS = [
  { id: 'classic',  label: 'Classic',   tint: null,      price: 0  },
  { id: 'army',     label: 'Army',      tint: '#4a7c4e', price: 0  },
  { id: 'stealth',  label: 'Stealth',   tint: '#1e2030', price: 0  },
  { id: 'desert',   label: 'Desert',    tint: '#c8a04a', price: 5  },
  { id: 'neon',     label: 'Neon',      tint: '#a855f7', price: 5  },
  { id: 'fire',     label: 'Inferno',   tint: '#f97316', price: 10 },
  { id: 'ice',      label: 'Blizzard',  tint: '#38bdf8', price: 10 },
  { id: 'gold',     label: 'Gold',      tint: '#d97706', price: 20 },
];

// ── Draw a tinted preview onto a canvas (used in UI grids) ──
function drawTank1Preview(canvas, skin) {
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!_tank1Loaded) {
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 14, 0, Math.PI * 2); ctx.fill();
    return;
  }
  ctx.save();
  ctx.drawImage(TANK1_IMG, 0, 0, W, H);
  if (skin && skin.tint) {
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = skin.tint + 'cc';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(TANK1_IMG, 0, 0, W, H);
  }
  ctx.restore();
}

// ── Draw Tank1 at world position (x, y) facing angle, with tint ──
// Called each frame from the game engine.
// angle   = body/movement direction (radians)
// tintHex = hex string or null for original colours
// name    = player display name
// hp      = 0–100
// isMe    = boolean (draws a selection ring)
function drawTank1(ctx, x, y, angle, turretAngle, tintHex, name, hp, isMe) {
  var W = 64, H = 64; // display size on canvas

  ctx.save();
  ctx.translate(x, y);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(4, 10, W * 0.48, H * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rotate to movement angle then draw image
  ctx.rotate(angle);

  if (_tank1Loaded) {
    if (tintHex) {
      // Draw base image
      ctx.drawImage(TANK1_IMG, -W / 2, -H / 2, W, H);
      // Tint overlay
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = tintHex + 'b0';
      // Clip to image silhouette — draw image as mask
      ctx.globalCompositeOperation = 'color';
      ctx.fillRect(-W / 2, -H / 2, W, H);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(TANK1_IMG, -W / 2, -H / 2, W, H);
      ctx.globalCompositeOperation = 'source-over';
      // Re-draw image on top so details show through
      ctx.globalAlpha = 0.55;
      ctx.drawImage(TANK1_IMG, -W / 2, -H / 2, W, H);
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(TANK1_IMG, -W / 2, -H / 2, W, H);
    }
  } else {
    // Fallback rectangle while image loads
    ctx.fillStyle = tintHex || '#e63946';
    ctx.fillRect(-W / 2, -H / 2, W, H);
  }

  ctx.restore(); // undo rotation + translation

  // ── Selection ring for the local player ──
  if (isMe) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(0, 0, W * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Name plate + HP bar (always upright) ──
  ctx.save();
  ctx.translate(x, y);
  var barW = 56, barH = 5;
  var bx = -barW / 2, by = -(H / 2) - 22;
  ctx.fillStyle = 'rgba(0,0,0,0.70)';
  _roundRect(ctx, bx - 2, by - 15, barW + 4, 16, 3); ctx.fill();
  ctx.font = "bold 10px 'Rajdhani',sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = isMe ? '#ffffff' : 'rgba(255,255,255,.80)';
  ctx.fillText((name || 'Tank').slice(0, 14), 0, by - 3);
  // HP bar background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx, by + 3, barW, barH);
  // HP bar fill
  var hpPct = Math.max(0, (hp || 0) / 100);
  ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(bx, by + 3, barW * hpPct, barH);
  ctx.restore();
}

// Helper: rounded rect path
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
