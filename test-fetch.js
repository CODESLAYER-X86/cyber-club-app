const fs = require('fs');
const path = require('path');

async function fetchBase64(url) {
  if (!url) return '';
  try {
    if (url.startsWith('/')) {
      const localPath = path.join(process.cwd(), 'public', url);
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        const ext = url.split('.').pop()?.toLowerCase();
        let mime = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'svg') mime = 'image/svg+xml';
        return `data:${mime};base64,${buffer.toString('base64').substring(0, 50)}...`; // truncated for log
      }
      return 'File not found: ' + localPath;
    }
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

fetchBase64('/logo.png').then(console.log);
fetchBase64('/logo.svg').then(console.log);
