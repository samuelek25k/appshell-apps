let sdk = null;
try { sdk = await import('/__appshell/sdk.js'); } catch {}

const list = document.getElementById('notes');
const text = document.getElementById('text');
const searchInput = document.getElementById('notes-search');
const notesCount = document.getElementById('notes-count');
const empty = document.getElementById('empty');

let notes = (sdk ? await sdk.storage?.get('notes') : null) ||
            JSON.parse(localStorage.getItem('notes') || 'null') || [];

let activeTag = 'work';
let activeFilter = 'all';
let searchQuery = '';

const when = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

async function save() {
  if (sdk?.storage?.set) {
    try { await sdk.storage.set('notes', notes); } catch {}
  }
  localStorage.setItem('notes', JSON.stringify(notes));

  if (sdk?.widgets?.update) {
    try {
      await sdk.widgets.update('latest', {
        blocks: notes.length
          ? [
              { type: 'metric', label: 'Quick Notes', value: notes.length },
              { type: 'text', text: notes[0].text.slice(0, 140) },
              { type: 'actions', actions: [{ id: 'new', label: 'New note' }] }
            ]
          : [
              { type: 'text', text: 'No notes yet.' },
              { type: 'actions', actions: [{ id: 'new', label: 'New note' }] }
            ]
      });
    } catch {}
  }

  if (sdk?.shell?.setTitle) {
    try { await sdk.shell.setTitle(notes.length ? `Notes (${notes.length})` : 'Quick Notes'); } catch {}
  }
}

function render() {
  const filtered = notes.filter((n) => {
    if (activeFilter === 'pinned' && !n.pinned) return false;
    if (['work', 'idea', 'todo'].includes(activeFilter) && n.tag !== activeFilter) return false;
    if (searchQuery && !n.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  empty.hidden = filtered.length > 0;
  notesCount.textContent = `${filtered.length} of ${notes.length} notes`;

  list.replaceChildren(...filtered.map((note) => {
    const item = document.createElement('li');
    item.className = `note-item ${note.pinned ? 'pinned' : ''}`;

    const body = document.createElement('p');
    body.className = 'note-text';
    body.textContent = note.text;

    const meta = document.createElement('div');
    meta.className = 'note-meta';

    const left = document.createElement('div');
    left.className = 'meta-left';

    const tagBadge = document.createElement('span');
    tagBadge.className = 'tag-badge';
    tagBadge.textContent = note.tag ? `#${note.tag}` : '#note';

    const time = document.createElement('time');
    time.dateTime = note.at;
    time.textContent = when(note.at);

    left.append(tagBadge, time);

    const actions = document.createElement('div');
    actions.className = 'note-actions';

    const btnPin = document.createElement('button');
    btnPin.className = 'action-btn';
    btnPin.textContent = note.pinned ? 'Unpin' : '📌 Pin';
    btnPin.addEventListener('click', async () => {
      note.pinned = !note.pinned;
      render();
      await save();
    });

    const btnCopy = document.createElement('button');
    btnCopy.className = 'action-btn';
    btnCopy.textContent = 'Copy';
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(note.text);
      btnCopy.textContent = 'Copied!';
      setTimeout(() => { btnCopy.textContent = 'Copy'; }, 1200);
    });

    const btnDel = document.createElement('button');
    btnDel.className = 'action-btn delete';
    btnDel.textContent = 'Delete';
    btnDel.addEventListener('click', async () => {
      notes = notes.filter((n) => n !== note);
      render();
      await save();
    });

    actions.append(btnPin, btnCopy, btnDel);
    meta.append(left, actions);
    item.append(body, meta);
    return item;
  }));
}

document.querySelectorAll('.tag-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeTag = chip.dataset.tag;
  });
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  render();
});

document.getElementById('add').addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = text.value.trim();
  if (!value) return;

  notes = [{
    text: value,
    tag: activeTag,
    pinned: false,
    at: new Date().toISOString()
  }, ...notes].slice(0, 200);

  text.value = '';
  render();
  await save();
});

text.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    document.getElementById('add').requestSubmit();
  }
});

if (sdk?.widgets?.onAction) {
  sdk.widgets.onAction(({ action }) => {
    if (action === 'new') text.focus();
  });
}

render();
await save();
