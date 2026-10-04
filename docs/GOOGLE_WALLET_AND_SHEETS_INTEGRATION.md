# P-22 Corp: Google Wallet API & Google Workspace Sheets Integration

This architecture blueprint details the exact requirements, files, and deployment steps for:
1. **Custom Google Wallet Passes with Header Banners & Photos**
2. **Google Apps Script & Google Sheets Real-time Lead Intake**

---

## PART 1: Google Wallet API (Custom Header Banner & Photos)

### What You Need:
1. **Google Cloud Platform (GCP) Project:**
   - Enable the **Google Wallet API** in the GCP Console.
2. **Google Wallet Business Console Account:**
   - Navigate to [Google Pay & Wallet Console](https://pay.google.com/business/console).
   - Sign up as a Business Issuer and get your **Issuer ID** (e.g. `3388000000022119999`).
3. **GCP Service Account Credentials:**
   - Create a Service Account in GCP with role **Google Wallet API Admin**.
   - Generate and download the `service_account.json` key file.
   - Authorize the Service Account email in your Google Pay & Wallet Console under **Users / Permissions**.

### The Technical Workflow:

```
[Local/Server Script]
      │
      ├── 1. Authenticate using Service Account JWT (OAuth 2.0 Scope: wallet_object.issuer)
      │
      ├── 2. Upload Private Image via REST API:
      │      POST https://walletobjects.googleapis.com/upload/walletobjects/v1/privateImages
      │      --> Returns: "privateImageId" (e.g. "img_pedro_headshot_123")
      │
      ├── 3. Create Pass Class (One-time blueprint per organization/department):
      │      POST https://walletobjects.googleapis.com/walletobjects/v1/genericClass
      │      {
      │        "id": "ISSUER_ID.P22_STAFF_ID_CLASS",
      │        "classTemplateInfo": {
      │          "cardTemplateOverride": {
      │            "cardRowTemplateInfos": [...]
      │          }
      │        }
      │      }
      │
      └── 4. Create Pass Object (Per Representative):
             POST https://walletobjects.googleapis.com/walletobjects/v1/genericObject
             {
               "id": "ISSUER_ID.STAFF_PEDRO_001",
               "classId": "ISSUER_ID.P22_STAFF_ID_CLASS",
               "cardTitle": { "defaultValue": { "language": "en", "value": "P-22 CORP" } },
               "header": { "defaultValue": { "language": "en", "value": "Pedro Felipe" } },
               "subheader": { "defaultValue": { "language": "en", "value": "Managing Director" } },
               "heroImage": {
                 "sourceUri": { "uri": "https://card.p22corp.com/assets/facility/loading-dock.webp" },
                 "contentDescription": { "defaultValue": { "language": "en", "value": "Dallas Logistics Hub" } }
               },
               "imageModulesData": [
                 {
                   "mainImage": {
                     "privateImageId": "img_pedro_headshot_123"
                   },
                   "id": "staff_headshot"
                 }
               ],
               "barcode": {
                 "type": "QR_CODE",
                 "value": "https://card.p22corp.com/pedro"
               }
             }
      │
      └── 5. Sign Save URL (JWT):
             Generate signed URL: https://pay.google.com/gp/v/save/<JWT_TOKEN>
```

---

## PART 2: Google Workspace Sheets & Apps Script Intake

To have every **"Exchange Contact"**, **"Fast-Track RFQ"**, or **"Send My Contact"** form submission automatically appear in your private Google Sheet without needing third-party middleware:

### Step 1: Create Your Google Sheet
1. Open Google Sheets and create a new sheet: `P-22 Corp Expo Leads 2026`.
2. In Row 1, add these headers:
   `Timestamp | Representative | Client Name | Agency / Company | Email | Phone | Scope / Interest | Source`

### Step 2: Open Script Editor
1. Click **Extensions** > **Apps Script**.
2. Replace all code with the production-ready handler below:

```javascript
/**
 * P-22 Corp - Google Sheets Lead Intake Webhook
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var timestamp = data.timestamp || new Date().toISOString();
    var rep = data.rep_name || data.repSlug || data.rep_slug || "Pedro Felipe";
    var name = data.client_name || data.name || "N/A";
    var agency = data.client_agency || data.agency || "N/A";
    var email = data.client_email || data.email || "N/A";
    var phone = data.client_phone || data.phone || "N/A";
    var interest = data.interest || "Expo Intake";
    var source = data.source || "Digital Card";

    sheet.appendRow([
      timestamp,
      rep,
      name,
      agency,
      email,
      phone,
      interest,
      source
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Lead recorded" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("P-22 Corp Lead Webhook is Active.");
}
```

### Step 3: Deploy as Web App
1. In Apps Script, click **Deploy** > **New Deployment**.
2. Click the gear icon > select **Web App**.
3. Settings:
   - **Execute as:** `Me` (your Google Account)
   - **Who has access:** `Anyone` (essential so phone submissions from expo attendees can submit without Google login).
4. Click **Deploy**, authorize permissions, and copy the **Web App URL**:
   `https://script.google.com/macros/s/AKfycbx.../exec`

### Step 4: Plug URL into P-22 Cards
Whenever you provide the Web App URL, we plug it directly into `GOOGLE_SHEETS_WEBHOOK_URL` in `pedro.html`, `eduardo.html`, `marleni.html`, `bids.html`, and `logistics.html`. 

Submissions will dispatch asynchronously with `mode: 'no-cors'`, logging immediately to Google Sheets while preserving instant offline storage in the `/setup` vault.
