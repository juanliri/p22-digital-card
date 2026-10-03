/**
 * P-22 Domain Migration Utility
 * Usage: node scripts/migrate-domain.js "https://card.p22corp.com"
 */
const fs = require('fs');
const path = require('path');

const targetDomain = process.argv[2];
if (!targetDomain || !targetDomain.startsWith('http')) {
  console.error('Usage: node scripts/migrate-domain.js "https://your-domain.com"');
  process.exit(1);
}

const cleanDomain = targetDomain.replace(/\/$/, '');
const oldDomain = 'https://p22-digital-card.vercel.app';

console.log(`Migrating P-22 URLs from [${oldDomain}] to [${cleanDomain}]...`);

const filesToUpdate = [
  'team.json',
  'setup.html',
  'badge.html',
  'pedro.html',
  'eduardo.html',
  'marleni.html',
  'logistics.html',
  'bids.html',
  'index.html',
  'scripts/verify-production-health.js',
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldDomain)) {
      content = content.split(oldDomain).join(cleanDomain);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  [OK] Migrated: ${file}`);
    } else {
      console.log(`  [-] No occurrences found in: ${file}`);
    }
  }
}

console.log('\nDomain migration complete! Re-run audit: node scripts/audit-all-users.js');
