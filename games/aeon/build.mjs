import * as esbuild from 'esbuild';
import fs from 'fs';
fs.mkdirSync('dist', { recursive: true });
await esbuild.build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', outfile: 'dist/app.js', minify: true, target: 'es2020', loader: { '.json': 'json' }, legalComments: 'none', logLevel: 'warning' });
for (const f of ['index.html', 'style.css']) fs.copyFileSync('src/' + f, 'dist/' + f);
console.log('built', fs.statSync('dist/app.js').size);
