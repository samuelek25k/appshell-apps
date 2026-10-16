import { widgets } from '/__appshell/sdk.js';

const STORAGE_KEY = 'appshell_outlook_agenda_events';

const defaultEvents = [
  {
    id: 'ev-1',
    title: 'Sprint Planning & Backlog Grooming',
    start: '09:30',
    end: '10:15',
    type: 'Teams Meeting',
    location: 'Microsoft Teams',
    organizer: 'Engineering Team',
    status: 'Accepted'
  },
  {
    id: 'ev-2',
    title: 'Cross-Platform Architecture Review',
    start: '14:00',
    end: '14:45',
    type: 'In-Person',
    location: 'Conference Room 4B',
    organizer: 'Platform Architects',
    status: 'Tentative'
  },
  {
    id: 'ev-3',
    title: 'Product Roadmap & OKR Alignment',
    start: '16:00',
    end: '16:30',
    type: 'Teams Meeting',
    location: 'Executive Boardroom & Online',
    organizer: 'Product Leadership',
    status: 'Accepted'
  }
];

function loadEvents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return defaultEvents;
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  syncWidget(events);
  render(events);
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

function syncWidget(events) {
  const active = events.filter(e => e.status !== 'Completed');
  const next = active[0];
  widgets.update('today-meetings', {
    blocks: [
      { type: 'metric', label: 'Remaining', value: active.length },
      { type: 'text', text: next ? `${formatTime(next.start)} – ${formatTime(next.end)} ${next.title}` : 'No meetings remaining' },
    ],
  }).catch(() => {});
}

function render(events) {
  const container = document.getElementById('meetings-list');
  const countEl = document.getElementById('agenda-count');
  countEl.textContent = `Today's Agenda (${events.length} event${events.length === 1 ? '' : 's'})`;

  if (events.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center border border-dashed border-slate-800 text-slate-500 text-xs">
        No events scheduled for today. Click <strong>+ Add Event</strong> or <strong>Import .ics</strong>.
      </div>
    `;
    return;
  }

  container.innerHTML = events.map(ev => {
    const isDone = ev.status === 'Completed';
    const typeBadge = ev.type === 'Teams Meeting'
      ? 'bg-sky-950 text-sky-300 border-sky-800'
      : ev.type === 'Focus Block'
      ? 'bg-amber-950 text-amber-300 border-amber-800'
      : 'bg-slate-800 text-slate-300 border-slate-700';

    return `
      <div class="p-4 bg-slate-900 border ${isDone ? 'border-slate-800/60 opacity-60' : 'border-slate-800 hover:border-slate-700'} transition-all">
        <div class="flex items-center justify-between text-xs font-mono mb-1.5">
          <span class="${isDone ? 'text-slate-500 line-through' : 'text-sky-400 font-semibold'}">${formatTime(ev.start)} – ${formatTime(ev.end)}</span>
          <span class="px-2 py-0.5 text-[10px] font-semibold border ${typeBadge}">${ev.type}</span>
        </div>
        <h3 class="font-bold text-sm text-white ${isDone ? 'line-through text-slate-400' : ''}">${escapeHtml(ev.title)}</h3>
        <p class="text-xs text-slate-400 mt-1">${ev.location ? '📍 ' + escapeHtml(ev.location) : ''} ${ev.organizer ? '• ' + escapeHtml(ev.organizer) : ''}</p>
        <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
          <button data-action="toggle" data-id="${escapeHtml(ev.id)}" class="text-[11px] ${isDone ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'} flex items-center gap-1.5 transition-colors">
            <span class="w-2 h-2 ${isDone ? 'bg-emerald-400' : 'border border-slate-500'}"></span>
            <span>${isDone ? 'Completed' : 'Mark Completed'}</span>
          </button>
          <button data-action="delete" data-id="${escapeHtml(ev.id)}" class="text-[11px] text-slate-500 hover:text-rose-400 font-mono transition-colors">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function toggleStatus(id) {
  const events = loadEvents();
  const ev = events.find(e => e.id === id);
  if (ev) {
    ev.status = ev.status === 'Completed' ? 'Accepted' : 'Completed';
    saveEvents(events);
  }
}

function deleteEvent(id) {
  const events = loadEvents().filter(e => e.id !== id);
  saveEvents(events);
}
function parseICS(icsText) {
  const lines = icsText.split(/\r\n|\n|\r/);
  const events = [];
  let inEvent = false;
  let curr = {};

  for (let line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      curr = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (curr.title) {
        events.push({
          id: 'ics-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          title: curr.title || 'Untitled Event',
          start: curr.start || '09:00',
          end: curr.end || '10:00',
          location: curr.location || '',
          type: curr.location?.toLowerCase().includes('teams') ? 'Teams Meeting' : 'In-Person',
          status: 'Accepted'
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        curr.title = line.slice(8).trim();
      } else if (line.startsWith('LOCATION:')) {
        curr.location = line.slice(9).trim();
      } else if (line.startsWith('DTSTART')) {
        const val = line.split(':')[1];
        if (val && val.includes('T')) {
          const timePart = val.split('T')[1];
          curr.start = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}`;
        }
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':')[1];
        if (val && val.includes('T')) {
          const timePart = val.split('T')[1];
          curr.end = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}`;
        }
      }
    }
  }
  return events;
}
document.getElementById('current-date').textContent = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

document.getElementById('meetings-list').addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'toggle') toggleStatus(button.dataset.id);
  else deleteEvent(button.dataset.id);
});

const addForm = document.getElementById('add-form');
document.getElementById('add-btn').addEventListener('click', () => {
  addForm.classList.toggle('hidden');
});
document.getElementById('cancel-add-btn').addEventListener('click', () => {
  addForm.classList.add('hidden');
});

document.getElementById('save-ev-btn').addEventListener('click', () => {
  const title = document.getElementById('ev-title').value.trim();
  const start = document.getElementById('ev-start').value;
  const end = document.getElementById('ev-end').value;
  const type = document.getElementById('ev-type').value;
  const location = document.getElementById('ev-loc').value.trim();

  if (!title) {
    alert('Please enter an event title.');
    return;
  }

  const events = loadEvents();
  events.push({
    id: 'ev-' + Date.now(),
    title,
    start,
    end,
    type,
    location,
    status: 'Accepted'
  });
  events.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  saveEvents(events);

  document.getElementById('ev-title').value = '';
  addForm.classList.add('hidden');
});

document.getElementById('clear-btn').addEventListener('click', () => {
  if (confirm('Clear all events from today\'s agenda?')) {
    saveEvents([]);
  }
});

document.getElementById('ics-input').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const parsed = parseICS(evt.target.result);
    if (parsed.length > 0) {
      const events = [...loadEvents(), ...parsed];
      events.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
      saveEvents(events);
      alert(`Imported ${parsed.length} event(s) from ${file.name}.`);
    } else {
      alert('No VEVENT items found in this .ics file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});
const initialEvents = loadEvents();
render(initialEvents);
syncWidget(initialEvents);
