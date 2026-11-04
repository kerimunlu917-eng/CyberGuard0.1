'use strict';

const express = require('express');
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '8kb', strict: true }));

const allowedOrigins = new Set([
  'https://kerimunlu917-eng.github.io',
  ...(process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

// Keep responses private and prevent browsers from guessing content types.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) return res.sendStatus(403);
    return res.sendStatus(204);
  }
  next();
});

// Lightweight per-IP throttling. This protects the public endpoint without
// requiring another package or an external rate-limit service.
const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

function rateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  let bucket = buckets.get(ip);

  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    buckets.set(ip, bucket);
  }

  bucket.count += 1;
  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - bucket.count)));

  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - bucket.startedAt)) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Çok fazla istek gönderildi. Bir dakika sonra tekrar deneyin.' });
  }

  // Opportunistically remove expired entries to keep memory bounded.
  if (buckets.size > 1000) {
    for (const [key, value] of buckets) {
      if (now - value.startedAt >= WINDOW_MS) buckets.delete(key);
    }
  }
  next();
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'cyberguard-api' });
});

app.post('/api/url-check', rateLimit, async (req, res) => {
  const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  if (!rawUrl || rawUrl.length > 2048) {
    return res.status(400).json({ error: 'URL boş olamaz ve 2048 karakteri aşamaz.' });
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Geçerli bir URL girin.' });
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return res.status(400).json({ error: 'Yalnızca HTTP ve HTTPS adresleri desteklenir.' });
  }
  if (url.username || url.password) {
    return res.status(400).json({ error: 'Kullanıcı bilgisi içeren URL adresleri kabul edilmez.' });
  }

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Harici tehdit kontrolü şu anda yapılandırılmamış.' });
  }

  try {
    const endpoint = new URL('https://safebrowsing.googleapis.com/v4/threatMatches:find');
    endpoint.searchParams.set('key', apiKey);

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(7000),
      body: JSON.stringify({
        client: { clientId: 'cyberguard', clientVersion: '3.1' },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION'
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: url.href }]
        }
      })
    });

    if (!upstream.ok) {
      // Do not expose provider details or credentials to the public client.
      return res.status(502).json({ error: 'Tehdit veritabanına şu anda ulaşılamıyor.' });
    }

    const data = await upstream.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];
    const threats = [...new Set(matches.map((match) => match.threatType).filter(Boolean))];

    return res.json({
      checked: true,
      malicious: matches.length > 0,
      threats
    });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError';
    return res.status(502).json({
      error: timedOut
        ? 'Tehdit kontrolü zaman aşımına uğradı.'
        : 'Tehdit kontrolü tamamlanamadı.'
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'İstenen kaynak bulunamadı.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error?.type === 'entity.too.large' ? 413 : 400;
  res.status(status).json({
    error: status === 413 ? 'İstek boyutu çok büyük.' : 'İstek biçimi geçersiz.'
  });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`CyberGuard API hazır: port ${port}`));
}

module.exports = app;
