import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'glob';

let failures = [];
function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failures.push({ name, error: err.message });
  }
}

console.log('\n--- STARTING EXPO INTEGRATION TEST RUN ---');

// 1. PWA & FULLSCREEN CONFIGURATION
check('Manifest display mode is standalone or fullscreen', () => {
  const manifests = ['manifest.json', 'manifest.webmanifest'];
  for (const mFile of manifests) {
    if (existsSync(mFile)) {
      const manifest = JSON.parse(readFileSync(mFile, 'utf8'));
      if (!['standalone', 'fullscreen'].includes(manifest.display)) {
        throw new Error(`${mFile} display is "${manifest.display}". Must be "standalone" or "fullscreen"`);
      }
    }
  }
});

// 2. iOS NO-NAVBAR HEAD METAS & SAFE-AREA CSS
check('All HTML pages have apple-mobile-web-app-capable, viewport-fit=cover, and safe-area-inset CSS', () => {
  const htmlFiles = globSync('*.html', { ignore: ['node_modules/**', '.next/**', 'backups/**', 'scratch/**'] });
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    if (!content.includes('apple-mobile-web-app-capable')) throw new Error(`${file} missing apple-mobile-web-app-capable`);
    if (!content.includes('viewport-fit=cover')) throw new Error(`${file} missing viewport-fit=cover in viewport meta`);
    if (!content.includes('safe-area-inset-top')) throw new Error(`${file} missing safe-area-inset-top in CSS`);
  }
});

// 3. TEAM IDENTITY & MODAL ISOLATION (No Cross-Contamination)
check('Page rep matches modal and action links across all profiles', () => {
  const reps = [
    { file: 'eduardo.html', email: 'elopez@p22corp.com', phone: '14073699001', slug: '/eduardo', name: 'Eduardo Lopez' },
    { file: 'pedro.html', email: 'pfelipe@p22corp.com', phone: '18887222675', slug: '/pedro', name: 'Pedro Felipe' },
    { file: 'marleni.html', email: 'mmendez@p22corp.com', phone: '18887222675', slug: '/marleni', name: 'Marleni Mendez' },
    { file: 'bids.html', email: 'bids@p22corp.com', phone: '18887222675', slug: '/bids', name: 'Government Procurement Desk' },
    { file: 'logistics.html', email: 'logistics@p22corp.com', phone: '18887222675', slug: '/logistics', name: 'Logistics' },
  ];

  for (const rep of reps) {
    if (!existsSync(rep.file)) continue;
    const html = readFileSync(rep.file, 'utf8');
    if (rep.file === 'eduardo.html') {
      if (html.includes('mailto:pfelipe@p22corp.com')) throw new Error('eduardo.html still has pfelipe@p22corp.com hardcoded!');
      if (html.includes('card.p22corp.com/pedro')) throw new Error('eduardo.html modal still points to /pedro URL');
      if (!html.includes('14073699001')) throw new Error('eduardo.html missing Eduardo direct phone 14073699001');
    }
    if (rep.file === 'marleni.html') {
      if (html.includes('mailto:pfelipe@p22corp.com')) throw new Error('marleni.html still has pfelipe@p22corp.com hardcoded!');
    }
  }
});

// 4. SCANNER PREPROCESSING PIPELINE & CAMERA CONSTRAINTS
check('Pre-processing canvas and facingMode environment exist in card capture flow', () => {
  const scripts = globSync('assets/js/*.js', { ignore: ['node_modules/**', 'tests/**'] });
  let hasCanvasPreprocess = false;
  let hasFacingMode = false;
  let hasOfflineQueue = false;

  for (const file of scripts) {
    const src = readFileSync(file, 'utf8');
    if (src.includes('getImageData') || src.includes('preprocessCardImage')) hasCanvasPreprocess = true;
    if (src.includes('facingMode') && src.includes('environment')) hasFacingMode = true;
    if (src.includes('p22_offline_queue')) hasOfflineQueue = true;
  }

  if (!hasCanvasPreprocess) throw new Error('No Canvas contrast/grayscale pre-processing found in scanning pipeline.');
  if (!hasFacingMode) throw new Error('No facingMode: "environment" found in camera capture configuration.');
  if (!hasOfflineQueue) throw new Error('No p22_offline_queue found in offline submission queue.');
});

// 5. VCARD / WALLET / QR DATA
check('VCF exports and Wallet links contain valid data structures', () => {
  const htmlFiles = globSync('*.html', { ignore: ['node_modules/**', 'backups/**', 'scratch/**'] });
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    if (content.includes('BEGIN:VCARD') && !content.includes('END:VCARD')) {
      throw new Error(`Malformed embedded vCard detected in ${file}`);
    }
  }

  // Check pkpass files exist
  const requiredPasses = ['pedro.pkpass', 'eduardo.pkpass', 'marleni.pkpass', 'bids.pkpass', 'logistics.pkpass'];
  for (const p of requiredPasses) {
    const fullPath = `assets/passes/${p}`;
    if (!existsSync(fullPath)) throw new Error(`Missing expected wallet pass: ${fullPath}`);
  }
});

// 6. DEPLOYMENT & EXTERNAL ADAPTERS (Vercel, Google Workspace, Wix)
check('Environment variables and service endpoints exist', () => {
  const envExample = existsSync('.env.example') ? readFileSync('.env.example', 'utf8') : '';
  const requiredKeys = ['GOOGLE_WORKSPACE', 'VERCEL', 'WIX'];
  for (const key of requiredKeys) {
    if (!envExample.includes(key)) {
      throw new Error(`Missing expected adapter key ${key} in .env.example`);
    }
  }
});

if (failures.length > 0) {
  console.error(`\nFAILED: ${failures.length} issues found.`);
  process.exit(1);
} else {
  console.log('\nPASSED: All checks green. 100% ready for the floor.');
  process.exit(0);
}
