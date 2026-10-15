import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const files={};const manifest={};
function scan(dir){for(const f of fs.readdirSync(dir)){const p=path.join(dir,f);if(fs.statSync(p).isDirectory())scan(p);else{const data=fs.readFileSync(p);const hash=crypto.createHash('sha256').update(data).digest('hex').slice(0,32);const key='/'+p.replace(/^dist\//,'');manifest[key]={hash,size:data.length};files[hash]={data,path:key};}}}
scan('dist');
if(process.argv[2]==='manifest'){console.log(JSON.stringify(manifest));process.exit();}
const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let jwt=input.jwt;
for(const bucket of input.buckets){const form=new FormData();for(const hash of bucket){const f=files[hash];const ext=path.extname(f.path);const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'}[ext]||'application/octet-stream';form.append(hash,new Blob([f.data.toString('base64')],{type:mime}),hash);}
const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/2f662015a960f43cae7194db50550158/workers/assets/upload?base64=true`,{method:'POST',headers:{Authorization:`Bearer ${input.jwt}`},body:form});const result=await r.json();if(!result.success)throw Error(JSON.stringify(result));if(result.result?.jwt)jwt=result.result.jwt;}
fs.writeFileSync('.deploy-completion.json',JSON.stringify({jwt}));console.log('Assets uploaded.');
