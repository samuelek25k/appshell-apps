let sdk = null;
try { sdk = await import('/__appshell/sdk.js'); } catch {}

const $ = (id) => document.getElementById(id);

let currentColor = '#0ea5e9';
let swatches = (sdk ? await sdk.storage?.get('color_swatches') : null) ||
               JSON.parse(localStorage.getItem('__color_swatches') || 'null') ||
               ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0f172a'];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 10) / 10;
}

async function syncWidget() {
  if (sdk?.storage?.set) {
    try { await sdk.storage.set('color_swatches', swatches); } catch {}
  }
  localStorage.setItem('__color_swatches', JSON.stringify(swatches));

  if (sdk?.widgets?.update) {
    try {
      await sdk.widgets.update('palette', {
        blocks: [
          { type: 'metric', label: 'Color Studio', value: currentColor },
          { type: 'text', text: `${swatches.length} saved swatches` }
        ]
      });
    } catch {}
  }
}

function updateColor(hex) {
  currentColor = hex;
  $('header-badge').style.background = hex;
  $('header-badge').style.boxShadow = `0 0 10px ${hex}`;
  $('preview-box').style.background = hex;
  $('preview-hex').textContent = hex;
  $('native-picker').value = hex;

  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  $('val-hex').value = hex;
  $('val-rgb').value = `rgb(${r}, ${g}, ${b})`;
  $('val-hsl').value = `hsl(${h}, ${s}%, ${l}%)`;

  // Contrast against White
  const contrastWhite = getContrast(hex, '#ffffff');
  $('ratio-white').textContent = `${contrastWhite}:1`;
  $('status-white').textContent = contrastWhite >= 4.5 ? 'Pass (WCAG AA)' : contrastWhite >= 3.0 ? 'Pass (Large only)' : 'Fail';
  $('status-white').style.color = contrastWhite >= 4.5 ? '#10b981' : contrastWhite >= 3.0 ? '#f59e0b' : '#ef4444';

  // Contrast against Black
  const contrastBlack = getContrast(hex, '#090d16');
  $('ratio-black').textContent = `${contrastBlack}:1`;
  $('status-black').textContent = contrastBlack >= 4.5 ? 'Pass (WCAG AA)' : contrastBlack >= 3.0 ? 'Pass (Large only)' : 'Fail';
  $('status-black').style.color = contrastBlack >= 4.5 ? '#10b981' : contrastBlack >= 3.0 ? '#f59e0b' : '#ef4444';

  if (sdk?.shell?.setTitle) {
    try { sdk.shell.setTitle(`Color: ${hex}`); } catch {}
  }
}

function renderSwatches() {
  const container = $('swatch-list');
  container.innerHTML = '';
  swatches.forEach((sw) => {
    const el = document.createElement('div');
    el.className = 'swatch-item';
    el.style.background = sw;
    el.title = sw;
    el.addEventListener('click', () => updateColor(sw));
    container.appendChild(el);
  });
}

$('native-picker').addEventListener('input', (e) => updateColor(e.target.value));

$('btn-save-swatch').addEventListener('click', () => {
  if (!swatches.includes(currentColor)) {
    swatches = [currentColor, ...swatches].slice(0, 16);
    renderSwatches();
    syncWidget();
  }
});

// Eyedropper API if supported by platform/browser
$('btn-eyedropper').addEventListener('click', async () => {
  if ('EyeDropper' in window) {
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        updateColor(result.sRGBHex);
      }
    } catch {}
  } else {
    alert('System EyeDropper is only available in Chromium/Desktop shell.');
  }
});

// Copy buttons
document.querySelectorAll('.btn-copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = $(btn.dataset.target);
    if (target) {
      navigator.clipboard.writeText(target.value);
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = prev; }, 1200);
    }
  });
});

updateColor(currentColor);
renderSwatches();
syncWidget();
