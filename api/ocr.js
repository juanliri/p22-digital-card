/**
 * P-22 Digital Card - AI Vision OCR Endpoint
 * /api/ocr
 *
 * Uses Google Gemini 1.5 Flash (Free Tier) to transcribe business cards and badges.
 * Extracts structured JSON: name, agency, title, email, phone, website, and raw text.
 * Falls back to client-side Tesseract if no GEMINI_API_KEY is configured.
 */

const https = require('https');

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
You are an expert AI transcription engine for business cards and conference badges.
Extract all contact and credential information from this image.
Return ONLY a valid JSON object without markdown or code fences:
{
  "name": "Full Person Name",
  "agency": "Company, Department, or Prime Contractor Name",
  "title": "Job Title or Military Rank",
  "email": "Work Email",
  "phone": "Direct Phone Number",
  "website": "Company Website",
  "notes": "Full verbatim transcription of all text on the card"
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
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
      },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/gemini-flash-latest:generateContent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const aiResponse = await new Promise((resolve, reject) => {
      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => (data += chunk));
        apiRes.on('end', () => {
          if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Gemini API error (${apiRes.statusCode}): ${data}`));
          }
        });
      });
      apiReq.on('error', reject);
      apiReq.write(requestBody);
      apiReq.end();
    });

    const parsed = JSON.parse(aiResponse);
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

    let structured = {};
    try {
      structured = JSON.parse(candidateText.trim().replace(/^```json/i, '').replace(/```$/i, ''));
    } catch {
      structured = { raw_ocr: candidateText };
    }

    return res.status(200).json({
      ok: true,
      ai_powered: true,
      data: structured,
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
