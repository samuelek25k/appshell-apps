(async () => {
  const add = async (text) => {
    document.getElementById('text').value = text;
    document.getElementById('add').requestSubmit();
    await new Promise((r) => setTimeout(r, 150));
  };
  await add('Buy milk and coffee beans');
  await add('Book a dentist appointment');
  await add('Release checklist:\n- bump version in manifest.json\n- merge\n- tag the release');
})()
