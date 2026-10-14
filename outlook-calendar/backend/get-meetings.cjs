#!/usr/bin/env node
const { execSync } = require('child_process');
const os = require('os');

function getMeetingsMac() {
  const script = `
tell application "Microsoft Outlook"
  set todayStart to (current date)
  set time of todayStart to 0
  set todayEnd to todayStart + (24 * 60 * 60)
  set evs to (every calendar event whose start time >= todayStart and start time < todayEnd)
  set out to ""
  repeat with ev in evs
    set s to (start time of ev as string)
    set e to (end time of ev as string)
    set subj to (subject of ev)
    set loc to (location of ev)
    set out to out & subj & "||" & s & "||" & e & "||" & loc & "\\n"
  end repeat
  return out
end tell`;

  try {
    const raw = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { encoding: 'utf8' }).trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).map(line => {
      const [title, start, end, location] = line.split('||');
      return { title, start, end, location };
    });
  } catch (err) {
    return [{ error: "Failed to read Outlook on macOS: " + err.message }];
  }
}

function getMeetingsWindows() {
  const psScript = `
$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$calendar = $namespace.GetDefaultFolder(9)
$todayStart = (Get-Date).Date
$todayEnd = $todayStart.AddDays(1)
$filter = "[Start] >= '" + $todayStart.ToString("g") + "' AND [Start] < '" + $todayEnd.ToString("g") + "'"
$items = $calendar.Items
$items.IncludeRecurrences = $true
$items.Sort("[Start]")
$todayItems = $items.Restrict($filter)
$result = @()
foreach ($item in $todayItems) {
    $result += [PSCustomObject]@{
        title = $item.Subject
        start = $item.Start.ToString("yyyy-MM-dd HH:mm")
        end = $item.End.ToString("yyyy-MM-dd HH:mm")
        location = $item.Location
    }
}
$result | ConvertTo-Json -Compress
`;

  try {
    const raw = execSync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    return [{ error: "Failed to read Outlook on Windows: " + err.message }];
  }
}

function getMeetings() {
  const platform = os.platform();
  if (platform === 'darwin') return getMeetingsMac();
  if (platform === 'win32') return getMeetingsWindows();
  return [{ error: "Unsupported OS: " + platform }];
}

if (require.main === module) {
  const meetings = getMeetings();
  console.log(JSON.stringify(meetings, null, 2));
}

module.exports = { getMeetings };
