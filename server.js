'use strict';
const express=require('express'),app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'8kb'}));
const allowed=new Set([
  'https://kerimunlu917-eng.github.io',
  ...(process.env.FRONTEND_ORIGIN||'').split(',').map(x=>x.trim()).filter(Boolean)
]);
app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(origin&&allowed.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.sendStatus(204);
  next();
});
app.get('/health',(req,res)=>res.json({ok:true,service:'cyberguard-api'}));
app.post('/api/url-check',async(req,res)=>{
  let u;
  try{u=new URL(req.body.url)}catch{return res.status(400).json({error:'Invalid URL'})}
  if(!['http:','https:'].includes(u.protocol))return res.status(400).json({error:'HTTP(S) only'});
  const key=process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if(!key)return res.status(503).json({error:'API key missing'});
  try{
    const r=await fetch('https://safebrowsing.googleapis.com/v4/threatMatches:find?key='+encodeURIComponent(key),{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({client:{clientId:'cyberguard',clientVersion:'3.0'},threatInfo:{
        threatTypes:['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE','POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes:['ANY_PLATFORM'],threatEntryTypes:['URL'],threatEntries:[{url:u.href}]
      }})
    });
    if(!r.ok)return res.status(502).json({error:'Safe Browsing upstream error'});
    const d=await r.json(),m=d.matches||[];
    res.json({malicious:m.length>0,threats:[...new Set(m.map(x=>x.threatType))]});
  }catch{return res.status(502).json({error:'Threat lookup failed'})}
});
app.listen(process.env.PORT||3000,()=>console.log('CyberGuard API listening'));
