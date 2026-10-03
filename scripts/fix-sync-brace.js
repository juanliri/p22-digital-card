const fs = require('fs');
const path = require('path');

const setupPath = path.join(__dirname, '..', 'setup.html');
let html = fs.readFileSync(setupPath, 'utf8');

const target = `      document.querySelectorAll('[data-badge-link]').forEach(function (a) {
        a.href = '/badge/' + rep + '?install=1';
      });
    async function loadTeamData()`;

const fix = `      document.querySelectorAll('[data-badge-link]').forEach(function (a) {
        a.href = '/badge/' + rep + '?install=1';
      });
    }

    async function loadTeamData()`;

html = html.replace(/\s*document\.querySelectorAll\('\[data-badge-link\]'\)\.forEach\(function \(a\) \{\s*a\.href = '\/badge\/' \+ rep \+ '\?install=1';\s*\}\);\s*async function loadTeamData\(\)/, `
      document.querySelectorAll('[data-badge-link]').forEach(function (a) {
        a.href = '/badge/' + rep + '?install=1';
      });
    }

    async function loadTeamData()`);

fs.writeFileSync(setupPath, html, 'utf8');
console.log('[✓] Successfully fixed missing brace in syncBadgeLinks!');
