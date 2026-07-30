const { URL } = require('url');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'BACKEND_URL is not configured' }));
    return;
  }

  const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path || '');
  const targetPath = rawPath ? `/${rawPath}` : '/';
  const requestUrl = new URL(targetPath + (req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''), backendBase);

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    const lower = key.toLowerCase();
    if (['host', 'connection', 'content-length'].includes(lower)) continue;
    headers[key] = value;
  }

  try {
    const init = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const bodyBuffer = await readBody(req);
      init.body = bodyBuffer.toString(); // Конвертируем Buffer в string для fetch
    }

    const upstream = await fetch(requestUrl.toString(), init);
    const bodyText = await upstream.text();

    res.statusCode = upstream.status;
    
    // Копируем заголовки от бэкенда
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(lower)) return;
      res.setHeader(key, value);
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.end(bodyText);
  } catch (error) {
    console.error('Proxy error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Proxy failed', details: error.message }));
  }
};