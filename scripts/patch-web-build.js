const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Add type="module" to ALL script tags that load JS files and don't already have it
html = html.replace(
  /<script([^>]*src="[^"]*\.js"[^>]*)>/g,
  (match, attrs) => {
    if (attrs.includes('type=')) return match; // already has a type
    return `<script type="module"${attrs}>`;
  }
);

fs.writeFileSync(indexPath, html);
console.log('✅ Patched index.html with type="module" on script tags');
console.log('Result:', html.match(/<script[^>]*\.js[^>]*>/g));
