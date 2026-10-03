const fs = require('fs');
const path = require('path');

const setupPath = path.join(__dirname, '..', 'setup.html');
let html = fs.readFileSync(setupPath, 'utf8');

// 1. Add onchange to loginUserSelect
html = html.replace(
  '<select id="loginUserSelect" required',
  '<select id="loginUserSelect" required onchange="onLoginUserSelect(this.value)"'
);

// 2. Add onclick to Install My Badge
html = html.replace(
  /<a data-badge-link href="\/badge" class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-p22gold\/20 hover:bg-p22gold\/30 border border-p22gold\/50 text-p22gold font-montserrat font-bold text-xs transition btn-bounce">/,
  '<a id="loginBadgeLink" data-badge-link href="/badge/pedro?install=1" onclick="handleLoginBadgeClick(event)" class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-p22gold/20 hover:bg-p22gold/30 border border-p22gold/50 text-p22gold font-montserrat font-bold text-xs transition btn-bounce">'
);

// 3. Update syncBadgeLinks and add onLoginUserSelect & handleLoginBadgeClick
const newSyncFunctions = `
    function onLoginUserSelect(val) {
      if (!val) return;
      activeSlug = val;
      sessionStorage.setItem('p22_active_rep', val);
      syncBadgeLinks();
    }

    function handleLoginBadgeClick(e) {
      const sel = document.getElementById('loginUserSelect');
      let rep = (sel && sel.value) ? sel.value : (activeSlug || '');
      if (!rep) {
        if (sel) {
          sel.focus();
          sel.classList.add('ring-2', 'ring-p22gold');
        }
        rep = 'pedro';
      }
      sessionStorage.setItem('p22_active_rep', rep);
      window.location.href = '/badge/' + rep + '?install=1';
      if (e) e.preventDefault();
    }

    function syncBadgeLinks() {
      const sel = document.getElementById('loginUserSelect');
      const rep = activeSlug || (sel && sel.value) || sessionStorage.getItem('p22_active_rep') || 'pedro';
      document.querySelectorAll('[data-badge-link]').forEach(function (a) {
        a.href = '/badge/' + rep + '?install=1';
      });
    }
`;

html = html.replace(/function syncBadgeLinks\(\) \{[\s\S]*?\}\s*\}/, newSyncFunctions.trim());

fs.writeFileSync(setupPath, html, 'utf8');
console.log('[✓] setup.html badge sync and auto-setup updated successfully!');
