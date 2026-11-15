// Builds index.html (standalone page) and, with --artifact <path>, the body-only file for publishing as a Claude artifact.
import { readFileSync, writeFileSync } from 'node:fs';
const read = (f) => readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const content = `<title>1346 Russell Road</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@600;700&family=IBM+Plex+Mono&family=Inter:wght@400;600&display=swap">
<style>
${read('style.css')}</style>
${read('body.html')}
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script>
${read('house.js')}
${read('app.js')}</script>
`;
writeFileSync(new URL('./index.html', import.meta.url), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}img{max-width:100%}</style></head><body>
${content}</body></html>
`);
const i = process.argv.indexOf('--artifact');
if (i > 0) writeFileSync(process.argv[i + 1], content);
console.log('built');
