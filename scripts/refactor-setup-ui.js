const fs = require('fs');
const path = require('path');

const setupPath = path.join(__dirname, '..', 'setup.html');
let html = fs.readFileSync(setupPath, 'utf8');

// Switch Profile Modal HTML
const switchProfileModalHtml = `
  <!-- Modal: Switch Active Staff Profile -->
  <div id="switchProfileModal" class="hidden fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/92 backdrop-blur-md" onclick="if(event.target===this) closeSwitchProfileModal()">
    <div class="glass-panel w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative border border-p22gold/40 max-h-[92dvh] overflow-y-auto" style="overscroll-behavior:contain;">
      <!-- Sticky Close Bar -->
      <div class="modal-close-bar sticky top-0 z-20 rounded-t-3xl bg-[#0F1E33]/95 backdrop-blur px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-p22gold/20 text-p22gold flex items-center justify-center font-bold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4"/></svg>
          </div>
          <div>
            <h3 class="text-sm font-montserrat font-extrabold text-white">Switch Representative Profile</h3>
            <p class="text-xs text-p22gold font-medium">Select an identity below to load personalized passes, visuals, and tools</p>
          </div>
        </div>
        <button onclick="closeSwitchProfileModal()" class="text-slate-400 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition" aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- 5-Card Profile Selector Grid -->
      <div class="space-y-4 pt-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="profileGrid">
          <!-- Pedro -->
          <button type="button" onclick="selectStaffProfile('pedro')" id="card-pedro"
                  class="profile-card text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-p22gold/50 transition btn-bounce flex items-center gap-3.5 group">
            <img src="/assets/staff/pedro-official-1x1.png" alt="Pedro Felipe" class="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-white/20 shrink-0 group-hover:scale-105 transition">
            <div class="min-w-0">
              <h4 class="text-xs font-montserrat font-bold text-white truncate">Pedro Felipe</h4>
              <p class="text-[10px] text-p22gold font-medium truncate">Managing Director &amp; Federal Lead</p>
              <span class="text-[9px] text-slate-400 font-mono">pfelipe@p22corp.com</span>
            </div>
          </button>

          <!-- Eduardo -->
          <button type="button" onclick="selectStaffProfile('eduardo')" id="card-eduardo"
                  class="profile-card text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-p22gold/50 transition btn-bounce flex items-center gap-3.5 group">
            <img src="/assets/staff/eduardo-official-1x1.png" alt="Eduardo López" class="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-white/20 shrink-0 group-hover:scale-105 transition">
            <div class="min-w-0">
              <h4 class="text-xs font-montserrat font-bold text-white truncate">Eduardo López</h4>
              <p class="text-[10px] text-p22gold font-medium truncate">Commercial Sales &amp; Material Supply</p>
              <span class="text-[9px] text-slate-400 font-mono">elopez@p22corp.com</span>
            </div>
          </button>

          <!-- Marleni -->
          <button type="button" onclick="selectStaffProfile('marleni')" id="card-marleni"
                  class="profile-card text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-p22gold/50 transition btn-bounce flex items-center gap-3.5 group">
            <img src="/assets/staff/marleni-official-1x1.png" alt="Marleni Méndez" class="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-white/20 shrink-0 group-hover:scale-105 transition">
            <div class="min-w-0">
              <h4 class="text-xs font-montserrat font-bold text-white truncate">Marleni Méndez</h4>
              <p class="text-[10px] text-p22gold font-medium truncate">Finance &amp; Contract Compliance</p>
              <span class="text-[9px] text-slate-400 font-mono">mmendez@p22corp.com</span>
            </div>
          </button>

          <!-- Bids -->
          <button type="button" onclick="selectStaffProfile('bids')" id="card-bids"
                  class="profile-card text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-p22gold/50 transition btn-bounce flex items-center gap-3.5 group">
            <img src="/assets/staff/bids-official-1x1.png" alt="Bids Desk" class="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-white/20 shrink-0 group-hover:scale-105 transition">
            <div class="min-w-0">
              <h4 class="text-xs font-montserrat font-bold text-white truncate">Government Procurement</h4>
              <p class="text-[10px] text-p22gold font-medium truncate">Federal Procurement &amp; Rapid RFQ</p>
              <span class="text-[9px] text-slate-400 font-mono">bids@p22corp.com</span>
            </div>
          </button>

          <!-- Logistics -->
          <button type="button" onclick="selectStaffProfile('logistics')" id="card-logistics"
                  class="profile-card text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-p22gold/50 transition btn-bounce flex items-center gap-3.5 group">
            <img src="/assets/staff/logistics-official-1x1.png" alt="Logistics Hub" class="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-white/20 shrink-0 group-hover:scale-105 transition">
            <div class="min-w-0">
              <h4 class="text-xs font-montserrat font-bold text-white truncate">Dallas Logistics Hub</h4>
              <p class="text-[10px] text-p22gold font-medium truncate">Central Staging &amp; Fleet Logistics</p>
              <span class="text-[9px] text-slate-400 font-mono">logistics@p22corp.com</span>
            </div>
          </button>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5" for="teamSelect">Quick Dropdown Selector</label>
          <select id="teamSelect" onchange="onTeamMemberChange(this.value)"
                  class="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-white/20 text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-p22gold">
            <option value="" disabled selected>-- Select a Team Representative --</option>
            <option value="pedro">Pedro Felipe — Managing Director &amp; Federal Contract Lead</option>
            <option value="eduardo">Eduardo López — Director of Commercial Sales &amp; Material Supply</option>
            <option value="marleni">Marleni Méndez — Director of Finance &amp; Contract Compliance</option>
            <option value="bids">Government Procurement Desk — Federal Procurement &amp; Rapid RFQ Desk</option>
            <option value="logistics">Dallas Logistics Hub — Central Material Staging &amp; Fleet Logistics</option>
          </select>
        </div>
      </div>
    </div>
  </div>
`;

// Insert switchProfileModal right before `<main id="setupMainContent"`
if (!html.includes('id="switchProfileModal"')) {
  html = html.replace(/<main id="setupMainContent"/, switchProfileModalHtml + '\n  <main id="setupMainContent"');
}

// Replace Profile Selector section with Executive Profile Header + 4-Tab Nav
const executiveHeaderAndTabsHtml = `
    <!-- Executive Representative Header (Compact Bar Replacing 10,000px Scrolling) -->
    <section class="glass-panel rounded-3xl p-5 shadow-2xl space-y-3.5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div class="flex items-center gap-3.5">
          <img id="bannerAvatar" src="/assets/staff/pedro-official-1x1.png" alt="Avatar" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-slate-900 border-2 border-p22gold/60 shadow-lg shrink-0">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full bg-p22gold/20 text-p22gold text-[10px] font-mono font-bold uppercase border border-p22gold/30">CAGE 169D8</span>
              <span id="bannerRepRoleTag" class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">Active Staff</span>
            </div>
            <h3 id="bannerName" class="text-base sm:text-lg font-montserrat font-extrabold text-white truncate mt-0.5">Pedro Felipe</h3>
            <p id="bannerTitle" class="text-xs text-p22gold font-medium truncate">Managing Director &amp; Federal Contract Lead</p>
            <p id="bannerContact" class="text-[11px] text-slate-400 font-mono mt-0.5 truncate">pfelipe@p22corp.com &bull; 1-888-722-2675</p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button type="button" onclick="openSwitchProfileModal()"
                  class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-montserrat font-bold text-xs border border-white/20 transition btn-bounce flex items-center gap-1.5 shadow">
            <svg class="w-3.5 h-3.5 text-p22gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            <span>Switch Profile</span>
          </button>
          <a id="viewPublicCardBtn" href="/pedro" target="_blank"
             class="px-3.5 py-2 rounded-xl bg-p22gold text-slate-950 font-montserrat font-bold text-xs hover:brightness-110 active:scale-95 transition btn-bounce shadow flex items-center gap-1.5">
            <span>View Card</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      </div>

      <!-- Quick Share URL Bar -->
      <div class="pt-2.5 border-t border-white/10 flex items-center gap-2">
        <span class="text-xs text-slate-400 font-medium shrink-0">Your Card Link:</span>
        <input type="text" id="personalCardUrl" readonly placeholder="Generating link..."
               class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs font-mono text-p22gold focus:outline-none">
        <button onclick="copyCardUrl()" title="Copy Link"
                class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-montserrat font-bold transition shrink-0 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-p22gold" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          <span>Copy</span>
        </button>
      </div>
    </section>

    <!-- Segmented Setup Navigation Bar (Sticky 4-Tab Control) -->
    <nav id="setupTabs" class="w-full glass-panel rounded-2xl p-1.5 flex items-center gap-1.5 shadow-xl border border-white/10 sticky top-2 z-30 overflow-x-auto">
      <button type="button" onclick="switchSetupTab('passes')" id="tabBtn-passes"
              class="tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-montserrat font-bold transition flex items-center justify-center gap-1.5 bg-p22gold text-slate-950 shadow-md">
        <span>📱 Passes &amp; Contacts</span>
      </button>
      <button type="button" onclick="switchSetupTab('visuals')" id="tabBtn-visuals"
              class="tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-montserrat font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-1.5">
        <span>🎨 Digital Visuals</span>
      </button>
      <button type="button" onclick="switchSetupTab('signature')" id="tabBtn-signature"
              class="tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-montserrat font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-1.5">
        <span>✉️ Email Signature</span>
      </button>
      <button type="button" onclick="switchSetupTab('telemetry')" id="tabBtn-telemetry"
              class="tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-montserrat font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-1.5">
        <span>📊 Telemetry &amp; Vault</span>
      </button>
    </nav>
`;

// Extract sections using regex
const tool1Match = html.match(/<!-- Tool 1: Digital Wallets[\s\S]*?<\/section>/);
const nfcMatch = html.match(/<!-- Tool 4: Physical NFC Card[\s\S]*?<\/section>/);
const lockscreenMatch = html.match(/<!-- Tool 2: Offline Failsafe Lock Screen Poster[\s\S]*?<\/section>/);
const watchCanvasMatch = html.match(/<!-- Tool 3: Secondary Fallback: Apple Watch Photo Clock Face[\s\S]*?<\/section>/);
const virtualBgMatch = html.match(/<!-- Tool 3: 1080p Zoom & Teams Virtual Background[\s\S]*?<\/section>/);
const signatureMatch = html.match(/<!-- Tool 2: 1-Click Email Signature Studio[\s\S]*?<\/section>/);
const telemetryMatch = html.match(/<!-- LIVE TELEMETRY & GOOGLE SHEETS ANALYTICS HUB[\s\S]*?<\/section>/);
const leadVaultMatch = html.match(/<!-- Tool 4: Expo Lead Capture Vault[\s\S]*?<\/section>/);

if (tool1Match && nfcMatch && lockscreenMatch && watchCanvasMatch && virtualBgMatch && signatureMatch && telemetryMatch && leadVaultMatch) {
  const panelPasses = `
    <!-- TAB PANEL 1: PASSES & CONTACTS -->
    <div id="panel-passes" class="tab-panel space-y-6">
      ${tool1Match[0]}
      ${nfcMatch[0]}
    </div>
  `;

  const panelVisuals = `
    <!-- TAB PANEL 2: DIGITAL VISUALS -->
    <div id="panel-visuals" class="tab-panel hidden space-y-6">
      ${lockscreenMatch[0]}
      ${watchCanvasMatch[0]}
      ${virtualBgMatch[0]}
    </div>
  `;

  const panelSignature = `
    <!-- TAB PANEL 3: EMAIL SIGNATURE -->
    <div id="panel-signature" class="tab-panel hidden space-y-6">
      ${signatureMatch[0]}
    </div>
  `;

  const panelTelemetry = `
    <!-- TAB PANEL 4: TELEMETRY & LEAD VAULT -->
    <div id="panel-telemetry" class="tab-panel hidden space-y-6">
      ${telemetryMatch[0]}
      ${leadVaultMatch[0]}
    </div>
  `;

  const mainContentStart = html.indexOf('<!-- Staff Selector & Telemetry Section -->');
  const mainContentEnd = html.indexOf('</main>');

  if (mainContentStart !== -1 && mainContentEnd !== -1) {
    const newMainBody = executiveHeaderAndTabsHtml + '\n' + panelPasses + '\n' + panelVisuals + '\n' + panelSignature + '\n' + panelTelemetry + '\n';
    html = html.slice(0, mainContentStart) + newMainBody + html.slice(mainContentEnd);
    console.log('[+] Main content successfully reorganized into 4 tabs!');
  } else {
    console.error('[-] Could not find main content boundaries');
  }
} else {
  console.error('[-] Could not match all sections');
}

// 2. Add JavaScript helper functions
const jsFunctions = `
    function switchSetupTab(tabId) {
      const tabs = ['passes', 'visuals', 'signature', 'telemetry'];
      if (!tabs.includes(tabId)) tabId = 'passes';
      sessionStorage.setItem('p22_setup_tab', tabId);

      tabs.forEach(t => {
        const panel = document.getElementById('panel-' + t);
        const btn = document.getElementById('tabBtn-' + t);
        if (panel) {
          if (t === tabId) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        }
        if (btn) {
          if (t === tabId) {
            btn.className = 'tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-montserrat font-bold transition flex items-center justify-center gap-1.5 bg-p22gold text-slate-950 shadow-md';
          } else {
            btn.className = 'tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-montserrat font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-1.5';
          }
        }
      });

      // When entering visuals or signature tab, ensure canvases and signature box are re-drawn
      const rep = TEAM_DATA[activeSlug] || TEAM_DATA.pedro;
      if (rep) {
        if (tabId === 'visuals') {
          renderWatchFace(rep);
          renderVirtualBg(rep);
        } else if (tabId === 'signature') {
          renderEmailSignature(rep);
        }
      }
    }

    function openSwitchProfileModal() {
      const modal = document.getElementById('switchProfileModal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeSwitchProfileModal() {
      const modal = document.getElementById('switchProfileModal');
      if (modal) modal.classList.add('hidden');
    }
`;

if (!html.includes('function switchSetupTab(')) {
  html = html.replace(/function selectStaffProfile\(slug\) \{/, jsFunctions + '\n    function selectStaffProfile(slug) {');
}

// Update verifyStaffPin
const newVerifyStaffPin = `    function verifyStaffPin(e) {
      e.preventDefault();
      const input = document.getElementById('staffPinInput');
      const errorMsg = document.getElementById('pinAuthError');
      const userSelect = document.getElementById('loginUserSelect');
      const val = (input ? input.value : '').trim().toUpperCase();

      // Accepted PINs: CAGE Code 169D8 or executive PIN 2222
      if (val === '169D8' || val === '2222') {
        sessionStorage.setItem('p22_staff_auth', 'true');
        const chosen = (userSelect && userSelect.value) ? userSelect.value : 'pedro';
        sessionStorage.setItem('p22_active_rep', chosen);
        activeSlug = chosen;
        if (errorMsg) errorMsg.classList.add('hidden');
        checkStaffAuth();
        selectStaffProfile(chosen);
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
    }`;

html = html.replace(/function verifyStaffPin\(e\) \{[\s\S]*?input\.focus\(\);\s*\}\s*\}\s*\}/, newVerifyStaffPin);

// Update checkStaffAuth
const newCheckStaffAuth = `    function checkStaffAuth() {
      const isAuth = sessionStorage.getItem('p22_staff_auth') === 'true';
      const modal = document.getElementById('staffAuthModal');
      const main = document.getElementById('setupMainContent');
      if (modal) {
        if (isAuth) {
          modal.classList.add('hidden');
          if (main) main.classList.remove('hidden');
          document.body.classList.remove('overflow-hidden');
          const savedRep = sessionStorage.getItem('p22_active_rep');
          const repToLoad = urlParams.get('rep') || savedRep || 'pedro';
          selectStaffProfile(repToLoad);
          const savedTab = sessionStorage.getItem('p22_setup_tab') || 'passes';
          switchSetupTab(savedTab);
        } else {
          modal.classList.remove('hidden');
          if (main) main.classList.add('hidden');
          document.body.classList.add('overflow-hidden');
          const input = document.getElementById('staffPinInput');
          if (input) setTimeout(() => input.focus(), 150);
        }
      }
    }`;

html = html.replace(/function checkStaffAuth\(\) \{[\s\S]*?input\.focus\(\), 150\);\s*\}\s*\}\s*\}/, newCheckStaffAuth);

// Update selectStaffProfile to save sessionStorage and close modal
const newSelectStaffProfile = `    function selectStaffProfile(slug) {
      if (!TEAM_DATA[slug]) slug = 'pedro';
      activeSlug = slug;
      sessionStorage.setItem('p22_active_rep', slug);
      const select = document.getElementById('teamSelect');
      if (select) select.value = slug;

      // Highlight active profile card
      document.querySelectorAll('.profile-card').forEach(card => {
        card.classList.remove('ring-2', 'ring-p22gold', 'bg-p22gold/10');
      });
      const activeCard = document.getElementById('card-' + slug);
      if (activeCard) {
        activeCard.classList.add('ring-2', 'ring-p22gold', 'bg-p22gold/10');
      }

      // Update URL query string without page reload
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('rep', slug);
      window.history.replaceState({}, '', newUrl);

      syncBadgeLinks();
      renderActiveMember(slug);
      closeSwitchProfileModal();
    }`;

html = html.replace(/function selectStaffProfile\(slug\) \{[\s\S]*?renderActiveMember\(slug\);\s*\}/, newSelectStaffProfile);

// Write back to setup.html
fs.writeFileSync(setupPath, html, 'utf8');
console.log('[✓] setup.html successfully updated!');
