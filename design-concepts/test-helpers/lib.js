const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'),path=require('path');
const ROOT='/home/user/Know-your-energy';
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.hdr':'application/octet-stream','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
async function open(q,opts={}){const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:opts.dsf||1});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text().slice(0,200))});
 await p.route('http://site.test/**',r=>{let u=new URL(r.request().url()).pathname;if(u==='/')u='/index.html';const f=path.join(ROOT,decodeURIComponent(u));
  if(fs.existsSync(f)&&fs.statSync(f).isFile())r.fulfill({status:200,contentType:MIME[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});else r.fulfill({status:404,body:'nf'})});
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.route(/workers\.dev|know-your-energy\.com\/(check|generate|api)/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"active":false,"freeReadingUsed":false}'}));
 if(process.env.NO3D)await p.route(/orrery3d|three\.module|metal3d/,r=>r.abort());
 await p.goto('http://site.test/index.html'+(q||''),{waitUntil:'load'});await p.waitForTimeout(opts.wait||2500);
 return {b,p,errs}}
module.exports={open};
