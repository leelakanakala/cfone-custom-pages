// Build script to bundle pages into worker.js
// This reads HTML files and inlines them into the worker

const fs = require('fs');
const path = require('path');

// Read HTML files
const blockPageHTML = fs.readFileSync(path.join(__dirname, 'pages/block/index.html'), 'utf-8');
const coachingPageHTML = fs.readFileSync(path.join(__dirname, 'pages/coaching/index.html'), 'utf-8');

// Read worker template
const workerTemplate = fs.readFileSync(path.join(__dirname, 'worker-template.js'), 'utf-8');

// Replace placeholders with actual HTML
let workerContent = workerTemplate
  .replace('__BLOCK_PAGE_HTML__', blockPageHTML.replace(/`/g, '\\`').replace(/\$/g, '\\$'))
  .replace('__COACHING_PAGE_HTML__', coachingPageHTML.replace(/`/g, '\\`').replace(/\$/g, '\\$'));

// Write to root worker.js
fs.writeFileSync(path.join(__dirname, '../worker.js'), workerContent);

console.log('✅ Worker built successfully!');
console.log('📦 Pages bundled:');
console.log('   - Block page (/gateway/)');
console.log('   - Coaching page (/coaching/)');
