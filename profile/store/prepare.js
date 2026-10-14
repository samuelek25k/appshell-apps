(async () => {
  const set = (n, v) => { const f = document.querySelector(`[name=${n}]`); f.value = v; f.dispatchEvent(new Event('input', { bubbles: true })); };
  set('name', 'Maya Okafor'); set('email', 'maya@example.com'); set('role', 'Support lead');
  document.getElementById('form').requestSubmit();
  await new Promise((r) => setTimeout(r, 500));
})()
