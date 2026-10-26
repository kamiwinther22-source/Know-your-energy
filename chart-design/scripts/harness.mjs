import fs from "fs"; import path from "path";
import { createRequire } from "module";
const require = createRequire("/opt/node-tools/node_modules/");
const { chromium } = require("playwright");
const ROOT="/tmp/claude-0/-home-user-Know-your-energy/83849644-63e7-51ca-ac3a-9fdb74e9cfd0/scratchpad/site";
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.exr':'application/octet-stream'};
const worker=(await import("/tmp/claude-0/-home-user-Know-your-energy/83849644-63e7-51ca-ac3a-9fdb74e9cfd0/scratchpad/site/worker.js")).default;
class KV{constructor(){this.m=new Map()}async get(k){return this.m.has(k)?this.m.get(k):null}async put(k,v){this.m.set(k,v)}async delete(k){this.m.delete(k)}async list({prefix=""}={}){return{keys:[...this.m.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})),list_complete:true}}}
const env={PASSES:new KV(),ANTHROPIC_API_KEY:"x",HumanDesign_key:"x",ADMIN_KEY:"x"};
const GATES=[1,2,5,8,10,13,14,17,20,21,25,31,34,36,40,43,46,47,51,57,59,61,62,63,15,29];
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,opts)=>{const u=String(url);
 if(u.includes("humandesignhub.app/v2/locations/search"))return new Response(JSON.stringify({results:[{timezone:"America/Chicago"}]}),{status:200});
 if(u.includes("humandesignhub.app/v2/timezone/resolve"))return new Response(JSON.stringify({datetime:"1990-08-14T23:15:00Z"}),{status:200});
 if(u.includes("humandesignhub.app/v2/simple-bodygraph")){const b=JSON.parse(opts.body).datetime;const alt=b.includes("1992");return new Response(JSON.stringify({type:alt?"Projector":"Generator",profile:alt?"1/3":"3/5",authority:alt?"Splenic":"Sacral",incarnation_cross:alt?"Left Angle Cross of Cycles":"Right Angle Cross of Planning",gates:alt?[3,9,11,16,18,22,26,27,33,35,41,44,45,48,50,52,55,56,58,60,64,6,12,24]:GATES}),{status:200});}
 throw new Error("outside call: "+u)};
export async function open(opts={}){
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:parseFloat(process.env.DSF||opts.dsf||2)});
 const p=await ctx.newPage();
 const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await p.route("http://site.test/**",r=>{let u=new URL(r.request().url()).pathname;if(u==="/")u="/index.html";const f=path.join(ROOT,decodeURIComponent(u));
  if(fs.existsSync(f)&&fs.statSync(f).isFile())r.fulfill({status:200,contentType:MIME[path.extname(f)]||"application/octet-stream",body:fs.readFileSync(f)});else r.fulfill({status:404,body:"nf"})});
 await p.route(/kwdoanchor\.workers\.dev/,async r=>{
  const req=r.request();const u=new URL(req.url());
  if(u.pathname==="/report"){return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({report:{sections:[{eyebrow:"Who you are",title:"The way you move",body:"Stand-in reading text. The real reading from the Claude API goes here. It speaks to the two of you together and says where the three systems agree and where they pull apart."},{eyebrow:"Right now",title:"This chapter",body:"Stand-in reading text, second section, so the layout shows more than one paragraph."}],signature:"Stand-in"}})})}
  const res=await worker.fetch(new Request("https://w.test"+u.pathname,{method:req.method(),headers:{Origin:"https://know-your-energy.com","Content-Type":"application/json"},body:req.postData()}),env,{waitUntil:()=>{}});
  return r.fulfill({status:res.status,contentType:"application/json",body:await res.text()})});
 await p.route(/orrery3d|three\.module|metal3d/,r=>r.abort());
 await p.goto("http://site.test/index.html",{waitUntil:"load"});await p.waitForTimeout(1500);
 return {b,p,errs};
}
export async function results(two=true){
 const {b,p,errs}=await open();
 await p.evaluate(async(two)=>{document.getElementById('heroEmail').value='test@example.com';await revealForm();if(two)setMode(true);
  const set=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}))}};
  set("p1f","Alex");set("p1l","Rivers");set("p1d","08/14/1990");set("p1t","04:15");set("p1ap","PM");
  const sel=(id)=>{const e=document.getElementById(id);if(e&&e.options&&e.options.length>1){e.value=e.options[1].value}};
  sel("p1tz");
  if(two){set("p2f","Casey");set("p2l","Moon");set("p2d","03/09/1992");set("p2t","09:40");set("p2ap","AM");sel("p2tz");}
  set("pEmail","test@example.com");
 },two);
 await p.evaluate(()=>generate());
 await p.waitForFunction(()=>document.getElementById("resultsWrap")&&document.getElementById("resultsWrap").style.display==="block",{timeout:30000});
 await p.waitForTimeout(3500);
 return {b,p,errs};
}
