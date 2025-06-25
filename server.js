const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'registrations.jsonl');

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handleRegister(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const data = querystring.parse(body);
    if (!data.fullName || !data.email || !data.features) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Missing required fields');
      return;
    }
    const entry = {
      timestamp: new Date().toISOString(),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '',
      sectors: Array.isArray(data.sectors) ? data.sectors : (data.sectors ? [data.sectors] : []),
      otherSector: data.otherSector || '',
      features: data.features,
      extra: data.extra || ''
    };
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(dataFile, line, err => {
      if (err) {
        console.error('Error writing file', err);
      }
    });
    res.writeHead(302, { 'Location': '/thanks.html' });
    res.end();
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/' || req.url === '/index.html') {
      return serveStatic(res, path.join(__dirname, 'public', 'index.html'), 'text/html; charset=utf-8');
    }
    if (req.url === '/style.css') {
      return serveStatic(res, path.join(__dirname, 'public', 'style.css'), 'text/css');
    }
    if (req.url === '/thanks.html') {
      return serveStatic(res, path.join(__dirname, 'public', 'thanks.html'), 'text/html; charset=utf-8');
    }
  } else if (req.method === 'POST' && req.url === '/register') {
    return handleRegister(req, res);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
