import fs from 'node:fs';
import crypto from 'node:crypto';
const files=fs.readdirSync('dist/assets').map(f=>'/assets/'+f);
let sw=fs.readFileSync('public/sw.js','utf8');const version=crypto.createHash('sha256').update(files.join(',')).digest('hex').slice(0,12);sw=sw.replace('josefa-v1','josefa-'+version).replace("const SHELL=['/'",`const SHELL=[${files.map(f=>JSON.stringify(f)).join(',')},'/'`);fs.writeFileSync('dist/sw.js',sw);
