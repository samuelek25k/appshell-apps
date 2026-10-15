const $ = (id) => document.getElementById(id);

const SAMPLE_JSON = {
  "appName": "Appshell Desktop",
  "version": "1.0.0",
  "status": "ready",
  "metrics": {
    "latencyMs": 14.2,
    "activeSandboxes": 4,
    "securityTier": "hardened"
  },
  "capabilities": ["storage", "network", "secrets", "widgets", "launcher"],
  "endpoints": [
    { "host": "api.openai.com", "ssl": true },
    { "host": "api.anthropic.com", "ssl": true }
  ]
};

const input = $('json-input');
const output = $('code-output');
const statusBadge = $('output-status');
const stats = $('input-stats');
const statusLeft = $('status-left');

function updateStats(val) {
  const lines = val ? val.split('\n').length : 0;
  const chars = val ? val.length : 0;
  stats.textContent = `${lines} line${lines === 1 ? '' : 's'} • ${chars} chars`;
}

function processJson(spaces = 2) {
  const val = input.value.trim();
  updateStats(val);
  if (!val) {
    output.textContent = '// Formatted JSON will appear here';
    statusBadge.textContent = 'Awaiting input';
    statusBadge.className = 'pane-badge';
    statusLeft.textContent = 'Ready';
    return;
  }

  try {
    const parsed = JSON.parse(val);
    output.textContent = JSON.stringify(parsed, null, spaces);
    statusBadge.textContent = 'Valid JSON';
    statusBadge.className = 'pane-badge valid';
    const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1;
    statusLeft.textContent = `Valid • ${keys} top-level keys`;
  } catch (err) {
    output.textContent = `Syntax Error:\n${err.message}`;
    statusBadge.textContent = 'Invalid JSON';
    statusBadge.className = 'pane-badge invalid';
    statusLeft.textContent = err.message;
  }
}

function generateTypeScript() {
  const val = input.value.trim();
  if (!val) return;
  try {
    const parsed = JSON.parse(val);
    const toTs = (obj, name = 'RootObject') => {
      if (typeof obj !== 'object' || obj === null) return `type ${name} = ${typeof obj};`;
      if (Array.isArray(obj)) {
        const itemType = obj.length ? typeof obj[0] : 'any';
        return `type ${name} = ${itemType}[];`;
      }
      const lines = [`export interface ${name} {`];
      for (const [k, v] of Object.entries(obj)) {
        let t = typeof v;
        if (v === null) t = 'any';
        else if (Array.isArray(v)) t = v.length ? `${typeof v[0]}[]` : 'any[]';
        else if (t === 'object') t = 'Record<string, any>';
        lines.push(`  ${k}: ${t};`);
      }
      lines.push('}');
      return lines.join('\n');
    };
    output.textContent = toTs(parsed);
    statusBadge.textContent = 'TypeScript Schema';
    statusBadge.className = 'pane-badge valid';
    statusLeft.textContent = 'Generated TypeScript Interface';
  } catch (err) {
    output.textContent = `Cannot generate TS: ${err.message}`;
  }
}

// Event Bindings
input.addEventListener('input', () => processJson(2));
$('btn-format').addEventListener('click', () => processJson(2));
$('btn-minify').addEventListener('click', () => processJson(0));
$('btn-to-ts').addEventListener('click', generateTypeScript);
$('btn-sample').addEventListener('click', () => {
  input.value = JSON.stringify(SAMPLE_JSON, null, 2);
  processJson(2);
});
$('btn-clear').addEventListener('click', () => {
  input.value = '';
  processJson(2);
});
$('btn-copy').addEventListener('click', () => {
  const text = output.textContent;
  if (text) {
    navigator.clipboard.writeText(text);
    const prev = $('btn-copy').textContent;
    $('btn-copy').textContent = 'Copied!';
    setTimeout(() => { $('btn-copy').textContent = prev; }, 1500);
  }
});

// Load sample on initial blank launch
input.value = JSON.stringify(SAMPLE_JSON, null, 2);
processJson(2);
