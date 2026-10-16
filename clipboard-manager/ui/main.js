let sdk = null;
try { sdk = await import('/__appshell/sdk.js'); } catch {}
const clips = (sdk ? await sdk.storage.get('clips') : JSON.parse(localStorage.getItem('clips') || 'null')) || [
  'git commit -m "feat: initial commit"',
  'import { backend, storage, widgets } from "/__appshell/sdk.js";',
  'const [state, setState] = useState(null);'
];

async function sync() {
  if (sdk) {
    await sdk.storage.set('clips', clips);
    await sdk.widgets.update('recent-clips', {
      blocks: [
        { type: 'metric', label: 'Pinned Clips', value: clips.length },
        { type: 'text', text: clips[0] || 'No clips' }
      ]
    });
  } else {
    localStorage.setItem('clips', JSON.stringify(clips));
  }
  render();
}

function render() {
  const list = document.getElementById('clips-list');
  const empty = document.getElementById('empty-msg');
  empty.hidden = clips.length > 0;
  list.innerHTML = '';
  clips.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="clip-text">${c.replace(/</g, '&lt;')}</span><button class="btn-copy">Copy</button>`;
    li.querySelector('.btn-copy').addEventListener('click', (e) => {
      navigator.clipboard.writeText(c);
      e.target.textContent = 'Copied!';
      setTimeout(() => e.target.textContent = 'Copy', 1500);
    });
    list.appendChild(li);
  });
}

document.getElementById('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('clip-input');
  if (input.value.trim()) {
    clips.unshift(input.value.trim());
    input.value = '';
    sync();
  }
});

sync();
