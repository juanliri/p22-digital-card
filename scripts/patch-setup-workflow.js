const fs = require('fs');
const path = require('path');

const setupPath = path.join(process.cwd(), 'setup.html');
let content = fs.readFileSync(setupPath, 'utf8');

// 1. Upgrade staffAuthModal to include User Identity & Role selector
const oldAuthModalPattern = /<div id="staffAuthModal"[\s\S]*?<\/form>\s*<!-- Direct Link to Phone Badge/i;

const newAuthModalContent = `<div id="staffAuthModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/97 backdrop-blur-3xl transition-opacity duration-300">
    <div class="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative border border-p22gold/30 gold-glow">
      <div class="w-16 h-16 rounded-2xl bg-white/10 p-2 mx-auto mb-3 border border-white/20 shadow-lg flex items-center justify-center">
        <img src="logo.webp" alt="P-22 Corp Logo" class="w-full h-full object-contain" onerror="this.src='assets/branding/p22-logo-tight.png'">
      </div>
      <span class="px-3 py-1 rounded-full bg-p22gold/20 text-p22gold text-[10px] font-mono font-bold tracking-widest uppercase border border-p22gold/30">
        P-22 Corp Executive Portal
      </span>
      <h2 class="text-lg font-montserrat font-extrabold text-white mt-3 mb-1">Staff Setup &amp; Asset Studio</h2>
      <p class="text-xs text-slate-300 mb-5 leading-relaxed">
        Select your representative identity to load your personalized digital passes, NFC tools, and lead vault.
      </p>

      <form id="pinAuthForm" onsubmit="verifyStaffPin(event)" class="space-y-4 text-left">
        <!-- 1. Select Staff Member / Role -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5" for="loginUserSelect">Select Your Identity / Role *</label>
          <select id="loginUserSelect" required
                  class="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-white/20 text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-p22gold">
            <option value="" disabled selected>-- Choose Who You Are --</option>
            <option value="pedro">Pedro Felipe — Managing Director (Federal Contract Lead)</option>
            <option value="eduardo">Eduardo López — Director of Commercial Sales</option>
            <option value="marleni">Marleni Méndez — Director of Finance &amp; Compliance</option>
            <option value="bids">Government Procurement Desk — Federal RFQ Desk</option>
            <option value="logistics">Dallas Logistics Hub — Fleet &amp; Staging</option>
            <option value="admin">🛡️ Executive Master Admin — Full Multi-Profile Access</option>
          </select>
        </div>

        <!-- 2. Passcode -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5" for="staffPinInput">Access PIN / CAGE Code (169D8) *</label>
          <input type="password" id="staffPinInput" required placeholder="Enter CAGE (169D8) or PIN"
                 autocomplete="off"
                 class="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-white placeholder-slate-500 text-center font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-p22gold">
          <p id="pinAuthError" class="text-xs text-rose-400 mt-2 hidden font-semibold text-center"></p>
        </div>

        <button type="submit"
                class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-p22gold to-amber-500 text-slate-950 font-montserrat font-bold text-xs tracking-wide hover:brightness-110 active:scale-95 transition shadow btn-bounce flex items-center justify-center gap-2">
          <span>Unlock My Staff Setup Studio &rarr;</span>
        </button>
      </form>

      <!-- Direct Link to Phone Badge`;

if (oldAuthModalPattern.test(content)) {
  content = content.replace(oldAuthModalPattern, newAuthModalContent);
  console.log('[+] Replaced staffAuthModal with identity selector');
}

// 2. Add Photo Lightbox modal right after appleWalletModal or googleWalletModal
const lightboxHtml = `
  <!-- Lightbox Modal for Scanned Card Photos -->
  <div id="photoLightboxModal" class="hidden fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onclick="closePhotoLightbox()">
    <div class="relative max-w-lg w-full bg-slate-900 border border-p22gold/50 rounded-2xl p-4 shadow-2xl space-y-3" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between border-b border-white/10 pb-2">
        <h4 class="text-xs font-montserrat font-bold text-white flex items-center gap-1.5">
          <span class="text-p22gold">📷</span> Scanned Business Card / Badge Photo
        </h4>
        <button type="button" onclick="closePhotoLightbox()" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
      </div>
      <div class="rounded-xl overflow-hidden border border-white/10 max-h-[70vh] flex items-center justify-center bg-black/60 p-2">
        <img id="lightboxImg" class="max-w-full max-h-[65vh] object-contain rounded-lg">
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <a id="lightboxDownloadBtn" download="scanned_business_card.jpg" class="px-3 py-1.5 rounded-lg bg-p22gold/20 hover:bg-p22gold/30 text-p22gold text-xs font-bold font-montserrat transition">Download Photo</a>
        <button type="button" onclick="closePhotoLightbox()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition">Close</button>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="photoLightboxModal"')) {
  content = content.replace('<!-- Modal: Apple Wallet', `${lightboxHtml}\n  <!-- Modal: Apple Wallet`);
  console.log('[+] Inserted photoLightboxModal');
}

// 3. Upgrade Header to display personalized session bar with switch staff button
const oldHeaderPattern = /<header class="glass-panel rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">[\s\S]*?<\/header>/i;

const newHeaderContent = `<header class="glass-panel rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-white/10 p-1.5 flex items-center justify-center border border-white/20 shadow-sm shrink-0 overflow-hidden">
          <img id="sessionAvatar" src="logo.webp" alt="P-22 Corp Logo" class="w-full h-full object-contain" onerror="this.src='assets/branding/p22-logo-tight.png'">
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-montserrat font-extrabold tracking-wider text-p22gold uppercase block">P-22 Staff Studio</span>
            <span id="sessionRoleBadge" class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">Personalized</span>
          </div>
          <h1 id="sessionUserName" class="text-base sm:text-lg font-montserrat font-extrabold text-white">Pre-Expo Setup &amp; Asset Studio</h1>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="lockStaffHub()" title="Switch User or Lock"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-montserrat font-medium border border-white/10 transition btn-bounce">
          <svg class="w-3.5 h-3.5 text-p22gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4"/></svg>
          <span id="lockBtnText">Switch Staff</span>
        </button>
        <a data-badge-link href="/badge"
           class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-p22gold/20 hover:bg-p22gold/30 border border-p22gold/50 text-p22gold text-xs font-montserrat font-bold transition btn-bounce shadow">
          <svg class="w-3.5 h-3.5 text-p22gold" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          <span>Phone Badge &rarr;</span>
        </a>
        <a id="viewPublicCardBtn" href="/pedro" target="_blank"
           class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-p22gold text-slate-950 font-montserrat font-bold text-xs hover:brightness-110 active:scale-95 transition btn-bounce shadow">
          <span>View Public Card</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
    </header>`;

if (oldHeaderPattern.test(content)) {
  content = content.replace(oldHeaderPattern, newHeaderContent);
  console.log('[+] Replaced header with personalized session header');
}

// 4. Update the Table Head to include Card Photo
const oldTableHead = `<thead class="bg-white/5 text-[11px] font-montserrat font-bold text-slate-400 uppercase tracking-wider sticky top-0">
              <tr>
                <th class="p-2.5">Time</th>
                <th class="p-2.5">Rep</th>
                <th class="p-2.5">Name</th>
                <th class="p-2.5">Agency / Prime</th>
                <th class="p-2.5">Email</th>
                <th class="p-2.5">Phone</th>
                <th class="p-2.5">Scope / Notes</th>
              </tr>
            </thead>`;

const newTableHead = `<thead class="bg-white/5 text-[11px] font-montserrat font-bold text-slate-400 uppercase tracking-wider sticky top-0">
              <tr>
                <th class="p-2.5">Time</th>
                <th class="p-2.5">Rep</th>
                <th class="p-2.5">Name</th>
                <th class="p-2.5">Agency &amp; Website</th>
                <th class="p-2.5">Email</th>
                <th class="p-2.5">Phone</th>
                <th class="p-2.5 text-center">Card Photo</th>
                <th class="p-2.5">Scope / Notes</th>
              </tr>
            </thead>`;

if (content.includes(oldTableHead)) {
  content = content.replace(oldTableHead, newTableHead);
  console.log('[+] Updated leads table thead');
}

// 5. Upgrade renderLeadsTable & Auth functions in setup.html
const oldAuthAndTableFunctions = `    // ══════════════════════════════════════════════════════════════════════════
    // EXECUTIVE STAFF ACCESS GATE (CAGE PIN)
    // ══════════════════════════════════════════════════════════════════════════
    function checkStaffAuth() {
      const isAuth = sessionStorage.getItem('p22_staff_auth') === 'true';
      const modal = document.getElementById('staffAuthModal');
      const main = document.getElementById('setupMainContent');
      if (modal) {
        if (isAuth) {
          modal.classList.add('hidden');
          if (main) main.classList.remove('hidden');
          document.body.classList.remove('overflow-hidden');
        } else {
          modal.classList.remove('hidden');
          if (main) main.classList.add('hidden');
          document.body.classList.add('overflow-hidden');
          const input = document.getElementById('staffPinInput');
          if (input) setTimeout(() => input.focus(), 150);
        }
      }
    }

    function verifyStaffPin(e) {
      e.preventDefault();
      const input = document.getElementById('staffPinInput');
      const errorMsg = document.getElementById('pinAuthError');
      const val = (input ? input.value : '').trim().toUpperCase();

      // Accepted PINs: CAGE Code 169D8 or executive PIN 2222
      if (val === '169D8' || val === '2222') {
        sessionStorage.setItem('p22_staff_auth', 'true');
        if (errorMsg) errorMsg.classList.add('hidden');
        checkStaffAuth();
      } else {
        if (errorMsg) {
          errorMsg.textContent = 'Invalid passcode. Enter CAGE Code (169D8) or PIN.';
          errorMsg.classList.remove('hidden');
        }
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }

    function lockStaffHub() {
      sessionStorage.removeItem('p22_staff_auth');
      checkStaffAuth();
    }`;

const newAuthAndTableFunctions = `    // ══════════════════════════════════════════════════════════════════════════
    // LIGHTBOX CONTROLS FOR SCANNED BUSINESS CARDS
    // ══════════════════════════════════════════════════════════════════════════
    function openPhotoLightbox(src) {
      const modal = document.getElementById('photoLightboxModal');
      const img = document.getElementById('lightboxImg');
      const dl = document.getElementById('lightboxDownloadBtn');
      if (!modal || !img) return;
      img.src = src;
      if (dl) dl.href = src;
      modal.classList.remove('hidden');
    }

    function closePhotoLightbox() {
      const modal = document.getElementById('photoLightboxModal');
      if (modal) modal.classList.add('hidden');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ROLE-GATED EXECUTIVE STAFF ACCESS & PERSONALIZED WORKFLOW
    // ══════════════════════════════════════════════════════════════════════════
    function checkStaffAuth() {
      const isAuth = sessionStorage.getItem('p22_staff_auth') === 'true';
      const user = sessionStorage.getItem('p22_staff_user') || '';
      const role = sessionStorage.getItem('p22_staff_role') || (user === 'admin' ? 'admin' : 'staff');
      const modal = document.getElementById('staffAuthModal');
      const main = document.getElementById('setupMainContent');

      if (modal) {
        if (isAuth && user) {
          modal.classList.add('hidden');
          if (main) main.classList.remove('hidden');
          document.body.classList.remove('overflow-hidden');
          applyUserRoleView(user, role);
        } else {
          modal.classList.remove('hidden');
          if (main) main.classList.add('hidden');
          document.body.classList.add('overflow-hidden');
          const sel = document.getElementById('loginUserSelect');
          if (sel && user) sel.value = user;
          const input = document.getElementById('staffPinInput');
          if (input) setTimeout(() => input.focus(), 150);
        }
      }
    }

    function applyUserRoleView(user, role) {
      const isMasterAdmin = role === 'admin' || user === 'admin';
      const dropdownWrap = document.getElementById('teamSelect') ? document.getElementById('teamSelect').closest('.grid') : null;
      const sessionName = document.getElementById('sessionUserName');
      const sessionAvatar = document.getElementById('sessionAvatar');
      const sessionRoleBadge = document.getElementById('sessionRoleBadge');

      if (isMasterAdmin) {
        if (sessionName) sessionName.textContent = 'Executive Master Admin Studio';
        if (sessionRoleBadge) sessionRoleBadge.textContent = 'Master Admin (All Profiles)';
        if (sessionAvatar) sessionAvatar.src = 'logo.webp';

        // Show all profile switcher cards
        document.querySelectorAll('.profile-card').forEach(card => card.classList.remove('hidden'));
        if (dropdownWrap) dropdownWrap.classList.remove('hidden');

        selectStaffProfile(activeSlug || 'pedro');
      } else {
        const staffData = TEAM_DATA[user] || TEAM_DATA.pedro;
        if (sessionName) sessionName.textContent = \`\${staffData.name} — Setup Studio\`;
        if (sessionAvatar) sessionAvatar.src = staffData.avatar;
        if (sessionRoleBadge) sessionRoleBadge.textContent = staffData.title.split('&')[0].trim();

        // Scope view: show ONLY this staff card, hide other cards to prevent confusion
        document.querySelectorAll('.profile-card').forEach(card => {
          if (card.id === 'card-' + user) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
        // Hide multi-profile dropdown to keep page 100% focused on this staff
        if (dropdownWrap) dropdownWrap.classList.add('hidden');

        selectStaffProfile(user);
      }
    }

    function verifyStaffPin(e) {
      e.preventDefault();
      const userSelect = document.getElementById('loginUserSelect');
      const input = document.getElementById('staffPinInput');
      const errorMsg = document.getElementById('pinAuthError');
      const selectedUser = userSelect ? userSelect.value : '';
      const pin = (input ? input.value : '').trim().toUpperCase();

      if (!selectedUser) {
        if (errorMsg) {
          errorMsg.textContent = 'Please choose who you are from the dropdown list.';
          errorMsg.classList.remove('hidden');
        }
        return;
      }

      // Accepted PINs: CAGE Code 169D8, executive PIN 2222, or P22
      if (pin === '169D8' || pin === '2222' || pin === 'P22') {
        sessionStorage.setItem('p22_staff_auth', 'true');
        sessionStorage.setItem('p22_staff_user', selectedUser);
        sessionStorage.setItem('p22_staff_role', selectedUser === 'admin' ? 'admin' : 'staff');
        if (errorMsg) errorMsg.classList.add('hidden');
        checkStaffAuth();
      } else {
        if (errorMsg) {
          errorMsg.textContent = 'Invalid passcode. Enter CAGE Code (169D8) or PIN.';
          errorMsg.classList.remove('hidden');
        }
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }

    function lockStaffHub() {
      sessionStorage.removeItem('p22_staff_auth');
      sessionStorage.removeItem('p22_staff_user');
      sessionStorage.removeItem('p22_staff_role');
      checkStaffAuth();
    }`;

if (content.includes(oldAuthAndTableFunctions)) {
  content = content.replace(oldAuthAndTableFunctions, newAuthAndTableFunctions);
  console.log('[+] Replaced checkStaffAuth, verifyStaffPin, lockStaffHub');
}

// 6. Upgrade renderLeadsTable to show photo thumbnail and website link
const oldRenderLeadsTablePattern = /function renderLeadsTable\(\) \{[\s\S]*?tbody\.innerHTML = stored\.map\(lead => \{[\s\S]*?return `[\s\S]*?<\/tr>\s*`;\s*\}\)\.join\(''\);\s*\}/i;

const newRenderLeadsTable = `function renderLeadsTable() {
      const stored = getAllStoredLeads();
      const badge = document.getElementById('leadCountBadge');
      const tbody = document.getElementById('leadsTableBody');
      if (badge) badge.textContent = \`\${stored.length} Leads\`;
      if (!tbody) return;

      if (stored.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-slate-500 italic">No leads stored in this browser session yet. Tap "Scan Card (OCR)" to intake cards.</td></tr>';
        return;
      }

      tbody.innerHTML = stored.map(lead => {
        const timeStr = lead.timestamp ? new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
        const rep = lead.rep_name || lead.rep || 'Staff';
        const name = lead.client_name || lead.name || '—';
        const agency = lead.client_agency || lead.agency || '—';
        const website = lead.client_website || lead.website || '';
        const email = lead.client_email || lead.email || '—';
        const phone = lead.client_phone || lead.phone || '—';
        const scope = lead.interest || lead.notes || lead.source || 'General';
        
        let photoCell = '<span class="text-slate-500 font-mono text-[10px]">—</span>';
        const pUrl = lead.photo_url || lead.card_photo;
        if (pUrl && (pUrl.startsWith('data:image') || pUrl.startsWith('http'))) {
          photoCell = \`<img src="\${pUrl}" onclick="openPhotoLightbox('\${pUrl}')" class="w-9 h-6 object-cover rounded border border-p22gold/40 hover:scale-125 transition cursor-pointer shadow mx-auto" alt="Scanned Card" title="Click to enlarge photo">\`;
        }

        const agencyDisplay = website ? \`<div>\${agency}</div><a href="\${website.startsWith('http') ? website : 'https://' + website}" target="_blank" class="text-[10px] text-sky-400 hover:underline font-mono truncate max-w-[140px] block">\${website.replace(/^https?:\\/\\//, '')} &nearr;</a>\` : agency;

        return \`
          <tr class="hover:bg-white/5 transition">
            <td class="p-2.5 font-mono text-[11px] text-slate-400">\${timeStr}</td>
            <td class="p-2.5 text-slate-300 font-semibold text-[11px]">\${rep}</td>
            <td class="p-2.5 font-bold text-white">\${name}</td>
            <td class="p-2.5 text-p22gold font-semibold text-[11px]">\${agencyDisplay}</td>
            <td class="p-2.5 text-sky-300 font-mono text-[11px]">\${email}</td>
            <td class="p-2.5 text-slate-300 font-mono text-[11px]">\${phone}</td>
            <td class="p-2.5 text-center">\${photoCell}</td>
            <td class="p-2.5 text-[11px] text-slate-300 truncate max-w-xs" title="\${scope}">\${scope}</td>
          </tr>
        \`;
      }).join('');
    }`;

if (oldRenderLeadsTablePattern.test(content)) {
  content = content.replace(oldRenderLeadsTablePattern, newRenderLeadsTable);
  console.log('[+] Upgraded renderLeadsTable with card photo preview & website');
}

fs.writeFileSync(setupPath, content, 'utf8');
console.log('[+] setup.html patched successfully!');
