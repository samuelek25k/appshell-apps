let sdk = null;
try { sdk = await import('/__appshell/sdk.js'); } catch {}

const MODES = {
  pomodoro: { label: 'Focus', minutes: 25, color: '#ef4444' },
  shortBreak: { label: 'Short Break', minutes: 5, color: '#10b981' },
  longBreak: { label: 'Long Break', minutes: 15, color: '#3b82f6' }
};

let state = (sdk ? await sdk.storage?.get('pomodoro_state') : null) ||
            JSON.parse(localStorage.getItem('__pomodoro_state') || 'null') || {
  mode: 'pomodoro',
  secondsLeft: 25 * 60,
  isRunning: false,
  completedCount: 0,
  totalFocusSeconds: 0,
  streak: 0,
  currentTask: 'Deep Work Session'
};

let timer = null;

const $ = (id) => document.getElementById(id);

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

async function sync() {
  if (sdk?.storage?.set) {
    try { await sdk.storage.set('pomodoro_state', state); } catch {}
  }
  localStorage.setItem('__pomodoro_state', JSON.stringify(state));

  const timeStr = formatTime(state.secondsLeft);
  if (sdk?.shell?.setTitle) {
    try { await sdk.shell.setTitle(`${timeStr} • ${MODES[state.mode].label}`); } catch {}
  }

  if (sdk?.widgets?.update) {
    try {
      await sdk.widgets.update('active-timer', {
        blocks: [
          { type: 'metric', label: MODES[state.mode].label, value: timeStr },
          { type: 'text', text: state.currentTask || (state.isRunning ? 'Active Focus' : 'Paused') },
          {
            type: 'actions',
            actions: [
              { id: 'toggle', label: state.isRunning ? 'Pause' : 'Start' }
            ]
          }
        ]
      });
    } catch {}
  }
}

function render() {
  $('time-display').textContent = formatTime(state.secondsLeft);
  $('active-task-label').textContent = state.currentTask;
  $('btn-toggle').textContent = state.isRunning ? 'Pause' : 'Start';
  $('stat-sessions').textContent = state.completedCount;
  $('stat-minutes').textContent = `${Math.floor(state.totalFocusSeconds / 60)}m`;
  $('stat-streak').textContent = state.streak;

  document.querySelectorAll('.mode-tab').forEach((tab) => {
    const active = tab.dataset.mode === state.mode;
    tab.classList.toggle('active', active);
    if (active) {
      document.documentElement.style.setProperty('--accent', MODES[state.mode].color);
    }
  });
}

function tick() {
  if (state.secondsLeft > 0) {
    state.secondsLeft -= 1;
    if (state.mode === 'pomodoro') {
      state.totalFocusSeconds += 1;
    }
    render();
    sync();
  } else {
    clearInterval(timer);
    timer = null;
    state.isRunning = false;

    if (state.mode === 'pomodoro') {
      state.completedCount += 1;
      state.streak += 1;
      notify('Focus Complete!', 'Great work! Take a well-deserved break.');
      state.mode = state.completedCount % 4 === 0 ? 'longBreak' : 'shortBreak';
    } else {
      notify('Break Finished!', 'Ready to resume focus?');
      state.mode = 'pomodoro';
    }
    state.secondsLeft = MODES[state.mode].minutes * 60;
    render();
    sync();
  }
}

function toggleTimer() {
  if (state.isRunning) {
    clearInterval(timer);
    timer = null;
    state.isRunning = false;
  } else {
    state.isRunning = true;
    timer = setInterval(tick, 1000);
  }
  render();
  sync();
}

function switchMode(newMode) {
  if (state.mode === newMode) return;
  clearInterval(timer);
  timer = null;
  state.isRunning = false;
  state.mode = newMode;
  state.secondsLeft = MODES[newMode].minutes * 60;
  render();
  sync();
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  state.isRunning = false;
  state.secondsLeft = MODES[state.mode].minutes * 60;
  render();
  sync();
}

function skipSession() {
  clearInterval(timer);
  timer = null;
  state.isRunning = false;
  if (state.mode === 'pomodoro') {
    state.mode = 'shortBreak';
  } else {
    state.mode = 'pomodoro';
  }
  state.secondsLeft = MODES[state.mode].minutes * 60;
  render();
  sync();
}

function notify(title, body) {
  if (sdk?.notifications?.show) {
    sdk.notifications.show({ title, body });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

$('btn-toggle').addEventListener('click', toggleTimer);
$('btn-reset').addEventListener('click', resetTimer);
$('btn-skip').addEventListener('click', skipSession);

document.querySelectorAll('.mode-tab').forEach((tab) => {
  tab.addEventListener('click', () => switchMode(tab.dataset.mode));
});

$('task-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = $('task-input').value.trim();
  if (val) {
    state.currentTask = val;
    $('task-input').value = '';
    render();
    sync();
  }
});

if (sdk?.widgets?.onAction) {
  sdk.widgets.onAction(({ action }) => {
    if (action === 'toggle') toggleTimer();
  });
}

render();
sync();
