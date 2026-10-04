/**
 * P-22 CORP — Enterprise Secrets & Credentials Encrypted Vault Generator
 * Packages all local secrets, API keys, service accounts, and IDs into an
 * AES-256-GCM encrypted file (vault/p22-secrets-vault.enc).
 * 
 * Algorithm: AES-256-GCM
 * Key Derivation: PBKDF2 with 100,000 iterations, SHA-512, 16-byte cryptographically secure random salt.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const VAULT_DIR = path.join(ROOT_DIR, 'vault');

// Default Master Password for encryption (Can also be passed via CLI arg)
const MASTER_PASSWORD = process.argv[2] || 'P22Corp-Secret-Vault-2026!#Defense';

function collectSecrets() {
  console.log('[*] Scanning workspace for all P-22 Corp credentials and keys...');
  const bundle = {
    metadata: {
      generatedAt: new Date().toISOString(),
      organization: 'P-22 Corp Construction Material Solutions LLC',
      classification: 'CONFIDENTIAL / EXECUTIVE SECRETS BACKUP',
      targetDomains: ['card.p22corp.com', 'p22corp.com'],
      cageCode: '169D8',
      uei: 'X3HUQZ66P6N3',
    },
    serviceAccount: null,
    environmentVariables: {},
    googleWorkspaceConfig: {
      clientEmail: 'antigravity-agent@p22-executive-studio.iam.gserviceaccount.com',
      clientId: '113702164478142718104',
      sheetId: '1Xfwmr7iPtV3YaAO6GIJW-Ekx5WM1sR92YZGnD2Qubl0',
      driveFolderId: '1ldQu4AHM6rMA_YvA7PaYYrBdNAXvE07E',
      delegatedAccounts: [
        'jliriano@p22corp.com',
        'pfelipe@p22corp.com',
        'bids@p22corp.com',
        'elopez@p22corp.com',
        'mmendez@p22corp.com',
        'logistics@p22corp.com',
      ],
      dwdScopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/calendar',
      ],
    },
    vercelConfig: {
      project: 'p22-digital-card',
      team: 'todobuild-apps',
      domain: 'card.p22corp.com',
      activeVariables: [
        'GOOGLE_DRIVE_FOLDER_ID',
        'GEMINI_API_KEY',
        'GOOGLE_SHEET_ID',
        'GOOGLE_SERVICE_KEY',
      ],
    },
    wixConfig: {
      domain: 'p22corp.com',
      connector: 'lib/wix-crm.js',
      webhookEnvVar: 'WIX_WEBHOOK_URL',
    },
    rawFiles: {},
  };

  // 1. Google Service Account JSON
  const saPath = path.join(ROOT_DIR, 'credentials', 'google-sa.json');
  if (fs.existsSync(saPath)) {
    try {
      const saRaw = fs.readFileSync(saPath, 'utf8');
      bundle.serviceAccount = JSON.parse(saRaw);
      bundle.rawFiles['credentials/google-sa.json'] = saRaw;
      console.log(' [+] Collected credentials/google-sa.json');
    } catch (e) {
      console.warn(' [-] Failed to parse google-sa.json:', e.message);
    }
  }

  // 2. .env file
  const envPath = path.join(ROOT_DIR, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const envRaw = fs.readFileSync(envPath, 'utf8');
      bundle.rawFiles['.env'] = envRaw;
      const lines = envRaw.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.substring(0, idx).trim();
          const v = trimmed.substring(idx + 1).trim();
          bundle.environmentVariables[k] = v;
        }
      }
      console.log(' [+] Collected .env environment variables');
    } catch (e) {
      console.warn(' [-] Failed to read .env:', e.message);
    }
  }

  return bundle;
}

function encryptBundle(dataObject, password) {
  const jsonStr = JSON.stringify(dataObject, null, 2);
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM

  // Derive 256-bit key using PBKDF2
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    cipher: 'aes-256-gcm',
    kdf: 'pbkdf2',
    kdfIterations: 100000,
    kdfDigest: 'sha512',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encrypted,
  };
}

function main() {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }

  const secrets = collectSecrets();
  const encryptedPayload = encryptBundle(secrets, MASTER_PASSWORD);

  const outPath = path.join(VAULT_DIR, 'p22-secrets-vault.enc');
  fs.writeFileSync(outPath, JSON.stringify(encryptedPayload, null, 2), 'utf8');

  console.log(`\n[✓] SUCCESS: Encrypted vault created at: ${outPath}`);
  console.log(`[*] Encryption: AES-256-GCM with 100,000 PBKDF2 iterations`);
  console.log(`[*] File Size: ${fs.statSync(outPath).size} bytes`);
  console.log(`[*] Password used: "${MASTER_PASSWORD}"\n`);
}

main();
