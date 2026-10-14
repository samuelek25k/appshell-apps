(async () => {
  const add = async (text) => {
    document.getElementById('text').value = text;
    document.getElementById('add').requestSubmit();
    await new Promise((r) => setTimeout(r, 150));
  };
  await add('Check gate assignments for the evening wave before 17:00');
  await add('Ask the platform team about tenant config for the ops pilot');
  await add('Release checklist:\n- bump version in manifest.json\n- merge\n- tag the release');
})()
