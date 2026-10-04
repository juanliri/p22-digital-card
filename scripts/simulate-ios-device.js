/**
 * P-22 CORP — iOS Device Simulator & Viewport Testing Tool
 * Uses Microsoft Edge / Chrome in headless mode with an iPhone 15 Pro mobile profile:
 * - Viewport: 393 x 852 (exact iPhone 15 Pro / 14 Pro CSS dimensions)
 * - User-Agent: Mobile Safari (iPhone OS 17_4)
 * - Device Scale Factor: 3.0 (Retina display simulation)
 * - Touch & Mobile Emulation enabled
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const browserExe = edgePaths.find((p) => fs.existsSync(p));

if (!browserExe) {
  console.error('[!] Neither Microsoft Edge nor Google Chrome found for headless iOS simulation.');
  process.exit(1);
}

const targetUrl = process.argv[2] || 'https://card.p22corp.com/pedro';
const outFilename = process.argv[3] || 'ios_preview_pedro.png';
const outPath = path.join(__dirname, '..', 'assets', outFilename);

console.log(`[*] Simulating iPhone 15 Pro Mobile Safari...`);
console.log(`[*] Browser Binary: ${browserExe}`);
console.log(`[*] Target URL: ${targetUrl}`);
console.log(`[*] Viewport: 393 x 852 px (Retina 3x)`);

const args = [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  `--window-size=393,852`,
  '--force-device-scale-factor=3',
  '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  `--screenshot=${outPath}`,
  targetUrl,
];

const res = spawnSync(browserExe, args, { stdio: 'inherit', timeout: 15000 });

if (fs.existsSync(outPath)) {
  const stats = fs.statSync(outPath);
  console.log(`[✓] Success! iPhone simulation screenshot saved to: assets/${outFilename} (${Math.round(stats.size / 1024)} KB)`);
} else {
  console.error('[!] Failed to capture screenshot.');
}
