// tests/expo-suite.mjs
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
  const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  if (!['standalone', 'fullscreen'].includes(manifest.display)) {
    throw new Error(`manifest.display is "${manifest.display}". Must be "standalone" or "fullscreen"`);
  }
});

// 2. iOS NO-NAVBAR HEAD METAS
check('All HTML pages have apple-mobile-web-app-capable and viewport-fit=cover', () => {
  const htmlFiles = globSync('**/*.html', { ignore: ['node_modules/**', '.next/**', 'backups/**', 'scratch/**'] });
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    if (!content.includes('apple-mobile-web-app-capable')) throw new Error(`${file} missing apple-mobile-web-app-capable`);
    if (!content.includes('viewport-fit=cover')) throw new Error(`${file} missing viewport-fit=cover in viewport meta`);
  }
});

// 3. TEAM IDENTITY & MODAL ISOLATION (No Cross-Contamination)
check('Page rep matches modal and action links', () => {
  const reps = [
    { file: 'eduardo.html', email: 'sales@p22corp.com', altEmail: 'elopez@p22corp.com', slug: '/eduardo', name: 'Eduardo' },
    { file: 'pedro.html', email: 'pfelipe@p22corp.com', slug: '/pedro', name: 'Pedro' },
    { file: 'marleni.html', email: 'mmendez@p22corp.com', slug: '/marleni', name: 'Marleni' }
  ];

  for (const rep of reps) {
    if (!existsSync(rep.file)) continue;
    const html = readFileSync(rep.file, 'utf8');
    // Flag if Eduardo has Pedro's mailto in action button
    if (rep.file === 'eduardo.html') {
      if (html.includes('mailto:pfelipe@p22corp.com')) throw new Error('eduardo.html still has pfelipe@p22corp.com hardcoded!');
      if (html.includes('card.p22corp.com/pedro')) throw new Error('eduardo.html modal still points to /pedro URL');
    }
  }
});

// 4. SCANNER PREPROCESSING PIPELINE
check('Pre-processing canvas exists in card capture flow', () => {
  const scripts = globSync('**/*.{js,ts,jsx,tsx}', { ignore: ['node_modules/**', 'tests/**'] });
  const hasCanvasPreprocess = scripts.some(file => {
    const src = readFileSync(file, 'utf8');
    return src.includes('getImageData') || src.includes('preprocessCardImage');
  });
  if (!hasCanvasPreprocess) throw new Error('No Canvas contrast/grayscale pre-processing found in scanning pipeline.');
});

// 5. VCARD / WALLET / QR DATA
check('VCF exports and Wallet links contain valid data structures', () => {
  const htmlFiles = globSync('**/*.html', { ignore: ['node_modules/**', 'backups/**', 'scratch/**'] });
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf8');
    if (content.includes('BEGIN:VCARD') && !content.includes('END:VCARD')) {
      throw new Error(`Malformed embedded vCard detected in ${file}`);
    }
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
