'use strict';

const ALLOWED_ORIGIN = 'https://kerimunlu917-eng.github.io';
const MAX_URL_LENGTH = 2048;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.headers.origin && req.headers.origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = req.body && req.body.url;
  if (typeof raw !== 'string' || raw.length > MAX_URL_LENGTH) {
    return res.status(400).json({ error: 'A valid URL is required' });
  }

  let url;
  try { url = new URL(raw); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    return res.status(400).json({ error: 'Only credential-free HTTP(S) URLs are allowed' });
  }

  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key) return res.status(503).json({ error: 'Safe Browsing is not configured on the server' });

  try {
    const upstream = await fetch(
      'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + encodeURIComponent(key),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'cyberguard', clientVersion: '3.1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: url.href }]
          }
        })
      }
    );
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Google Safe Browsing request failed' });
    }
    const data = await upstream.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];
    return res.status(200).json({
      malicious: matches.length > 0,
      threats: [...new Set(matches.map(match => match.threatType).filter(Boolean))]
    });
  } catch {
    return res.status(502).json({ error: 'Threat lookup failed' });
  }
};
