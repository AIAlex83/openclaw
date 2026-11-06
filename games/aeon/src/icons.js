// Line-art category icons drawn on a 2D canvas (used for the holographic category panels).
export function drawIcon(x, kind, c, cx, cy) {
  x.save(); x.strokeStyle = c; x.fillStyle = c; x.lineWidth = 3; x.shadowColor = c; x.shadowBlur = 14; x.translate(cx, cy);
  const P = (pts) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); };
  const dot = (a, b, r = 6) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); };
  switch (kind) {
    case 'atom': for (let k = 0; k < 3; k++) { x.save(); x.rotate(k * Math.PI / 3); x.beginPath(); x.ellipse(0, 0, 80, 28, 0, 0, 7); x.stroke(); x.restore(); } dot(0, 0, 12); break;
    case 'flask': P([[-25, -85], [-25, -20], [-75, 70], [75, 70], [25, -20], [25, -85]]); P([[-35, -85], [35, -85]]); P([[-55, 30], [55, 30]]); dot(-10, 50, 7); dot(20, 42, 5); break;
    case 'dna': for (let i = 0; i <= 40; i++) { const y = -85 + i * 4.25, a = i * 0.32, x1 = Math.sin(a) * 40; x.globalAlpha = 0.6 + 0.4 * Math.cos(a); x.fillRect(x1 - 3, y - 3, 6, 6); x.fillRect(-x1 - 3, y - 3, 6, 6); if (i % 4 === 0) { x.globalAlpha = 0.4; P([[x1, y], [-x1, y]]); } } x.globalAlpha = 1; break;
    case 'cross': x.strokeRect(-25, -80, 50, 160); x.strokeRect(-80, -25, 160, 50); P([[-95, 0], [-60, 0], [-45, -30], [-25, 30], [-10, 0], [95, 0]]); break;
    case 'math': P([[-90, 60], [90, 60]]); P([[-80, 80], [-80, -85]]); x.beginPath(); for (let i = 0; i <= 60; i++) { const px = -80 + i * 2.8, py = 40 - Math.sin(i / 9) * 40 - i * 0.6; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); x.font = '700 54px Rajdhani, sans-serif'; x.fillText('∑ π', 10, -40); break;
    case 'astro': x.beginPath(); x.arc(0, 0, 42, 0, 7); x.stroke(); x.beginPath(); x.ellipse(0, 0, 88, 22, -0.35, 0, 7); x.stroke(); for (let k = 0; k < 14; k++) x.fillRect(Math.cos(k * 2.1) * 100, Math.sin(k * 1.7) * 90, 3, 3); break;
    case 'tech': P([[-80, -60], [-20, -60], [-20, 0], [50, 0], [50, 60], [90, 60]]); P([[-80, 40], [-30, 40], [-30, 80], [20, 80]]); P([[10, -80], [10, -30], [80, -30]]); x.strokeRect(-35, -35, 50, 50); [[-80, -60], [90, 60], [-80, 40], [20, 80], [10, -80], [80, -30]].forEach(([a, b]) => dot(a, b)); break;
    case 'temple': P([[-85, -40], [0, -85], [85, -40], [-85, -40]]); x.strokeRect(-85, -40, 170, 10); for (let k = 0; k < 5; k++) x.strokeRect(-72 + k * 34, -24, 14, 90); x.strokeRect(-95, 66, 190, 12); break;
    case 'globe': x.beginPath(); x.arc(0, 0, 80, 0, 7); x.stroke(); x.beginPath(); x.ellipse(0, 0, 35, 80, 0, 0, 7); x.stroke(); P([[-80, 0], [80, 0]]); x.beginPath(); x.ellipse(0, -40, 70, 10, 0, 0, 7); x.stroke(); x.beginPath(); x.ellipse(0, 40, 70, 10, 0, 0, 7); x.stroke(); break;
    case 'lang': x.font = '700 64px Rajdhani, sans-serif'; x.textAlign = 'center'; x.fillText('Aα', -20, -5); x.font = '600 46px serif'; x.fillText('文 ж', 25, 70); break;
    case 'palette': x.beginPath(); x.ellipse(0, 0, 85, 65, 0, 0, 7); x.stroke(); [[-40, -25], [0, -40], [40, -25], [50, 15]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 12, 0, 7); x.stroke(); }); x.beginPath(); x.arc(-30, 30, 16, 0, 7); x.fill(); break;
    case 'philo': for (let r = 20; r <= 90; r += 17) { x.beginPath(); x.arc(0, 0, r, (r / 17) % 2 ? 0.4 : 3.5, (r / 17) % 2 ? 5.9 : 9.0); x.stroke(); } dot(0, 0, 7); break;
    case 'head': x.beginPath(); x.moveTo(-40, 85); x.lineTo(-40, 40); x.bezierCurveTo(-90, 10, -80, -85, 0, -85); x.bezierCurveTo(70, -85, 80, -20, 60, 0); x.lineTo(75, 25); x.lineTo(55, 30); x.lineTo(55, 60); x.lineTo(20, 60); x.lineTo(20, 85); x.stroke(); x.beginPath(); x.arc(5, -25, 22, 0, 7); x.stroke(); dot(5, -25, 6); break;
    case 'chart': P([[-90, 75], [90, 75]]); [[-70, 30], [-30, 0], [10, -20], [50, -60]].forEach(([a, h]) => x.strokeRect(a, h, 26, 75 - h)); P([[-80, 10], [-20, -30], [20, -50], [80, -90]]); dot(80, -90); break;
    default: for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; P([[Math.cos(a) * 20, Math.sin(a) * 20], [Math.cos(a) * (k % 2 ? 55 : 85), Math.sin(a) * (k % 2 ? 55 : 85)]]); } dot(0, 0, 10);
  }
  x.restore();
}
