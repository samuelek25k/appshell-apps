import { storage, widgets, shell } from '/__appshell/sdk.js';

const list = document.getElementById('notes');
const text = document.getElementById('text');
let notes = (await storage.get('notes')) ?? [];

const when = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

async function save() {
  await storage.set('notes', notes);
  await widgets.update('latest', {
    blocks: notes.length
      ? [{ type: 'metric', label: 'Notes', value: notes.length }, { type: 'text', text: notes[0].text.slice(0, 140) }, { type: 'actions', actions: [{ id: 'new', label: 'New note' }] }]
      : [{ type: 'text', text: 'No notes yet.' }, { type: 'actions', actions: [{ id: 'new', label: 'New note' }] }],
  });
  await shell.setTitle(notes.length ? `Quick Notes (${notes.length})` : 'Quick Notes');
}

function render() {
  document.getElementById('empty').hidden = notes.length > 0;
  list.replaceChildren(...notes.map((note) => {
    const item = document.createElement('li');
    const body = document.createElement('p');
    body.textContent = note.text;
    const time = document.createElement('time');
    time.dateTime = note.at;
    time.textContent = when(note.at);
    const remove = document.createElement('button');
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete note from ${when(note.at)}`);
    remove.addEventListener('click', async () => { notes = notes.filter((n) => n !== note); render(); await save(); });
    item.append(body, time, remove);
    return item;
  }));
}

document.getElementById('add').addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = text.value.trim();
  if (!value) return;
  notes = [{ text: value, at: new Date().toISOString() }, ...notes].slice(0, 200);
  text.value = '';
  render();
  await save();
});
text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) document.getElementById('add').requestSubmit(); });
widgets.onAction(({ action }) => { if (action === 'new') text.focus(); });

render();
await save();
