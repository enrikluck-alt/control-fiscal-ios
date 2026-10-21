// Compatibility with an older GitHub Actions workflow. No Google code is included.
const fs = require('node:fs');
fs.mkdirSync('www', { recursive: true });
fs.writeFileSync('www/google-login.bundle.js', '// Diagnostic only: Google authentication disabled.\n');
console.log('Diagnostic stub generated; Google login remains disabled.');
