// ═══════════════════════════════════════════
//   MAP.JS  —  Game world / map definition
//   Edit this file to change the map layout,
//   add/remove features, water, rocks, trees.
// ═══════════════════════════════════════════

var MAP_W = 4800;
var MAP_H = 3600;

// ── Watering holes — passable (visual + slow player) ──
var WATER_HOLES = [
  { cx: 860,  cy: 620,  rx: 140, ry: 100 },
  { cx: 2460, cy: 530,  rx: 120, ry: 85  },
  { cx: 1640, cy: 1230, rx: 160, ry: 115 },
  { cx: 620,  cy: 1840, rx: 130, ry: 95  },
  { cx: 2860, cy: 1760, rx: 150, ry: 110 },
  { cx: 1280, cy: 2180, rx: 115, ry: 84  },
  { cx: 3800, cy: 800,  rx: 130, ry: 95  },
  { cx: 4200, cy: 2200, rx: 140, ry: 100 },
  { cx: 3100, cy: 3000, rx: 125, ry: 90  },
  { cx: 900,  cy: 3100, rx: 135, ry: 95  },
  { cx: 2100, cy: 3300, rx: 120, ry: 88  },
  { cx: 4500, cy: 1500, rx: 110, ry: 80  },
];

// ── Rocky outcrops — impassable ──
var ROCK_CLUSTERS = [
  { cx: 450,  cy: 320,  rx: 100, ry: 75 },
  { cx: 1700, cy: 420,  rx: 120, ry: 90 },
  { cx: 3200, cy: 350,  rx: 100, ry: 78 },
  { cx: 350,  cy: 1500, rx: 110, ry: 82 },
  { cx: 1100, cy: 1700, rx: 105, ry: 78 },
  { cx: 2500, cy: 1600, rx: 115, ry: 88 },
  { cx: 3500, cy: 1100, rx: 100, ry: 78 },
  { cx: 600,  cy: 2400, rx: 90,  ry: 68 },
  { cx: 3000, cy: 2450, rx: 110, ry: 82 },
  { cx: 2000, cy: 800,  rx: 88,  ry: 64 },
  { cx: 4400, cy: 600,  rx: 95,  ry: 70 },
  { cx: 4100, cy: 2900, rx: 100, ry: 75 },
  { cx: 1500, cy: 3200, rx: 105, ry: 78 },
  { cx: 3600, cy: 3300, rx: 95,  ry: 72 },
  { cx: 2700, cy: 3100, rx: 88,  ry: 65 },
  { cx: 4600, cy: 3200, rx: 90,  ry: 68 },
];

// ── Map features: walls, roads, trees ──
var MAP_FEATURES = [
  // Outer boundary walls
  { type: 'wall', x: 0,         y: 0,         w: MAP_W, h: 24,   color: '#5c4a2a' },
  { type: 'wall', x: 0,         y: MAP_H - 24, w: MAP_W, h: 24,  color: '#5c4a2a' },
  { type: 'wall', x: 0,         y: 0,         w: 24,   h: MAP_H, color: '#5c4a2a' },
  { type: 'wall', x: MAP_W - 24, y: 0,        w: 24,   h: MAP_H, color: '#5c4a2a' },

  // Interior mud-brick compound walls
  { type: 'wall', x: 500,  y: 900,  w: 200, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 500,  y: 1100, w: 200, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 500,  y: 900,  w: 20,  h: 220, color: '#8b6535' },
  { type: 'wall', x: 680,  y: 900,  w: 20,  h: 220, color: '#8b6535' },
  { type: 'wall', x: 1800, y: 600,  w: 220, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 1800, y: 820,  w: 220, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 1800, y: 600,  w: 20,  h: 240, color: '#8b6535' },
  { type: 'wall', x: 2000, y: 600,  w: 20,  h: 240, color: '#8b6535' },
  { type: 'wall', x: 3200, y: 1400, w: 240, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 3200, y: 1650, w: 240, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 3200, y: 1400, w: 20,  h: 270, color: '#8b6535' },
  { type: 'wall', x: 3420, y: 1400, w: 20,  h: 270, color: '#8b6535' },
  { type: 'wall', x: 4000, y: 2500, w: 200, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 4000, y: 2700, w: 200, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 4000, y: 2500, w: 20,  h: 220, color: '#8b6535' },
  { type: 'wall', x: 4180, y: 2500, w: 20,  h: 220, color: '#8b6535' },
  { type: 'wall', x: 1100, y: 2600, w: 220, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 1100, y: 2820, w: 220, h: 20,  color: '#8b6535' },
  { type: 'wall', x: 1100, y: 2600, w: 20,  h: 240, color: '#8b6535' },
  { type: 'wall', x: 1300, y: 2600, w: 20,  h: 240, color: '#8b6535' },

  // Acacia trees — top zone
  { type: 'acacia', x: 300,  y: 250, r: 44 }, { type: 'acacia', x: 750,  y: 180, r: 38 },
  { type: 'acacia', x: 1250, y: 320, r: 46 }, { type: 'acacia', x: 1800, y: 220, r: 40 },
  { type: 'acacia', x: 2300, y: 300, r: 44 }, { type: 'acacia', x: 2900, y: 200, r: 38 },
  { type: 'acacia', x: 3500, y: 280, r: 42 }, { type: 'acacia', x: 4100, y: 200, r: 36 },
  { type: 'acacia', x: 4550, y: 300, r: 40 },
  // Acacia — second row
  { type: 'acacia', x: 500,  y: 700, r: 46 }, { type: 'acacia', x: 1050, y: 750, r: 40 },
  { type: 'acacia', x: 1550, y: 680, r: 44 }, { type: 'acacia', x: 2100, y: 740, r: 38 },
  { type: 'acacia', x: 2650, y: 700, r: 46 }, { type: 'acacia', x: 3150, y: 760, r: 40 },
  { type: 'acacia', x: 3700, y: 720, r: 44 }, { type: 'acacia', x: 4300, y: 700, r: 38 },
  // Acacia — mid rows
  { type: 'acacia', x: 350,  y: 1300, r: 42 }, { type: 'acacia', x: 900,  y: 1250, r: 46 },
  { type: 'acacia', x: 1400, y: 1350, r: 40 }, { type: 'acacia', x: 2000, y: 1300, r: 44 },
  { type: 'acacia', x: 2600, y: 1350, r: 38 }, { type: 'acacia', x: 3100, y: 1280, r: 46 },
  { type: 'acacia', x: 3700, y: 1320, r: 40 }, { type: 'acacia', x: 4400, y: 1300, r: 44 },
  { type: 'acacia', x: 400,  y: 1900, r: 40 }, { type: 'acacia', x: 950,  y: 1950, r: 46 },
  { type: 'acacia', x: 1500, y: 1880, r: 38 }, { type: 'acacia', x: 2200, y: 1950, r: 44 },
  { type: 'acacia', x: 2700, y: 1900, r: 40 }, { type: 'acacia', x: 3300, y: 1960, r: 46 },
  { type: 'acacia', x: 3900, y: 1920, r: 38 }, { type: 'acacia', x: 4450, y: 1900, r: 42 },
  // Acacia — lower zone
  { type: 'acacia', x: 300,  y: 2500, r: 44 }, { type: 'acacia', x: 850,  y: 2450, r: 40 },
  { type: 'acacia', x: 1700, y: 2500, r: 46 }, { type: 'acacia', x: 2350, y: 2450, r: 38 },
  { type: 'acacia', x: 2900, y: 2550, r: 44 }, { type: 'acacia', x: 3500, y: 2480, r: 40 },
  { type: 'acacia', x: 4150, y: 2500, r: 46 }, { type: 'acacia', x: 4600, y: 2450, r: 38 },
  { type: 'acacia', x: 450,  y: 3100, r: 42 }, { type: 'acacia', x: 1050, y: 3200, r: 46 },
  { type: 'acacia', x: 1650, y: 3100, r: 40 }, { type: 'acacia', x: 2300, y: 3200, r: 44 },
  { type: 'acacia', x: 3000, y: 3150, r: 38 }, { type: 'acacia', x: 3600, y: 3200, r: 46 },
  { type: 'acacia', x: 4200, y: 3100, r: 40 }, { type: 'acacia', x: 4650, y: 3200, r: 38 },
  // Scattered lone acacias
  { type: 'acacia', x: 630,  y: 450,  r: 28 }, { type: 'acacia', x: 1150, y: 520,  r: 26 },
  { type: 'acacia', x: 1900, y: 500,  r: 30 }, { type: 'acacia', x: 2550, y: 550,  r: 27 },
  { type: 'acacia', x: 3300, y: 500,  r: 28 }, { type: 'acacia', x: 4000, y: 470,  r: 26 },
  { type: 'acacia', x: 700,  y: 1100, r: 26 }, { type: 'acacia', x: 1350, y: 1050, r: 28 },
  { type: 'acacia', x: 2150, y: 1080, r: 25 }, { type: 'acacia', x: 2900, y: 1050, r: 27 },
  { type: 'acacia', x: 3650, y: 1100, r: 28 }, { type: 'acacia', x: 4350, y: 1050, r: 26 },
  { type: 'acacia', x: 550,  y: 1650, r: 28 }, { type: 'acacia', x: 1250, y: 1600, r: 26 },
  { type: 'acacia', x: 2050, y: 1650, r: 30 }, { type: 'acacia', x: 2800, y: 1620, r: 27 },
  { type: 'acacia', x: 3550, y: 1660, r: 28 }, { type: 'acacia', x: 4250, y: 1600, r: 25 },
  { type: 'acacia', x: 700,  y: 2200, r: 26 }, { type: 'acacia', x: 1500, y: 2250, r: 28 },
  { type: 'acacia', x: 2250, y: 2200, r: 27 }, { type: 'acacia', x: 3050, y: 2250, r: 30 },
  { type: 'acacia', x: 3850, y: 2200, r: 26 }, { type: 'acacia', x: 4500, y: 2250, r: 28 },

  // Baobab trees
  { type: 'baobab', x: 1600, y: 1100, r: 55 }, { type: 'baobab', x: 3400, y: 900,  r: 50 },
  { type: 'baobab', x: 700,  y: 2700, r: 52 }, { type: 'baobab', x: 4000, y: 1700, r: 48 },
  { type: 'baobab', x: 2200, y: 2800, r: 55 }, { type: 'baobab', x: 1200, y: 500,  r: 46 },
  { type: 'baobab', x: 3800, y: 3000, r: 50 }, { type: 'baobab', x: 2600, y: 400,  r: 48 },

  // Palm trees near water
  { type: 'palm', x: 860,  y: 615,  r: 30 }, { type: 'palm', x: 770,  y: 650,  r: 26 },
  { type: 'palm', x: 920,  y: 575,  r: 28 }, { type: 'palm', x: 2440, y: 510,  r: 28 },
  { type: 'palm', x: 2510, y: 560,  r: 26 }, { type: 'palm', x: 2370, y: 540,  r: 30 },
  { type: 'palm', x: 1620, y: 1235, r: 30 }, { type: 'palm', x: 1690, y: 1200, r: 26 },
  { type: 'palm', x: 1560, y: 1260, r: 28 }, { type: 'palm', x: 620,  y: 1840, r: 28 },
  { type: 'palm', x: 680,  y: 1870, r: 26 }, { type: 'palm', x: 560,  y: 1810, r: 30 },
  { type: 'palm', x: 2840, y: 1745, r: 30 }, { type: 'palm', x: 2900, y: 1780, r: 26 },
  { type: 'palm', x: 2780, y: 1720, r: 28 }, { type: 'palm', x: 1260, y: 2170, r: 28 },
  { type: 'palm', x: 1330, y: 2200, r: 26 }, { type: 'palm', x: 1200, y: 2150, r: 30 },
  { type: 'palm', x: 3860, y: 2850, r: 28 }, { type: 'palm', x: 3920, y: 2880, r: 26 },
  { type: 'palm', x: 3800, y: 2830, r: 30 },

  // Dirt animal trails
  { type: 'road', x: 0,             y: MAP_H / 2 - 14,    w: MAP_W,           h: 28, color: '#9a7840' },
  { type: 'road', x: MAP_W / 2 - 14, y: 0,                w: 28,              h: MAP_H, color: '#9a7840' },
  { type: 'road', x: 0,             y: MAP_H / 4 - 10,   w: MAP_W * 0.55,    h: 20, color: '#9a7840' },
  { type: 'road', x: MAP_W * 0.45,  y: MAP_H * 0.75 - 10, w: MAP_W * 0.55,   h: 20, color: '#9a7840' },
  { type: 'road', x: MAP_W * 0.25,  y: 0,                w: 20,              h: MAP_H * 0.4, color: '#9a7840' },
  { type: 'road', x: MAP_W * 0.75,  y: MAP_H * 0.6,      w: 20,              h: MAP_H * 0.4, color: '#9a7840' },
  { type: 'road', x: 0,             y: MAP_H * 0.85 - 10, w: MAP_W * 0.4,    h: 18, color: '#9a7840' },
  { type: 'road', x: MAP_W * 0.6,   y: MAP_H * 0.2 - 10, w: MAP_W * 0.4,    h: 18, color: '#9a7840' },
];

// ── Collision helpers ──
function mapPtInWater(px, py) {
  for (var i = 0; i < WATER_HOLES.length; i++) {
    var h = WATER_HOLES[i];
    var dx = (px - h.cx) / h.rx, dy = (py - h.cy) / h.ry;
    if (dx * dx + dy * dy < 1) return true;
  }
  return false;
}

function mapPtInRock(px, py, margin) {
  margin = margin || 0;
  for (var i = 0; i < ROCK_CLUSTERS.length; i++) {
    var r = ROCK_CLUSTERS[i];
    var dx = (px - r.cx) / (r.rx + margin), dy = (py - r.cy) / (r.ry + margin);
    if (dx * dx + dy * dy < 1) return true;
  }
  return false;
}

function mapCollides(x, y, r) {
  if (x < 20 || x > MAP_W - 20 || y < 20 || y > MAP_H - 20) return true;
  if (mapPtInRock(x, y, r)) return true;
  for (var i = 0; i < MAP_FEATURES.length; i++) {
    var f = MAP_FEATURES[i];
    if (f.type === 'wall') {
      if (x - r < f.x + f.w && x + r > f.x && y - r < f.y + f.h && y + r > f.y) return true;
    } else if (f.type === 'acacia' || f.type === 'baobab' || f.type === 'palm') {
      var dx = x - f.x, dy = y - f.y;
      var minD = (r + f.r * 0.55);
      if (dx * dx + dy * dy < minD * minD) return true;
    }
  }
  return false;
}

// ── drawMap(ctx, savannahAnim, animEnabled) ──
// Pass the current animation counter and whether animations are on.
function drawMap(ctx, savannahAnim, animEnabled) {
  // Ground gradient
  var groundGrad = ctx.createLinearGradient(0, 0, MAP_W, MAP_H);
  groundGrad.addColorStop(0,    '#c8a850');
  groundGrad.addColorStop(0.2,  '#b89040');
  groundGrad.addColorStop(0.45, '#c4a248');
  groundGrad.addColorStop(0.7,  '#aa8838');
  groundGrad.addColorStop(1,    '#be9e44');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // Soil variation patches
  var soilSeeds = [
    {x:600,y:400,r:380},{x:1400,y:300,r:320},{x:2200,y:600,r:360},{x:3000,y:400,r:310},
    {x:3800,y:300,r:340},{x:4400,y:500,r:300},{x:500,y:1000,r:400},{x:1200,y:900,r:350},
    {x:2000,y:1100,r:340},{x:2900,y:1000,r:330},{x:3800,y:1100,r:350},{x:4500,y:900,r:300},
    {x:700,y:1700,r:370},{x:1600,y:1600,r:350},{x:2500,y:1800,r:360},{x:3400,y:1700,r:340},
    {x:4300,y:1800,r:320},{x:900,y:2400,r:340},{x:1800,y:2300,r:360},{x:2800,y:2500,r:350},
    {x:3700,y:2400,r:330},{x:4500,y:2600,r:300},{x:600,y:3000,r:350},{x:1500,y:3100,r:340},
    {x:2400,y:3000,r:360},{x:3300,y:3100,r:340},{x:4200,y:3000,r:320},
  ];
  for (var si = 0; si < soilSeeds.length; si++) {
    var s = soilSeeds[si];
    var sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    sg.addColorStop(0, 'rgba(160,120,40,0.16)'); sg.addColorStop(1, 'rgba(160,120,40,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }

  // Greenish patches near water
  var greenPatches = [
    {x:860,y:620,rx:200,ry:160},{x:1640,y:1230,rx:220,ry:175},{x:2460,y:530,rx:185,ry:140},
    {x:620,y:1840,rx:195,ry:155},{x:2860,y:1760,rx:210,ry:165},{x:3800,y:800,rx:195,ry:150},
    {x:4200,y:2200,rx:200,ry:160},{x:900,y:3100,rx:195,ry:155},{x:3100,y:3000,rx:185,ry:145},
  ];
  for (var gi = 0; gi < greenPatches.length; gi++) {
    var gp = greenPatches[gi];
    var gg = ctx.createRadialGradient(gp.x, gp.y, 20, gp.x, gp.y, gp.rx);
    gg.addColorStop(0, 'rgba(80,140,40,0.22)'); gg.addColorStop(0.6, 'rgba(80,140,40,0.10)'); gg.addColorStop(1, 'rgba(80,140,40,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(gp.x, gp.y, gp.rx, gp.ry, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Dry grass tufts
  if (animEnabled) {
    ctx.strokeStyle = 'rgba(180,155,60,0.45)'; ctx.lineWidth = 1.2;
    for (var gy = 60; gy < MAP_H; gy += 75) {
      for (var gx = 60; gx < MAP_W; gx += 85) {
        if (mapPtInRock(gx, gy, 5)) continue;
        var sway = Math.sin(savannahAnim * 1.1 + (gx + gy) * 0.009) * 3.5;
        for (var t = 0; t < 3; t++) {
          var tx2 = gx + (t - 1) * 7, ty2 = gy;
          ctx.beginPath(); ctx.moveTo(tx2, ty2);
          ctx.quadraticCurveTo(tx2 + sway, ty2 - 13, tx2 + sway * 1.5, ty2 - 22); ctx.stroke();
        }
      }
    }
  }

  // Dust shimmer patches
  var dustPatches = [
    {x:1100,y:550},{x:2000,y:400},{x:700,y:1300},{x:2300,y:1200},
    {x:1500,y:1800},{x:2900,y:1500},{x:400,y:2000},{x:1800,y:400},
    {x:3400,y:700},{x:4100,y:1200},{x:3700,y:2000},{x:4400,y:2700},
    {x:2000,y:2800},{x:1200,y:3200},{x:3200,y:3300},
  ];
  for (var di = 0; di < dustPatches.length; di++) {
    var dp = dustPatches[di];
    var dg = ctx.createRadialGradient(dp.x, dp.y, 0, dp.x, dp.y, 160);
    dg.addColorStop(0, 'rgba(210,185,90,0.18)'); dg.addColorStop(1, 'rgba(210,185,90,0)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(dp.x, dp.y, 160, 95, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Watering holes
  for (var wi = 0; wi < WATER_HOLES.length; wi++) {
    var wh = WATER_HOLES[wi];
    var shoreG = ctx.createRadialGradient(wh.cx, wh.cy, wh.ry, wh.cx, wh.cy, wh.rx + 40);
    shoreG.addColorStop(0, 'rgba(110,80,30,0.6)'); shoreG.addColorStop(1, 'rgba(110,80,30,0)');
    ctx.beginPath(); ctx.ellipse(wh.cx, wh.cy, wh.rx + 40, wh.ry + 40, 0, 0, Math.PI * 2); ctx.fillStyle = shoreG; ctx.fill();
    ctx.beginPath(); ctx.ellipse(wh.cx, wh.cy, wh.rx + 10, wh.ry + 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5c4020'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(wh.cx, wh.cy, wh.rx, wh.ry, 0, 0, Math.PI * 2);
    var wg = ctx.createRadialGradient(wh.cx - wh.rx * 0.3, wh.cy - wh.ry * 0.3, 4, wh.cx, wh.cy, wh.rx);
    wg.addColorStop(0, '#5aa8c0'); wg.addColorStop(0.5, '#348090'); wg.addColorStop(1, '#1c5568');
    ctx.fillStyle = wg; ctx.fill();
    if (animEnabled) {
      var ripplePhase = (savannahAnim * 0.7 + wh.cx * 0.002) % (Math.PI * 2);
      for (var ri = 0; ri < 3; ri++) {
        var rp = (ripplePhase + ri * 2.1) % (Math.PI * 2);
        var rs = 0.3 + Math.abs(Math.sin(rp)) * 0.55;
        ctx.beginPath(); ctx.ellipse(wh.cx, wh.cy, wh.rx * rs, wh.ry * rs, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(180,230,255,' + (0.18 - ri * 0.05) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      var glint = 0.2 + Math.sin(savannahAnim * 1.9 + wh.cx * 0.01) * 0.12;
      ctx.fillStyle = 'rgba(220,248,255,' + glint + ')';
      ctx.beginPath(); ctx.ellipse(wh.cx - wh.rx * 0.28, wh.cy - wh.ry * 0.28, wh.rx * 0.28, wh.ry * 0.16, -0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.globalAlpha = 0.55; ctx.font = 'bold 11px Rajdhani,sans-serif';
    ctx.fillStyle = '#b0e8ff'; ctx.textAlign = 'center'; ctx.fillText('≋ WATER ≋', wh.cx, wh.cy + 4); ctx.restore();
  }

  // Rocky outcrops
  for (var rci = 0; rci < ROCK_CLUSTERS.length; rci++) {
    var rc = ROCK_CLUSTERS[rci];
    ctx.beginPath(); ctx.ellipse(rc.cx + 14, rc.cy + 12, rc.rx, rc.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,40,10,0.32)'; ctx.fill();
    var rcg = ctx.createRadialGradient(rc.cx - rc.rx * 0.3, rc.cy - rc.ry * 0.3, rc.rx * 0.1, rc.cx, rc.cy, rc.rx);
    rcg.addColorStop(0, '#b0987a'); rcg.addColorStop(0.5, '#907558'); rcg.addColorStop(1, '#6a5035');
    ctx.beginPath(); ctx.ellipse(rc.cx, rc.cy, rc.rx, rc.ry, 0, 0, Math.PI * 2); ctx.fillStyle = rcg; ctx.fill();
    for (var rii = 0; rii < 7; rii++) {
      var ra = rii / 7 * Math.PI * 2, rd = rc.rx * (0.18 + rii * 0.1);
      var rx2 = rc.cx + Math.cos(ra) * rd, ry2 = rc.cy + Math.sin(ra) * rc.ry / rc.rx * rd;
      var rr2 = 20 - rii * 1.8;
      ctx.beginPath(); ctx.arc(rx2, ry2, rr2, 0, Math.PI * 2);
      ctx.fillStyle = rii % 2 === 0 ? '#a08868' : '#806848'; ctx.fill();
      ctx.strokeStyle = 'rgba(50,30,10,0.28)'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(rc.cx - rc.rx * 0.25, rc.cy - rc.ry * 0.3, rc.rx * 0.38, rc.ry * 0.24, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(230,205,160,0.22)'; ctx.fill();
  }

  // Map features: walls, roads, trees
  for (var fi = 0; fi < MAP_FEATURES.length; fi++) {
    var f = MAP_FEATURES[fi];

    if (f.type === 'road') {
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#9a7840'; ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = 'rgba(160,130,60,.22)'; ctx.setLineDash([35, 22]); ctx.lineWidth = 1.5; ctx.globalAlpha = 0.65;
      if (f.w > f.h) { ctx.beginPath(); ctx.moveTo(f.x, f.y + f.h / 2); ctx.lineTo(f.x + f.w, f.y + f.h / 2); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(f.x + f.w / 2, f.y); ctx.lineTo(f.x + f.w / 2, f.y + f.h); ctx.stroke(); }
      ctx.setLineDash([]); ctx.restore();

    } else if (f.type === 'wall') {
      var brickW = 22, brickH = 10;
      ctx.save();
      ctx.fillStyle = '#8b7045'; ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = 'rgba(50,30,10,0.45)'; ctx.lineWidth = 1;
      var rows = Math.ceil(f.h / brickH), cols = Math.ceil(f.w / brickW) + 1;
      for (var row = 0; row < rows; row++) {
        var yy = f.y + row * brickH;
        var offset = row % 2 === 0 ? 0 : brickW / 2;
        ctx.beginPath(); ctx.moveTo(f.x, yy); ctx.lineTo(f.x + f.w, yy); ctx.stroke();
        for (var col = 0; col <= cols; col++) {
          var xx = f.x + col * brickW - offset;
          if (xx > f.x && xx < f.x + f.w) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, Math.min(yy + brickH, f.y + f.h)); ctx.stroke(); }
          var bx = Math.max(f.x, xx + 1), bxx = Math.min(f.x + f.w, xx + brickW - 1);
          if (bxx > bx && yy + 1 < f.y + f.h) {
            ctx.fillStyle = (row + col) % 3 === 0 ? '#a08050' : (row + col) % 3 === 1 ? '#7a5f35' : '#917040';
            ctx.fillRect(bx, yy + 1, bxx - bx, Math.min(brickH - 2, f.y + f.h - yy - 2));
          }
        }
      }
      ctx.fillStyle = 'rgba(220,185,100,0.35)'; ctx.fillRect(f.x, f.y, f.w, 2);
      ctx.fillStyle = 'rgba(40,20,5,0.45)'; ctx.fillRect(f.x, f.y + f.h - 2, f.w, 2);
      ctx.restore();

    } else if (f.type === 'acacia') {
      var swayA = animEnabled ? Math.sin(savannahAnim * 0.9 + f.x * 0.011) * 3 : 0;
      var tx = f.x, ty = f.y, tr = f.r;
      ctx.fillStyle = 'rgba(70,48,8,0.22)'; ctx.beginPath(); ctx.ellipse(tx + 14, ty + tr * 0.95, tr * 0.9, tr * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      var tgA = ctx.createLinearGradient(tx - 4, ty, tx + 4, ty);
      tgA.addColorStop(0, '#7a5520'); tgA.addColorStop(1, '#5a3d10');
      ctx.fillStyle = tgA;
      ctx.beginPath(); ctx.moveTo(tx - 5, ty + tr * 0.75); ctx.lineTo(tx + 5, ty + tr * 0.75); ctx.lineTo(tx + 3, ty - tr * 0.05); ctx.lineTo(tx - 3, ty - tr * 0.05); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a6208'; ctx.beginPath(); ctx.ellipse(tx + swayA, ty - tr * 0.15, tr * 1.5, tr * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#358a10'; ctx.beginPath(); ctx.ellipse(tx + swayA * 0.8 - 5, ty - tr * 0.32, tr * 1.25, tr * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#42a018'; ctx.beginPath(); ctx.ellipse(tx + swayA * 0.5 - 2, ty - tr * 0.42, tr * 0.95, tr * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(195,255,90,0.12)'; ctx.beginPath(); ctx.ellipse(tx + swayA * 0.3 - tr * 0.32, ty - tr * 0.5, tr * 0.42, tr * 0.16, 0, 0, Math.PI * 2); ctx.fill();

    } else if (f.type === 'baobab') {
      var swayB = animEnabled ? Math.sin(savannahAnim * 0.7 + f.x * 0.009) * 2 : 0;
      var txB = f.x, tyB = f.y, trB = f.r;
      ctx.fillStyle = 'rgba(60,40,5,0.28)'; ctx.beginPath(); ctx.ellipse(txB + 18, tyB + trB * 1.05, trB * 1.1, trB * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      var btg = ctx.createRadialGradient(txB - trB * 0.2, tyB, trB * 0.1, txB, tyB, trB * 0.85);
      btg.addColorStop(0, '#a07848'); btg.addColorStop(0.5, '#7a5830'); btg.addColorStop(1, '#5a3e1e');
      ctx.fillStyle = btg;
      ctx.beginPath();
      ctx.moveTo(txB - trB * 0.35, tyB + trB * 0.95);
      ctx.bezierCurveTo(txB - trB * 0.75, tyB + trB * 0.4, txB - trB * 0.8, tyB - trB * 0.1, txB - trB * 0.28, tyB - trB * 0.55);
      ctx.bezierCurveTo(txB, tyB - trB * 0.7, txB, tyB - trB * 0.7, txB + trB * 0.28, tyB - trB * 0.55);
      ctx.bezierCurveTo(txB + trB * 0.8, tyB - trB * 0.1, txB + trB * 0.75, tyB + trB * 0.4, txB + trB * 0.35, tyB + trB * 0.95);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(40,25,8,0.3)'; ctx.lineWidth = 1;
      for (var tl = 0; tl < 4; tl++) {
        var frac = 0.2 + tl * 0.18;
        ctx.beginPath(); ctx.moveTo(txB - trB * frac, tyB - trB * 0.4); ctx.lineTo(txB - trB * frac * 0.3, tyB + trB * 0.9); ctx.stroke();
      }
      var bColors = ['#1e5c06','#267010','#2e8018','#388c20'];
      for (var ci2 = 0; ci2 < 6; ci2++) {
        var ca2 = ci2 / 6 * Math.PI * 2, cr2 = trB * (0.45 + ci2 % 2 * 0.18);
        var cx2 = txB + Math.cos(ca2) * cr2 * 0.7 + swayB, cy2 = tyB - trB * 0.6 + Math.sin(ca2) * cr2 * 0.35;
        ctx.fillStyle = bColors[ci2 % 4]; ctx.beginPath(); ctx.arc(cx2, cy2, trB * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(180,255,80,0.10)'; ctx.beginPath(); ctx.arc(txB + swayB - trB * 0.15, tyB - trB * 0.75, trB * 0.3, 0, Math.PI * 2); ctx.fill();

    } else if (f.type === 'palm') {
      var swayP = animEnabled ? Math.sin(savannahAnim * 1.2 + f.x * 0.015) * 5 : 0;
      var txP = f.x, tyP = f.y, trP = f.r;
      ctx.fillStyle = 'rgba(60,40,8,0.20)'; ctx.beginPath(); ctx.ellipse(txP + swayP + 8, tyP + trP * 1.1, trP * 0.6, trP * 0.15, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = trP * 0.22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(txP, tyP + trP); ctx.quadraticCurveTo(txP + swayP * 0.5, tyP, txP + swayP, tyP - trP * 0.8); ctx.stroke();
      ctx.strokeStyle = '#6a4e1e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(txP, tyP + trP); ctx.quadraticCurveTo(txP + swayP * 0.5, tyP, txP + swayP, tyP - trP * 0.8); ctx.stroke();
      var frondColors = ['#1a7828','#228034','#2a8840','#1e7030'];
      for (var fii = 0; fii < 8; fii++) {
        var fa = fii / 8 * Math.PI * 2;
        var fxP = txP + swayP + Math.cos(fa) * trP * 1.4, fyP = tyP - trP * 0.8 + Math.sin(fa) * trP * 0.65;
        ctx.strokeStyle = frondColors[fii % 4]; ctx.lineWidth = trP * 0.18; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(txP + swayP, tyP - trP * 0.8); ctx.quadraticCurveTo((txP + swayP + fxP) / 2, (tyP - trP * 0.8 + fyP) / 2 - 10, fxP, fyP); ctx.stroke();
      }
    }
  }
}
