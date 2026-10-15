const $ = (id) => document.getElementById(id);

const SAMPLE_MD = `# Appshell Architectural Note

> "Modular computing built on web standards, native sandboxing, and declarative capabilities."

## Key Design Principles

1. **Sandboxed Isolation**: Each application lives in an isolated filesystem partition.
2. **Deterministic Egress**: Outbound HTTP/WS requests must be strictly declared.
3. **Reactive Widgets**: Fast micro-views on the system workspace dashboard.

### Core Metrics Table

| Metric | Target | Status |
| :--- | :--- | :--- |
| Cold Start | < 120ms | 🟢 Passed |
| Memory Footprint | < 35MB | 🟢 Passed |
| IPC Latency | < 0.4ms | 🟢 Passed |

### Example Sandbox Manifest
\`\`\`json
{
  "id": "vault-sync",
  "version": "1.0.0",
  "capabilities": {
    "network": ["api.cloud.corp"],
    "secrets": ["auth_token"]
  }
}
\`\`\`

- [x] Verified zero host node.js leak
- [x] Hardened content security policies
- [ ] Multi-region sync broker
`;

// Simple lightweight Markdown Parser (headings, tables, code blocks, lists, quotes)
function parseMarkdown(md) {
  let html = md
    // Escape HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks ```
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Checklists & Unordered lists
  html = html.replace(/^- \[x\] (.*$)/gim, '<li><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/^- \[ \] (.*$)/gim, '<li><input type="checkbox" disabled> $1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Simple Tables
  const lines = html.split('\n');
  let inTable = false;
  const processed = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        processed.push('<table>');
        inTable = true;
        const cells = line.split('|').slice(1, -1).map(c => `<th>${c.trim()}</th>`).join('');
        processed.push(`<tr>${cells}</tr>`);
      } else if (line.includes('---')) {
        // Divider row, skip
        continue;
      } else {
        const cells = line.split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('');
        processed.push(`<tr>${cells}</tr>`);
      }
    } else {
      if (inTable) {
        processed.push('</table>');
        inTable = false;
      }
      processed.push(line ? `<p>${line}</p>` : '');
    }
  }
  if (inTable) processed.push('</table>');

  return processed.join('\n');
}

const input = $('md-input');
const preview = $('md-preview');
const stats = $('md-stats');
const statusLeft = $('status-left');

function update() {
  const val = input.value;
  const words = val.trim() ? val.trim().split(/\s+/).length : 0;
  const chars = val.length;
  stats.textContent = `${words} word${words === 1 ? '' : 's'} • ${chars} chars`;

  preview.innerHTML = parseMarkdown(val);
  statusLeft.textContent = `Rendered • ${words} words`;
}

input.addEventListener('input', update);

$('btn-sample').addEventListener('click', () => {
  input.value = SAMPLE_MD;
  update();
});

$('btn-copy-html').addEventListener('click', () => {
  navigator.clipboard.writeText(preview.innerHTML);
  const btn = $('btn-copy-html');
  const prev = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = prev; }, 1500);
});

$('btn-copy-md').addEventListener('click', () => {
  navigator.clipboard.writeText(input.value);
  const btn = $('btn-copy-md');
  const prev = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = prev; }, 1500);
});

$('btn-clear').addEventListener('click', () => {
  input.value = '';
  update();
});

// Initial sample
input.value = SAMPLE_MD;
update();
