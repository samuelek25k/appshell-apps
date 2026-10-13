import { storage, shell, widgets } from '/__appshell/sdk.js';

const form = /** @type {HTMLFormElement} */ (document.getElementById('form'));
const status = /** @type {HTMLElement} */ (document.getElementById('status'));
const fields = ['name', 'email', 'role'];
let dirty = false;

const publishWidget = (profile) => widgets.update('summary', {
  blocks: profile.name
    ? [{ type: 'metric', label: profile.role || 'Signed in as', value: profile.name }, { type: 'actions', actions: [{ id: 'edit', label: 'Edit' }] }]
    : [{ type: 'text', text: 'Add your name in Profile.' }, { type: 'actions', actions: [{ id: 'edit', label: 'Set up' }] }],
});

const profile = (await storage.get('profile')) ?? {};
for (const f of fields) form.elements.namedItem(f).value = profile[f] ?? '';
await publishWidget(profile);

form.addEventListener('input', () => { dirty = true; warned = false; status.textContent = 'Unsaved changes'; });
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const next = Object.fromEntries(fields.map((f) => [f, form.elements.namedItem(f).value.trim()]));
  await storage.set('profile', next);
  await publishWidget(next);
  await shell.setTitle(next.name ? `Profile · ${next.name}` : 'Profile');
  dirty = false;
  status.textContent = 'Saved';
});

// The host waits only 600 ms for an answer, so veto once and let a second close discard.
let warned = false;
shell.onCloseRequested(() => {
  if (!dirty || warned) return true;
  warned = true;
  status.textContent = 'Unsaved changes. Save, or close again to discard.';
  return false;
});

widgets.onAction(({ action }) => {
  if (action === 'edit') form.elements.namedItem('name').focus();
});
