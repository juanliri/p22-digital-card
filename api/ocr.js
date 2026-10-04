/**
 * P-22 Digital Card - AI Vision OCR Endpoint
 * /api/ocr
 *
 * Uses Google Gemini Vision (Gemini 2.5 / 2.0 / 1.5 Flash) to transcribe business cards and badges.
 * Extracts structured JSON: name, agency, title, email, phone, website, and raw notes.
 * Enforces JSON schema validation and heuristic field disambiguation.
 * Falls back to client-side local neural OCR (Tesseract) if no GEMINI_API_KEY is configured.
 */

const https = require('https');

/**
 * Robust JSON Schema Validator and Heuristic Disambiguator for Business Card OCR
 */
function sanitizeAndValidateCardData(data) {
  const agencyKeywords = [
    'inc', 'llc', 'corp', 'corporation', 'co.', 'company', 'ltd', 'agency',
    'department', 'dept', 'command', 'dla', 'usace', 'navfac', 'group',
    'services', 'logistics', 'solutions', 'technologies', 'contracting',
    'associates', 'consulting', 'enterprises', 'holdings', 'systems', 'materials'
  ];

  const titleKeywords = [
    'director', 'manager', 'lead', 'officer', 'president', 'vice president',
    'vp', 'ceo', 'cfo', 'coo', 'pmp', 'pe', 'chfm', 'engineer', 'specialist',
    'coordinator', 'estimator', 'superintendent', 'administrator', 'consultant',
    'buyer', 'contracting officer', 'executive', 'representative', 'supervisor'
  ];

  let name = (data.name || '').trim();
  let agency = (data.agency || '').trim();
  let title = (data.title || '').trim();
  let email = (data.email || '').trim().toLowerCase();
  let phone = (data.phone || '').trim();
  let website = (data.website || '').trim();
  let notes = (data.notes || data.raw_ocr || '').trim();

  // 1. Name vs Agency Inversion Check
  const nameLower = name.toLowerCase();
  const agencyLower = agency.toLowerCase();

  const nameIsAgency = agencyKeywords.some(kw => nameLower.includes(kw));
  const agencyIsPerson = agency.split(/\s+/).length >= 2 && agency.split(/\s+/).length <= 4 &&
                         !agencyKeywords.some(kw => agencyLower.includes(kw));

  if (nameIsAgency && agencyIsPerson) {
    // Swap name and agency
    const temp = name;
    name = agency;
    agency = temp;
  }

  // 2. Title leaking into Name Check
  for (const tKw of titleKeywords) {
    if (nameLower.startsWith(tKw + ' ') || nameLower.includes(' ' + tKw)) {
      if (!title) {
        title = name;
        name = '';
      }
      break;
    }
  }

  // 3. Clean and validate email
  const emailMatch = email.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  email = emailMatch ? emailMatch[0] : '';

  // 4. Clean and format phone number
  if (phone) {
    phone = phone.replace(/^(?:tel|cell|phone|mobile|office|c:|m:|p:|t:)\s*/i, '').trim();
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length === 10) {
      phone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
    } else if (phoneDigits.length === 11 && phoneDigits.startsWith('1')) {
      phone = `1-(${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7)}`;
    }
  }

  // 5. Clean website
  if (website) {
    website = website.replace(/^(?:web|site|url|w:)\s*/i, '').trim();
    if (!website.startsWith('http://') && !website.startsWith('https://') && website.includes('.')) {
      website = 'https://' + website.replace(/^\/+/, '');
    }
  }

  return {
    name,
    agency,
    title,
    email,
    phone,
    website,
    notes,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  const apiKey = (function () {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.GOOGLE_AI_KEY) return process.env.GOOGLE_AI_KEY;
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
        if (match) return match[1];
      }
    } catch (e) {}
    return null;
  })();

  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      fallback: true,
      reason: 'No GEMINI_API_KEY configured. Fall back to local neural OCR (Tesseract).',
    });
  }

  try {
    let payload = {};
    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body);
      } catch (e) {
        payload = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body;
    }

    let base64Image = payload.image || '';
    if (!base64Image) {
      return res.status(400).json({ ok: false, error: 'Missing image payload' });
    }

    // Strip data:image/...;base64, prefix if present
    let mimeType = 'image/jpeg';
    if (base64Image.includes(',')) {
      const parts = base64Image.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64Image = parts[1];
    }

    const promptText = `
You are an expert AI vision transcription and extraction engine for physical business cards and conference badges.
Carefully examine the layout, typography, and visual hierarchy of this card or badge image.

CRITICAL INSTRUCTIONS:
1. "name": The full personal name of the individual (e.g., "Col. Marcus Vance", "Jane Doe", "Pedro Felipe"). Do NOT put the company name or agency name here.
2. "agency": The official organization, company, prime contractor, or government department name (e.g., "U.S. Army Corps of Engineers", "Turner Construction", "P-22 Corp"). Do NOT put the person's name here.
3. "title": The professional role, rank, or job title (e.g., "Director of Commercial Sales", "Lead Estimator", "PMP", "Contracting Officer").
4. "email": The direct or work email address.
5. "phone": The primary direct or mobile phone number. Include extension if present.
6. "website": The official company website URL or domain.
7. "notes": Verbatim transcription of all additional certifications, CAGE codes, UEI numbers, addresses, and specialties visible on the card.

Return ONLY a strictly valid JSON object matching this schema without markdown, backticks, or preamble:
{
  "name": "Full Person Name",
  "agency": "Company, Department, or Prime Contractor Name",
  "title": "Job Title or Rank",
  "email": "Work Email Address",
  "phone": "Direct Phone Number",
  "website": "Company Website",
  "notes": "Full verbatim transcription and credentials"
}
If any field is missing or illegible, set its value to an empty string "".
`;

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
      },
    });

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest',
      'gemini-1.5-pro'
    ];

    async function callGemini(modelName) {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${modelName}:generateContent`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'Content-Length': Buffer.byteLength(requestBody),
        },
      };

      return new Promise((resolve, reject) => {
        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => (data += chunk));
          apiRes.on('end', () => {
            if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
              resolve({ model: modelName, data });
            } else {
              reject(new Error(`Model ${modelName} returned (${apiRes.statusCode}): ${data.slice(0, 180)}`));
            }
          });
        });
        apiReq.on('error', reject);
        apiReq.setTimeout(12000, () => {
          apiReq.destroy(new Error(`Timeout calling ${modelName}`));
        });
        apiReq.write(requestBody);
        apiReq.end();
      });
    }

    let aiResult = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        aiResult = await callGemini(model);
        if (aiResult) break;
      } catch (err) {
        lastError = err;
        console.warn(`[-] Gemini model ${model} failed, trying next:`, err.message);
      }
    }

    if (!aiResult) {
      throw lastError || new Error('All Gemini Vision models failed');
    }

    const parsed = JSON.parse(aiResult.data);
    const candidateText =
      parsed.candidates &&
      parsed.candidates[0] &&
      parsed.candidates[0].content &&
      parsed.candidates[0].content.parts &&
      parsed.candidates[0].content.parts[0] &&
      parsed.candidates[0].content.parts[0].text;

    if (!candidateText) {
      throw new Error('Empty AI response from Gemini Vision');
    }

    let rawStructured = {};
    try {
      rawStructured = JSON.parse(candidateText.trim().replace(/^```json/i, '').replace(/```$/i, ''));
    } catch {
      rawStructured = { raw_ocr: candidateText };
    }

    // Apply strict schema validation and heuristics
    const sanitizedData = sanitizeAndValidateCardData(rawStructured);

    return res.status(200).json({
      ok: true,
      ai_powered: true,
      model: aiResult.model,
      data: sanitizedData,
    });
  } catch (err) {
    console.warn('[-] Gemini Vision API failed, falling back:', err.message);
    return res.status(200).json({
      ok: false,
      fallback: true,
      error: err.message,
    });
  }
};
