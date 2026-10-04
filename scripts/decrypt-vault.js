/**
 * P-22 CORP — Encrypted Vault Decryption & Restore Utility
 * Decrypts vault/p22-secrets-vault.enc back to JSON or restores files.
 * 
 * Usage:
 *   node scripts/decrypt-vault.js [password] [--restore]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const VAULT_FILE = path.join(ROOT_DIR, 'vault', 'p22-secrets-vault.enc');

const MASTER_PASSWORD = process.argv[2] || 'P22Corp-Secret-Vault-2026!#Defense';
const SHOULD_RESTORE = process.argv.includes('--restore');

function decryptVault(vaultPath, password) {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found at: ${vaultPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
  const salt = Buffer.from(payload.salt, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');

  const key = crypto.pbkdf2Sync(password, salt, payload.kdfIterations || 100000, 32, payload.kdfDigest || 'sha512');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

try {
  console.log(`[*] Decrypting ${VAULT_FILE}...`);
  const data = decryptVault(VAULT_FILE, MASTER_PASSWORD);
  console.log(`[✓] Decryption Successful! Authentication Tag Verified.`);
  console.log(`[*] Vault Metadata:`, JSON.stringify(data.metadata, null, 2));
  console.log(`[*] Environment Keys Found:`, Object.keys(data.environmentVariables || {}));
  console.log(`[*] Service Account Client Email:`, (data.serviceAccount || {}).client_email);

  if (SHOULD_RESTORE && data.rawFiles) {
    console.log('\n[*] Restoring raw credential files to workspace...');
    for (const [relPath, content] of Object.entries(data.rawFiles)) {
      const fullPath = path.join(ROOT_DIR, relPath);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(` [+] Restored: ${relPath}`);
    }
  } else {
    console.log('\n[Tip] To restore raw credential files, run with --restore flag:');
    console.log(`      node scripts/decrypt-vault.js "${MASTER_PASSWORD}" --restore`);
  }
} catch (err) {
  console.error('[!] Decryption failed:', err.message);
  process.exit(1);
}
