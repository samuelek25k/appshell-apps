import { storage, widgets } from '/__appshell/sdk.js';

const CITIES = {
  'Europe/London': 'London', 'America/New_York': 'New York', 'Asia/Tokyo': 'Tokyo',
  'Asia/Singapore': 'Singapore', 'Europe/Paris': 'Paris', 'America/Los_Angeles': 'Los Angeles',
  'Australia/Sydney': 'Sydney', 'Africa/Johannesburg': 'Johannesburg', 'Asia/Hong_Kong': 'Hong Kong',
  'Europe/Frankfurt': 'Frankfurt', 'Asia/Dubai': 'Dubai', 'Asia/Kolkata': 'Kolkata',
};
const home = Intl.DateTimeFormat().resolvedOptions().timeZone;
const defaultZones = ['Europe/London', 'America/New_York', 'Asia/Tokyo'];
if (home && !defaultZones.includes(home)) defaultZones.unshift(home);
let zones = (await storage.get('zones')) ?? defaultZones;

const time = (zone) => new Intl.DateTimeFormat([], { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(new Date());
const day = (zone) => new Intl.DateTimeFormat([], { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
const offset = (zone) => new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '';
const name = (zone) => CITIES[zone] ?? zone.split('/').pop().replaceAll('_', ' ');

function render() {
  document.getElementById('clocks').replaceChildren(...zones.map((zone) => {
    const li = document.createElement('li');
    if (zone === home) li.className = 'home';
    const city = Object.assign(document.createElement('div'), { className: 'city', textContent: name(zone) });
    const clock = Object.assign(document.createElement('div'), { className: 'time', textContent: time(zone) });
    const meta = Object.assign(document.createElement('div'), { className: 'meta', textContent: `${day(zone)}, ${offset(zone)}${zone === home ? ', your time zone' : ''}` });
    const remove = Object.assign(document.createElement('button'), { textContent: 'Remove' });
    remove.setAttribute('aria-label', `Remove ${name(zone)}`);
    remove.addEventListener('click', async () => { zones = zones.filter((z) => z !== zone); await storage.set('zones', zones); render(); });
    li.append(city, clock, meta, remove);
    return li;
  }));
  const select = document.getElementById('zone');
  select.replaceChildren(...Object.keys(CITIES).filter((z) => !zones.includes(z)).map((z) => new Option(CITIES[z], z)));
  widgets.update('clocks', { blocks: [{ type: 'list', items: zones.slice(0, 6).map((z) => ({ label: name(z), value: time(z) })) }] });
}

document.getElementById('add').addEventListener('submit', async (event) => {
  event.preventDefault();
  const zone = document.getElementById('zone').value;
  if (!zone || zones.includes(zone)) return;
  zones = [...zones, zone];
  await storage.set('zones', zones);
  render();
});

render();
setInterval(render, 15_000);
