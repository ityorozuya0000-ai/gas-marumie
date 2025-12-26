const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure dist exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// 1. Build Client (React)
build({
  entryPoints: ['src/client/index.tsx'],
  bundle: true,
  outfile: 'dist/client.js',
  minify: true,
  target: ['es2020'],
  define: { 'process.env.NODE_ENV': '"production"' },
}).then(() => {
  try {
    const clientJs = fs.readFileSync('dist/client.js', 'utf8');
    const html = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Marumie GAS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
      /* Basic Loading Spinner */
      .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      ${clientJs}
    </script>
  </body>
</html>`;
    fs.writeFileSync('dist/index.html', html);
    console.log('Client build complete: dist/index.html');
    // Clean up temp file
    fs.unlinkSync('dist/client.js');
  } catch (e) {
    console.error('Error building HTML:', e);
  }
}).catch((e) => { console.error(e); process.exit(1); });

// 2. Build Server (GAS)
build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  outfile: 'dist/Code.gs',
  format: 'iife',
  globalName: '_global',
  banner: {
    js: 'var _global = this;',
  },
  footer: {
    js: `
function doGet(e) { return _global.doGet(e); }
function getInitialData() { return _global.getInitialData(); }
function addTransaction(data) { return _global.addTransaction(data); }
function updateTransaction(data) { return _global.updateTransaction(data); }
function deleteTransaction(id) { return _global.deleteTransaction(id); }
function addCategory(data) { return _global.addCategory(data); }
function updateCategory(data) { return _global.updateCategory(data); }
function deleteCategory(id) { return _global.deleteCategory(id); }
        `,
  },
  target: 'es2019',
}).then(() => {
  fs.copyFileSync('appsscript.json', 'dist/appsscript.json');
  console.log('Server build complete: dist/Code.gs');
}).catch((e) => { console.error(e); process.exit(1); });
