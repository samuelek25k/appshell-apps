(async () => {
  const add = async (text) => {
    document.getElementById('text').value = text;
    document.getElementById('add').requestSubmit();
    await new Promise((r) => setTimeout(r, 150));
  };
  await add('Buy milk and groceries on the way home');
  await add('Book dentist appointment for next Tuesday at 10am');
  await add('Release checklist:\n- bump version in manifest.json\n- merge\n- tag the release');
})()
