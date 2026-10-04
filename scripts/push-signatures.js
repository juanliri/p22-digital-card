/**
 * ==============================================================================
 * P-22 CORP — GOOGLE WORKSPACE DOMAIN-WIDE DELEGATION EMAIL SIGNATURE ENGINE
 * Script: scripts/push-signatures.js
 *
 * Dynamically discovers active domain users & aliases, extracts the official
 * defense contractor signature template, compiles responsive inline-styled
 * HTML email signatures with live dynamic QR codes & badge routing, and pushes
 * them directly to Gmail via Domain-Wide Delegation (DWD).
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { google } = require('googleapis');

// Configuration Paths
const SA_KEY_PATH = path.resolve(__dirname, '../credentials/google-sa.json');
const TEAM_JSON_PATH = path.resolve(__dirname, '../team.json');
const SETUP_HTML_PATH = path.resolve(__dirname, '../setup.html');
const PACKAGE_JSON_PATH = path.resolve(__dirname, '../package.json');

// CLI Arguments
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run');
const FORCE_DEPLOY = args.includes('--deploy') || args.includes('--force');

// Scopes required for Gmail signature deployment & directory audit
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];
const DIRECTORY_SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
];

/**
 * Step 0: Dynamic Domain & Environment Detection (Zero Hardcoding)
 */
function detectActiveDomain(saKey) {
  if (process.env.WORKSPACE_DOMAIN) {
    return process.env.WORKSPACE_DOMAIN.toLowerCase().trim();
  }

  const domainScores = {};
  const recordDomain = (domain) => {
    if (!domain || domain.includes('iam.gserviceaccount.com') || domain.includes('google.com')) return;
    domainScores[domain] = (domainScores[domain] || 0) + 1;
  };

  // Inspect team.json
  if (fs.existsSync(TEAM_JSON_PATH)) {
    try {
      const teamData = JSON.parse(fs.readFileSync(TEAM_JSON_PATH, 'utf8'));
      Object.values(teamData).forEach((rep) => {
        if (rep.email && rep.email.includes('@')) {
          recordDomain(rep.email.split('@')[1].toLowerCase().trim());
        }
      });
    } catch (e) {
      // Non-fatal
    }
  }

  // Inspect setup.html
  if (fs.existsSync(SETUP_HTML_PATH)) {
    try {
      const content = fs.readFileSync(SETUP_HTML_PATH, 'utf8');
      const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
      emailMatches.forEach((m) => {
        const parts = m.split('@');
        if (parts.length === 2) recordDomain(parts[1].toLowerCase().trim());
      });
    } catch (e) {
      // Non-fatal
    }
  }

  // Sort domains by frequency
  const sortedDomains = Object.entries(domainScores).sort((a, b) => b[1] - a[1]);
  if (sortedDomains.length > 0) {
    return sortedDomains[0][0];
  }

  return 'p22corp.com';
}

/**
 * Dynamically extract company credentials and visual tokens
 */
function extractCompanyProfile(detectedDomain) {
  let credentials = {
    companyName: 'P-22 CORP CONSTRUCTION MATERIAL SOLUTIONS LLC',
    uei: 'X3HUQZ66P6N3',
    cage: '169D8',
    address: '18383 Preston Rd, Ste 202, Dallas, TX 75252',
    mainPhone: '1-888-722-2675',
    website: `https://www.${detectedDomain}`,
    logoUrl: 'https://card.p22corp.com/assets/branding/p22-logo-tight.png',
    capabilityUrl: 'https://card.p22corp.com/capability-statement',
  };

  // Parse setup.html for live values if available
  if (fs.existsSync(SETUP_HTML_PATH)) {
    const html = fs.readFileSync(SETUP_HTML_PATH, 'utf8');
    const ueiMatch = html.match(/UEI:\s*([A-Z0-9]+)/i);
    const cageMatch = html.match(/CAGE:\s*([A-Z0-9]+)/i);
    const addrMatch = html.match(/18383\s+Preston[^<]+/i);
    if (ueiMatch) credentials.uei = ueiMatch[1].trim();
    if (cageMatch) credentials.cage = cageMatch[1].trim();
    if (addrMatch) credentials.address = addrMatch[0].replace(/&bull;/g, '').trim();
  }

  return credentials;
}

/**
 * Collect Candidate Rep Profiles from Repo (team.json, setup.html, git)
 */
function discoverCandidateReps(detectedDomain) {
  const repsByEmail = {};

  // 1. From team.json
  if (fs.existsSync(TEAM_JSON_PATH)) {
    try {
      const team = JSON.parse(fs.readFileSync(TEAM_JSON_PATH, 'utf8'));
      Object.entries(team).forEach(([key, val]) => {
        if (val.email && val.email.includes(`@${detectedDomain}`)) {
          repsByEmail[val.email.toLowerCase().trim()] = {
            slug: val.slug || key,
            name: val.name,
            title: val.title,
            email: val.email.toLowerCase().trim(),
            directPhone: val.directPhone || val.phone || '1-945-218-5896',
            avatar: val.avatar || '',
            aliases: [],
          };
        }
      });
    } catch (e) {
      console.warn('[!] Failed to parse team.json:', e.message);
    }
  }

  // 2. From setup.html TEAM_DATA object
  if (fs.existsSync(SETUP_HTML_PATH)) {
    try {
      const html = fs.readFileSync(SETUP_HTML_PATH, 'utf8');
      const teamDataMatch = html.match(/let\s+TEAM_DATA\s*=\s*(\{[\s\S]*?\n\s*\};)/);
      if (teamDataMatch) {
        try {
          // Clean loose JS into parsable JSON or eval safely
          const cleanObj = teamDataMatch[1]
            .replace(/;\s*$/, '')
            .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
            .replace(/'/g, '"');
          const parsed = JSON.parse(cleanObj);
          Object.entries(parsed).forEach(([key, val]) => {
            const email = (val.email || '').toLowerCase().trim();
            if (email && email.includes(`@${detectedDomain}`)) {
              if (!repsByEmail[email]) {
                repsByEmail[email] = {
                  slug: val.slug || key,
                  name: val.name,
                  title: val.title,
                  email,
                  directPhone: val.directPhone || val.phone || '1-945-218-5896',
                  avatar: val.avatar || '',
                  aliases: [],
                };
              }
            }
          });
        } catch (jsonErr) {
          // Regex extraction fallback
          const blockRegex = /slug:\s*["']([^"']+)["'],[\s\S]*?name:\s*["']([^"']+)["'],[\s\S]*?title:\s*["']([^"']+)["'],[\s\S]*?email:\s*["']([^"']+)["']/g;
          let m;
          while ((m = blockRegex.exec(html)) !== null) {
            const email = m[4].toLowerCase().trim();
            if (email.includes(`@${detectedDomain}`) && !repsByEmail[email]) {
              repsByEmail[email] = {
                slug: m[1],
                name: m[2],
                title: m[3],
                email,
                directPhone: '1-945-218-5896',
                aliases: [],
              };
            }
          }
        }
      }
    } catch (e) {
      // Non-fatal
    }
  }

  // 3. Scan scripts and repo files for additional domain emails (e.g., CTO, administrators)
  try {
    const searchDirs = [
      path.resolve(__dirname, '../scripts'),
      path.resolve(__dirname, '../docs'),
      path.resolve(__dirname, '..'),
    ];

    const emailRegex = new RegExp(`[a-zA-Z0-9._%+-]+@${detectedDomain.replace('.', '\\.')}`, 'gi');
    searchDirs.forEach((dir) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        if (!file.endsWith('.js') && !file.endsWith('.json') && !file.endsWith('.md')) return;
        const filePath = path.join(dir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.match(emailRegex) || [];
          matches.forEach((m) => {
            const email = m.toLowerCase().trim();
            if (!repsByEmail[email]) {
              const prefix = email.split('@')[0];
              let name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
              let title = 'Executive Lead';
              let directPhone = '1-888-722-2675';
              let slug = prefix;

              if (prefix === 'jliriano') {
                name = 'Juan Liriano';
                title = 'Chief Technology Officer';
                slug = 'jliriano';
              } else if (prefix === 'pfelipe') {
                name = 'Pedro Felipe';
                title = 'Managing Director & Federal Contract Lead';
                slug = 'pedro';
              } else if (prefix === 'elopez') {
                name = 'Eduardo Lopez';
                title = 'Director of Commercial Sales & Material Supply';
                slug = 'eduardo';
              } else if (prefix === 'mmendez') {
                name = 'Marleni Mendez';
                title = 'Director of Finance & Contract Compliance';
                slug = 'marleni';
              }

              repsByEmail[email] = {
                slug,
                name,
                title,
                email,
                directPhone,
                aliases: [],
              };
            }
          });
        } catch (e) {}
      });
    });
  } catch (e) {}

  // 4. Dynamically discover repository authors / leads from git commit logs
  try {
    const gitAuthors = execSync('git log --format="%an|%ae" -n 50', { encoding: 'utf8' });
    const lines = gitAuthors.split('\n');
    lines.forEach((line) => {
      const [authorName, authorEmail] = line.split('|').map((s) => (s || '').trim());
      if (authorEmail && authorEmail.includes(`@${detectedDomain}`)) {
        const normEmail = authorEmail.toLowerCase();
        if (!repsByEmail[normEmail]) {
          const userPrefix = normEmail.split('@')[0];
          repsByEmail[normEmail] = {
            slug: userPrefix,
            name: authorName || 'Staff Lead',
            title: 'Chief Technology Officer',
            email: normEmail,
            directPhone: '1-888-722-2675',
            aliases: [],
          };
        }
      }
    });
  } catch (e) {
    // Non-fatal if git not found
  }

  return repsByEmail;
}

/**
 * Attempt Google Directory API (admin.directory.user.list) if delegated
 */
async function auditDirectoryUsers(saKey, detectedDomain) {
  try {
    const jwt = new google.auth.JWT({
      email: saKey.client_email,
      key: saKey.private_key,
      scopes: DIRECTORY_SCOPES,
      subject: `admin@${detectedDomain}`,
    });
    const admin = google.admin({ version: 'directory_v1', auth: jwt });
    const res = await admin.users.list({ domain: detectedDomain });
    return res.data.users || [];
  } catch (err) {
    // Expected when Workspace Admin has restricted delegation solely to Gmail API
    return null;
  }
}

/**
 * Verify active mailbox accounts & harvest all configured SendAs addresses
 */
async function verifyActiveMailboxes(saKey, candidateReps, detectedDomain) {
  const verifiedAccounts = [];
  const candidateEmails = Object.keys(candidateReps);

  console.log(`[🔍] Probing Google Workspace mailboxes via Domain-Wide Delegation...`);

  for (const email of candidateEmails) {
    try {
      const jwt = new google.auth.JWT({
        email: saKey.client_email,
        key: saKey.private_key,
        scopes: GMAIL_SCOPES,
        subject: email,
      });

      const gmail = google.gmail({ version: 'v1', auth: jwt });
      const sendAsRes = await gmail.users.settings.sendAs.list({ userId: 'me' });
      const sendAsList = sendAsRes.data.sendAs || [];

      const repData = candidateReps[email];
      const sendAsAddresses = sendAsList.map((s) => ({
        email: s.sendAsEmail.toLowerCase(),
        isPrimary: !!s.isPrimary,
        isDefault: !!s.isDefault,
        displayName: s.displayName || repData.name,
      }));

      verifiedAccounts.push({
        status: 'VERIFIED_ACTIVE',
        primaryEmail: email,
        rep: repData,
        sendAs: sendAsAddresses,
        jwtAuth: jwt,
      });
    } catch (err) {
      const errMsg = err.message || '';
      let statusDesc = 'INACTIVE_OR_GROUP';
      if (errMsg.includes('unauthorized_client')) {
        statusDesc = 'GROUP_OR_UNAUTHORIZED';
      } else if (errMsg.includes('invalid_grant')) {
        statusDesc = 'ACCOUNT_NOT_FOUND';
      }

      verifiedAccounts.push({
        status: statusDesc,
        primaryEmail: email,
        rep: candidateReps[email],
        sendAs: [],
        error: errMsg,
      });
    }
  }

  return verifiedAccounts;
}

/**
 * Compile Tailored Responsive HTML Email Signature
 * Incorporates:
 * - Official Defense Contractor aesthetic (Navy #1D3557, Gold #C9A227, Steel Blue #457B9D)
 * - Structured gold border divider
 * - CAGE (169D8) & UEI (X3HUQZ66P6N3) company credentials
 * - Live dynamic QR code pointing to production routing endpoint:
 *   https://card.[DETECTED_DOMAIN]/r/[repKey]?src=email_sig
 * - Verification hyperlinked badge
 */
function compileHtmlSignature(rep, targetEmail, company, detectedDomain) {
  const repKey = rep.slug || rep.email.split('@')[0];
  const routingUrl = `https://card.${detectedDomain}/r/${repKey}?src=email_sig`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&color=1D3557&data=${encodeURIComponent(routingUrl)}`;
  const cleanPhone = (rep.directPhone || company.mainPhone).replace(/[^0-9]/g, '');

  return `
<div dir="ltr" style="font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 13px; color: #1D3557; line-height: 1.4;">
  <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 13px; color: #1D3557; line-height: 1.4; max-width: 650px;">
    <tr>
      <!-- Column 1: Official Corporate Emblem -->
      <td style="padding-right: 18px; vertical-align: middle; border-right: 3px solid #C9A227; text-align: center;">
        <a href="${company.website}" target="_blank" style="text-decoration: none; display: block;">
          <img src="${company.logoUrl}" width="68" height="68" alt="P-22 Corp Logo" style="display: block; border-radius: 8px; border: 0; outline: none;">
        </a>
      </td>
      <!-- Column 2: Executive Details & Verification Action -->
      <td style="padding-left: 18px; padding-right: 16px; vertical-align: middle;">
        <div style="font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 800; color: #1D3557; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
          ${rep.name}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #C9A227; margin-bottom: 4px;">
          ${rep.title}
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #457B9D; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.3px;">
          ${company.companyName}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
          <strong>Direct:</strong> <a href="tel:${cleanPhone}" style="color: #1D3557; text-decoration: none; font-weight: 600;">${rep.directPhone || company.mainPhone}</a> &bull;
          <strong>Email:</strong> <a href="mailto:${targetEmail}" style="color: #1D3557; text-decoration: none; font-weight: 600;">${targetEmail}</a>
        </div>
        <div style="font-size: 10px; color: #64748B; margin-bottom: 8px;">
          <strong>CAGE:</strong> ${company.cage} &bull; <strong>UEI:</strong> ${company.uei} &bull; ${company.address}
        </div>
        <div style="margin-top: 6px;">
          <a href="${routingUrl}" target="_blank" style="display: inline-block; padding: 5px 12px; background-color: #1D3557; color: #FFFFFF; font-size: 10px; font-weight: bold; border-radius: 4px; text-decoration: none; margin-right: 6px;">
            Verify ID Badge &rarr;
          </a>
          <a href="${company.capabilityUrl}" target="_blank" style="display: inline-block; padding: 5px 12px; background-color: #C9A227; color: #080D18; font-size: 10px; font-weight: bold; border-radius: 4px; text-decoration: none;">
            Capability Statement &rarr;
          </a>
        </div>
      </td>
      <!-- Column 3: Live Dynamic QR Code -->
      <td style="padding-left: 14px; vertical-align: middle; border-left: 1px solid #E2E8F0; text-align: center;">
        <a href="${routingUrl}" target="_blank" style="text-decoration: none; display: block;" title="Scan or click to verify authentic ID badge">
          <img src="${qrCodeUrl}" width="66" height="66" alt="Scan to Verify ID Badge" style="display: block; margin: 0 auto; border: 1px solid #CBD5E1; border-radius: 4px; padding: 2px; background-color: #FFFFFF;">
          <div style="font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 8px; font-weight: 700; color: #1D3557; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">
            Scan ID Badge
          </div>
        </a>
      </td>
    </tr>
  </table>
</div>
`.trim();
}

/**
 * Format console verification table
 */
function printTable(headers, rows) {
  const colWidths = headers.map((h, i) => {
    let max = h.length;
    rows.forEach((r) => {
      const cell = String(r[i] || '');
      if (cell.length > max) max = cell.length;
    });
    return max + 2;
  });

  const sep = '+' + colWidths.map((w) => '-'.repeat(w)).join('+') + '+';
  const formatRow = (r) => '|' + r.map((c, i) => (' ' + String(c || '')).padEnd(colWidths[i])).join('|') + '|';

  console.log(sep);
  console.log(formatRow(headers));
  console.log(sep);
  rows.forEach((r) => console.log(formatRow(r)));
  console.log(sep);
}

/**
 * Main Workflow Execution
 */
async function main() {
  console.log('\n================================================================');
  console.log(' P-22 CORP — GOOGLE WORKSPACE DWD EMAIL SIGNATURE ENGINE');
  console.log('================================================================');

  // Verify Service Account Key
  if (!fs.existsSync(SA_KEY_PATH)) {
    console.error(`[❌] Service Account key not found at: ${SA_KEY_PATH}`);
    process.exit(1);
  }

  const saKey = JSON.parse(fs.readFileSync(SA_KEY_PATH, 'utf8'));
  console.log(`[✓] Loaded Service Account: ${saKey.client_email}`);
  console.log(`[✓] Client ID: ${saKey.client_id}`);

  // Step 1: Dynamic Domain & Profile Discovery
  const detectedDomain = detectActiveDomain(saKey);
  console.log(`[✓] Detected Active Workspace Domain: ${detectedDomain}`);

  const company = extractCompanyProfile(detectedDomain);
  console.log(`[✓] Extracted Defense Contractor Credentials:`);
  console.log(`    Company: ${company.companyName}`);
  console.log(`    CAGE: ${company.cage} | UEI: ${company.uei}`);
  console.log(`    Address: ${company.address}`);

  // Step 2: Discover Candidate Users
  const candidateReps = discoverCandidateReps(detectedDomain);
  console.log(`[✓] Discovered ${Object.keys(candidateReps).length} candidate rep profile definitions.`);

  // Check Google Directory API (admin.directory.user.readonly)
  const dirUsers = await auditDirectoryUsers(saKey, detectedDomain);
  if (dirUsers && dirUsers.length > 0) {
    console.log(`[✓] Google Directory API returned ${dirUsers.length} domain accounts.`);
  } else {
    console.log(`[i] Directory API scope restricted in Workspace Console; utilizing repo roster + live DWD mailbox verification.`);
  }

  // Step 3: Verify Active Accounts & SendAs Inboxes via DWD
  const verifiedMailboxes = await verifyActiveMailboxes(saKey, candidateReps, detectedDomain);

  console.log('\n================================================================');
  console.log(' STEP 1: PRE-FLIGHT AUDIT & VERIFICATION TABLE');
  console.log('================================================================');

  const auditHeaders = ['Rep Name', 'Title / Role', 'Primary Email', 'SendAs Aliases', 'DWD Status'];
  const auditRows = verifiedMailboxes.map((item) => {
    const aliasStr = item.sendAs.map((s) => s.email).join(', ') || 'None';
    return [
      item.rep.name,
      item.rep.title,
      item.primaryEmail,
      aliasStr,
      item.status === 'VERIFIED_ACTIVE' ? '✓ ACTIVE' : `✗ ${item.status}`,
    ];
  });
  printTable(auditHeaders, auditRows);

  const activeAccounts = verifiedMailboxes.filter((m) => m.status === 'VERIFIED_ACTIVE');
  if (activeAccounts.length === 0) {
    console.error('[❌] No active accounts verified for signature deployment.');
    process.exit(1);
  }

  // Step 4: Signature Compilation & Deployment
  console.log('\n================================================================');
  console.log(` STEP 2 & 3: SIGNATURE COMPILATION & ${IS_DRY_RUN ? 'DRY-RUN PREVIEW' : 'LIVE DEPLOYMENT'}`);
  console.log('================================================================');

  const deploymentResults = [];

  for (const acc of activeAccounts) {
    const primaryRep = acc.rep;
    const gmail = google.gmail({ version: 'v1', auth: acc.jwtAuth });

    for (const sendAsEntry of acc.sendAs) {
      const targetEmail = sendAsEntry.email;
      const signatureHtml = compileHtmlSignature(primaryRep, targetEmail, company, detectedDomain);
      const repKey = primaryRep.slug || primaryRep.email.split('@')[0];
      const routingUrl = `https://card.${detectedDomain}/r/${repKey}?src=email_sig`;

      if (IS_DRY_RUN) {
        console.log(`[DRY-RUN] Compiled signature for ${acc.primaryEmail} -> SendAs: ${targetEmail}`);
        console.log(`          Badge Routing: ${routingUrl}`);
        console.log(`          Signature Size: ${signatureHtml.length} characters`);
        deploymentResults.push({
          user: acc.primaryEmail,
          address: targetEmail,
          status: 'SIMULATED (DRY-RUN)',
          chars: signatureHtml.length,
          routingUrl,
        });
      } else {
        try {
          process.stdout.write(`[🚀] Deploying signature for ${targetEmail}... `);
          const patchRes = await gmail.users.settings.sendAs.patch({
            userId: 'me',
            sendAsEmail: targetEmail,
            requestBody: {
              signature: signatureHtml,
            },
          });

          if (patchRes.status === 200) {
            console.log(`SUCCESS!`);
            deploymentResults.push({
              user: acc.primaryEmail,
              address: targetEmail,
              status: 'SUCCESS',
              chars: (patchRes.data.signature || '').length,
              routingUrl,
            });
          } else {
            console.log(`HTTP ${patchRes.status}`);
            deploymentResults.push({
              user: acc.primaryEmail,
              address: targetEmail,
              status: `FAILED (HTTP ${patchRes.status})`,
              chars: 0,
              routingUrl,
            });
          }
        } catch (patchErr) {
          console.log(`FAILED: ${patchErr.message}`);
          deploymentResults.push({
            user: acc.primaryEmail,
            address: targetEmail,
            status: `FAILED: ${patchErr.message.slice(0, 30)}`,
            chars: 0,
            routingUrl,
          });
        }
      }
    }
  }

  // Step 5: Verification Reporting
  console.log('\n================================================================');
  console.log(' STEP 4: VERIFICATION REPORTING SUMMARY');
  console.log('================================================================');

  const repHeaders = ['User Mailbox', 'Configured Address', 'Deployment Status', 'Payload Size', 'Badge Routing Target'];
  const repRows = deploymentResults.map((r) => [
    r.user,
    r.address,
    r.status.startsWith('SUCCESS') ? '✓ SUCCESS' : r.status,
    `${r.chars} chars`,
    r.routingUrl,
  ]);
  printTable(repHeaders, repRows);

  const successCount = deploymentResults.filter((r) => r.status === 'SUCCESS').length;
  console.log(`\n[🏁] Complete. Deployed: ${successCount} / ${deploymentResults.length} signatures successfully.`);

  if (IS_DRY_RUN) {
    console.log(`\n[ℹ️] Note: This was a DRY-RUN audit. To execute live deployment across all inboxes, run:\n    node scripts/push-signatures.js\n`);
  }
}

// Execute
main().catch((err) => {
  console.error('\n[❌] Fatal script execution error:', err);
  process.exit(1);
});
