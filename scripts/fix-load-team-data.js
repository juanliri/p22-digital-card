const fs = require('fs');
const path = require('path');

const setupPath = path.join(__dirname, '..', 'setup.html');
let html = fs.readFileSync(setupPath, 'utf8');

const regex = /\} catch \(err\) \{\s*console\.warn\('Fallback to local TEAM_DATA', err\);[\s\S]*?document\.getElementById\('viewPublicCardBtn'\)\.href = "#";\s*\}\s*\}\s*\}/;

const fix = `async function loadTeamData() {
      try {
        const res = await fetch('team.json');
        if (res.ok) {
          const remoteData = await res.json();
          TEAM_DATA = Object.assign({}, TEAM_DATA, remoteData);
        }
      } catch (err) {
        console.warn('Fallback to local TEAM_DATA', err);
      }
      const savedRep = sessionStorage.getItem('p22_active_rep');
      const repToLoad = activeSlug || savedRep || 'pedro';
      if (repToLoad && TEAM_DATA[repToLoad]) {
        selectStaffProfile(repToLoad);
      }
    }`;

if (regex.test(html)) {
  html = html.replace(regex, fix);
  fs.writeFileSync(setupPath, html, 'utf8');
  console.log('[✓] Successfully fixed loadTeamData in setup.html!');
} else {
  console.log('Regex did not match.');
}
