/**
 * P-22 Corp Digital Card - Google Drive Storage Engine
 * Handles uploading scanned business cards and badge images directly to a shared Google Drive folder.
 * 
 * Works with the existing Service Account (antigravity-agent@p22-executive-studio.iam.gserviceaccount.com).
 * By uploading to a shared folder owned by a human Google account (Workspace or personal),
 * it bypasses the Service Account's 0-byte quota limitation completely.
 */

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { google } = require('googleapis');

let driveInstance = null;

async function getDriveClient() {
  if (driveInstance) return driveInstance;

  let credentials = null;

  if (process.env.GOOGLE_SERVICE_KEY) {
    try {
      const raw = process.env.GOOGLE_SERVICE_KEY.trim();
      credentials = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      console.error('[!] Failed to parse GOOGLE_SERVICE_KEY for Drive:', err.message);
    }
  }

  if (!credentials) {
    const keyPath = path.join(process.cwd(), 'credentials', 'google-sa.json');
    if (fs.existsSync(keyPath)) {
      try {
        credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      } catch (err) {
        console.error('[!] Failed to read local credentials for Drive:', err.message);
      }
    }
  }

  if (!credentials) {
    return null;
  }

  // 1. Try DWD delegation (delegating to domain executive pfelipe@p22corp.com)
  const delegateUser = process.env.GOOGLE_ADMIN_EMAIL || 'pfelipe@p22corp.com';
  try {
    const jwtClient = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject: delegateUser,
    });
    await jwtClient.authorize();
    driveInstance = google.drive({ version: 'v3', auth: jwtClient });
    return driveInstance;
  } catch (dwdErr) {
    // DWD scope not yet granted in admin console, fall back to direct Service Account for Shared Drives
  }

  // 2. Direct Service Account (works for Shared Drives)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveInstance = google.drive({ version: 'v3', auth });
  return driveInstance;
}

function getDriveFolderId() {
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) return process.env.GOOGLE_DRIVE_FOLDER_ID.trim();
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GOOGLE_DRIVE_FOLDER_ID=["']?([^"'\r\n]+)/);
      if (match) return match[1].trim();
    }
  } catch (e) {}
  return null;
}

/**
 * Upload a base64 or buffer image to Google Drive inside the designated folder.
 * @param {string|Buffer} imageData - Base64 data URL or raw buffer
 * @param {string} fileName - File name to save as in Drive
 * @returns {Promise<{ url: string, fileId: string } | null>}
 */
async function uploadCardPhotoToDrive(imageData, fileName) {
  const folderId = getDriveFolderId();
  if (!folderId) {
    // If no folder configured, graceful fallback
    return null;
  }

  const drive = await getDriveClient();
  if (!drive) return null;

  try {
    let buffer;
    let mimeType = 'image/jpeg';

    if (Buffer.isBuffer(imageData)) {
      buffer = imageData;
    } else if (typeof imageData === 'string') {
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(imageData, 'base64');
        }
      } else {
        buffer = Buffer.from(imageData, 'base64');
      }
    } else {
      return null;
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const safeName = (fileName || `card_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalName = safeName.endsWith('.jpg') || safeName.endsWith('.png') ? safeName : `${safeName}.jpg`;

    const fileMetadata = {
      name: finalName,
      parents: [folderId],
      description: 'P-22 Corp Digital Card OCR Intake Scan',
    };

    const media = {
      mimeType,
      body: bufferStream,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    const fileId = file.data.id;

    // Grant public read permission so the link opens for any staff member in Google Sheets
    try {
      await drive.permissions.create({
        fileId,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
    } catch (permErr) {
      console.warn('[!] Could not set public permission on Drive file:', permErr.message);
    }

    const viewLink = file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    return {
      url: viewLink,
      fileId,
    };
  } catch (err) {
    console.error('[-] Error uploading card photo to Google Drive:', err.message);
    return null;
  }
}

module.exports = {
  getDriveClient,
  getDriveFolderId,
  uploadCardPhotoToDrive,
};
