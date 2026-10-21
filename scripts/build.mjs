#!/usr/bin/env node
/** The HEP Signal: dependency-free static archive generator. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const out = path.join(root, 'dist');
const SITE = 'https://thehepsignal.netlify.app';
const topics = [
 ['qcd','QCD & hadron physics'],
 ['colliders','Collider phenomenology'],
 ['higgs-electroweak','Higgs & electroweak physics'],
 ['flavor-precision','Flavor & precision tests'],
 ['neutrinos-astroparticle','Neutrinos & astroparticle physics'],
 ['cosmology-baryogenesis','Cosmology & baryogenesis'],
 ['dark-matter','Dark matter & hidden sectors'],
 ['eft-bsm','Effective field theory & BSM'],
];
const topicNames = Object.fromEntries(topics);
const topicSlugs = new Set(topics.map(([slug]) => slug));
const esc = x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc = encodeURIComponent;
const page = (file, content) => {const dest=path.join(out,file); fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content)};
const text = x => String(x||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
const validDate = x=> typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(new Date(x).getTime()) && new Date(x).toISOString().slice(0,10)===x;
function requireIt(condition,message){if(!condition) throw new Error(message);}
function load(file){let v=JSON.parse(read(file));requireIt(Array.isArray(v),`${file} must contain an array`);return v;}
const allPapers=load('content/papers.json');
const allIssues=load('content/issues.json');
const knownIssue = new Map();
for(const i of allIssues){
 requireIt(/^\d{3,}$/.test(i.number||''),`Issue has invalid number`);
 requireIt(validDate(i.date),`Issue ${i.number} has invalid date`);
 requireIt(['draft','published'].includes(i.status),`Issue ${i.number}: status must be draft or published`);
 requireIt(!knownIssue.has(i.number),`Duplicate issue ${i.number}`);
 knownIssue.set(i.number,i);
 if(i.email_archive_url) {
  let url; try { url = new URL(i.email_archive_url); } catch { throw new Error(`Issue ${i.number}: invalid archive link`); }
  requireIt(url.protocol === 'https:' && !url.username && !url.password && !!url.hostname, `Issue ${i.number}: invalid HTTPS archive link`);
 }
 if(i.status==='published') {
  for(const field of ['title','intro','closing']) requireIt(typeof i[field]==='string' && i[field].trim(), `Published issue ${i.number} missing ${field}`);
 }
}
const used = new Set();
for(const p of allPapers){
 requireIt(/^\d{4}\.\d{4,5}$/.test(p.id||''),`Invalid paper arXiv ID: ${p.id}`);
 requireIt(!used.has(p.id),`Duplicate arXiv ID ${p.id}`); used.add(p.id);
 for(const k of ['title','headline','summary','why_it_matters','what_to_watch']) requireIt(typeof p[k]==='string' && p[k].trim(),`Paper ${p.id} missing ${k}`);
 requireIt(Array.isArray(p.authors)&&p.authors.length&&p.authors.every(x=>typeof x==='string'),`Paper ${p.id} needs authors`);
 requireIt(validDate(p.announced),`Paper ${p.id} has invalid announced date`);
 requireIt(knownIssue.has(p.issue),`Paper ${p.id}: unknown issue ${p.issue}`);
 requireIt(['cover','selection','honorable'].includes(p.tier),`Paper ${p.id}: invalid tier`);
 requireIt(['draft','approved'].includes(p.status),`Paper ${p.id}: status must be draft or approved`);
 requireIt(Array.isArray(p.topics)&&p.topics.length&&p.topics.every(t=>topicSlugs.has(t))&&new Set(p.topics).size===p.topics.length,`Paper ${p.id}: topics must be unique, recognized category slugs`);
}
const issues=allIssues.filter(i=>i.status==='published').sort((a,b)=>b.date.localeCompare(a.date));
const publishedNumbers=new Set(issues.map(i=>i.number));
for(const i of issues){
 const entries=allPapers.filter(p=>p.issue===i.number && p.status==='approved');
 const covers=entries.filter(p=>p.tier==='cover').length;
 const main=entries.filter(p=>p.tier==='cover'||p.tier==='selection').length;
 const honorable=entries.filter(p=>p.tier==='honorable').length;
 requireIt(covers===1, `Published issue ${i.number} must have exactly one approved cover paper (found ${covers})`);
 requireIt(main>=7 && main<=10, `Published issue ${i.number} must have 7–10 approved main selections (found ${main})`);
 requireIt(honorable>=3 && honorable<=5, `Published issue ${i.number} must have 3–5 approved honorable mentions (found ${honorable})`);
}
const papers=allPapers.filter(p=>p.status==='approved'&&publishedNumbers.has(p.issue)).sort((a,b)=>b.announced.localeCompare(a.announced)||b.id.localeCompare(a.id));
const paperUrl = p=>`/reviews/${enc(p.id)}/`;
const issueUrl = i=>`/issues/${enc(i.number)}/`;
const issueFor = p => knownIssue.get(p.issue);
const prettyDate = d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric'});
const topicLinks = p => p.topics.map(t=>`<a class="tag" href="/archive/?topic=${enc(t)}">${esc(topicNames[t])}</a>`).join(' ');
const siteHead = (title, description, url='/')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#b31b1b"><meta name="description" content="${esc(description)}"><link rel="canonical" href="${SITE}${url}"><title>${esc(title)} — The HEP Signal</title><style>
:root{--red:#b31b1b;--ink:#1c1a17;--muted:#6b6459;--bg:#f9f7f7;--border:#e5dfdd;--serif:Georgia,'Times New Roman',serif;--sans:Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.75}a{color:var(--red);text-decoration:none}a:hover{text-decoration:underline}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #1f5e96;outline-offset:3px}.wrap{max-width:1100px;margin:auto;padding:0 32px}.strip{height:5px;background:var(--red)}header{background:white;border-bottom:1px solid var(--border)}.head{min-height:84px;display:flex;justify-content:space-between;align-items:center;gap:20px}.logo{font:700 27px var(--serif);letter-spacing:-.05em;color:var(--ink)}nav{display:flex;gap:20px;align-items:center;font-size:13px;font-weight:700}nav a{color:var(--ink)}nav a:hover{color:var(--red)}.sub{padding:12px 17px;background:var(--red);color:#fff!important}.intro{padding:67px 0 35px}.kicker{font:800 11px var(--sans);text-transform:uppercase;letter-spacing:.17em;color:var(--red)}h1,h2,h3{font-family:var(--serif);font-weight:500;line-height:1.15;letter-spacing:-.04em}h1{font-size:clamp(42px,5.8vw,67px);margin:16px 0 17px}h2{font-size:34px;margin:18px 0}h3{font-size:25px;margin:9px 0 13px}.lead{color:var(--muted);font-size:16px;line-height:1.85;max-width:750px}.tools{padding:24px;background:#fff;border:1px solid var(--border);display:flex;flex-wrap:wrap;gap:16px;align-items:end;margin:8px 0 25px}.tools label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--muted);font-weight:700;flex:1;min-width:185px}.tools input,.tools select{font:15px var(--sans);padding:12px;border:1px solid #d7d2ce;background:#fff;color:var(--ink);width:100%}.tags{display:flex;flex-wrap:wrap;gap:9px}.tag{font-size:11px;font-weight:750;background:#f3edeb;color:#8d2525;padding:5px 10px;display:inline-block}.filters{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 28px}.filters a{font-size:12px;color:var(--ink);border:1px solid var(--border);padding:8px 12px;background:white}.filters a[aria-current="true"]{border-color:var(--red);color:var(--red);font-weight:700}.count{font-size:13px;color:var(--muted);margin:0 0 22px}.list{display:grid;gap:16px;padding-bottom:90px}.card{background:white;border:1px solid var(--border);border-top:3px solid var(--red);padding:28px 32px}.meta{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:750}.card h2{font-size:30px;margin:10px 0 12px}.card h2 a{color:var(--ink)}.card h2 a:hover{color:var(--red)}.card p{max-width:850px;color:#514c47;font-size:14px;line-height:1.85}.card .tags{margin:16px 0}.more{font-weight:800;font-size:13px}.status{background:#fff;border-left:3px solid var(--red);padding:22px 25px;color:#555;margin-bottom:80px}.article{max-width:840px;margin:0 auto;padding:65px 32px 88px}.article h1{font-size:clamp(37px,5.6vw,60px)}.article .byline{color:var(--muted);font-size:13px}.article .original{background:#fff;border:1px solid var(--border);padding:21px 25px;margin:25px 0 40px;font-size:14px}.article .original a{font-weight:700}.article .prose{font:17px/1.85 var(--serif)}.article .prose p{margin:17px 0}.article section{margin:36px 0}.article h2{font-size:28px;border-top:1px solid var(--border);padding-top:23px}.back{display:inline-block;font-size:13px;font-weight:750;margin-bottom:28px}.issueslist{padding-bottom:90px}.label{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--red);font-weight:750}.disclaimer{font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:20px;margin-top:50px}footer{background:#fff;border-top:1px solid var(--border);font-size:12px;color:var(--muted);padding:33px 0 45px}footer a{color:#1f5e96}footer .wrap{display:flex;gap:18px;justify-content:space-between}@media(max-width:570px){.wrap{padding:0 21px}.head{min-height:75px}.logo{font-size:22px}nav{gap:12px;font-size:12px}nav a:not(.sub){display:none}.intro{padding-top:46px}.card{padding:24px}.article{padding:46px 21px 68px}.tools{padding:17px}footer .wrap{display:block}}
</style></head><body><div class="strip"></div><header><div class="wrap head"><a href="/" class="logo">The HEP Signal<span style="color:#b31b1b">.</span></a><nav aria-label="Main navigation"><a href="/archive/">Review archive</a><a href="/issues/">Past issues</a><a class="sub" href="/#subscribe">Subscribe ↗</a></nav></div></header>`;
const footer=`<footer><div class="wrap"><div><strong>The HEP Signal</strong> · Independent hep-ph research commentary<br>Selections are editorial assessments, not peer review. Not affiliated with arXiv.</div><div><a href="/">Home</a> · <a href="/archive/">Reviews</a> · <a href="/issues/">Issues</a></div></div></footer></body></html>`;
const tierName={cover:'The Strongest Signal',selection:'Selected paper',honorable:'Honorable mention'};
function paperCard(p){let issue=issueFor(p);return `<article class="card review-card" data-topics="${esc(p.topics.join(' '))}" data-query="${esc([p.headline,p.title,p.authors.join(' '),p.id,p.summary,p.topics.map(t=>topicNames[t]).join(' ')].join(' ').toLowerCase())}" data-tier="${esc(p.tier)}"><div class="meta">${esc(tierName[p.tier])} · Issue #${esc(p.issue)} · ${esc(prettyDate(p.announced))}</div><h2><a href="${paperUrl(p)}">${esc(p.headline)}</a></h2><p><strong>${esc(p.title)}</strong> · ${esc(p.authors.join(', '))} · arXiv:${esc(p.id)}</p><p>${esc(p.summary.slice(0,390))}${p.summary.length>390?'…':''}</p><div class="tags">${topicLinks(p)}</div><a class="more" href="${paperUrl(p)}">Read our review →</a> <span style="color:#999">·</span> <a class="more" href="https://arxiv.org/abs/${enc(p.id)}" target="_blank" rel="noopener noreferrer">Original preprint ↗</a></article>`}
function archive(){
 const opt=topics.map(([slug,name])=>`<option value="${slug}">${esc(name)}</option>`).join('');
 const filters=`<div class="filters" aria-label="Research topic filters"><a href="/archive/" id="allTopics">All topics</a>${topics.map(([s,n])=>`<a href="/archive/?topic=${enc(s)}" data-filter-topic="${s}">${esc(n)}</a>`).join('')}</div>`;
 const listing=papers.length?papers.map(paperCard).join('\n'):`<div class="status">Our archive is ready. The first scientifically reviewed papers will appear here after Issue #001 is approved and published. In the meantime, <a href="/#subscribe">subscribe for the Friday edition</a>.</div>`;
 const controls=`<form class="tools" role="search" id="archive-form"><label>Search our reviews<input id="reviewSearch" type="search" placeholder="Paper title, authors, arXiv ID, topic…" autocomplete="off"></label><label>Research field<select id="reviewTopic"><option value="">All research areas</option>${opt}</select></label><label>Selection type<select id="reviewTier"><option value="">All selections</option><option value="cover">The Strongest Signal</option><option value="selection">Main selection</option><option value="honorable">Honorable mention</option></select></label></form>`;
 const js=`<script>(()=>{const params=new URLSearchParams(location.search),field=document.getElementById('reviewTopic'),search=document.getElementById('reviewSearch'),tier=document.getElementById('reviewTier'),cards=[...document.querySelectorAll('.review-card')],none=document.getElementById('noresults'),count=document.getElementById('reviewCount'),allowed=new Set(${JSON.stringify(topics.map(x=>x[0]))});const initial=params.get('topic');if(allowed.has(initial))field.value=initial;function update(){const topic=field.value,q=search.value.trim().toLowerCase(),t=tier.value;let visible=0;for(const card of cards){const ok=(!topic||card.dataset.topics.split(' ').includes(topic))&&(!q||card.dataset.query.includes(q))&&(!t||card.dataset.tier===t);card.hidden=!ok;if(ok)visible++}if(count)count.textContent=visible+' reviewed paper'+(visible===1?'':'s')+' shown';if(none)none.hidden=(visible!==0||cards.length===0);for(const a of document.querySelectorAll('.filters a'))a.setAttribute('aria-current',String((a.dataset.filterTopic||'')===topic));const url=new URL(location.href);if(topic)url.searchParams.set('topic',topic);else url.searchParams.delete('topic');history.replaceState(null,'',url.pathname+url.search+url.hash)};field.addEventListener('change',update);tier.addEventListener('change',update);search.addEventListener('input',update);document.getElementById('archive-form').addEventListener('submit',e=>e.preventDefault());update()})();</script>`;
 page('archive/index.html',siteHead('Research review archive','Search the selected and reviewed arXiv hep-ph papers by topic, author, and issue.','/archive/')+`<main class="wrap"><section class="intro"><div class="kicker">Curated paper archive</div><h1>Find the signal.</h1><p class="lead">Browse our published scientific assessments by subject. A single paper can appear in several research areas. Every review belongs to an approved weekly issue; we do not automatically reproduce every hep-ph submission.</p></section>${filters}${controls}<p class="count" id="reviewCount" aria-live="polite"></p><div class="list" id="reviewList">${listing}</div><div class="status" id="noresults" hidden>No reviews match these filters. Try another search or subject.</div></main>${js}${footer}`);
}
function paperPage(p){const issue=issueFor(p); const desc=p.summary.length>160?p.summary.slice(0,157)+'…':p.summary;
 page(`reviews/${p.id}/index.html`,siteHead(p.headline,desc,paperUrl(p))+`<main class="article"><a class="back" href="/archive/">← Browse research archive</a><div class="kicker">${esc(tierName[p.tier])} · Issue #${esc(p.issue)}</div><h1>${esc(p.headline)}</h1><div class="byline">Our scientific reading · First announced ${esc(prettyDate(p.announced))} · <a href="${issueUrl(issue)}">Read Issue #${esc(p.issue)}</a></div><div class="original"><strong>Original preprint</strong><br><a href="https://arxiv.org/abs/${enc(p.id)}" target="_blank" rel="noopener noreferrer">${esc(p.title)} ↗</a><br>${esc(p.authors.join(', '))}<br>arXiv:${esc(p.id)} · <a href="https://arxiv.org/pdf/${enc(p.id)}" target="_blank" rel="noopener noreferrer">PDF ↗</a><div class="tags" style="margin-top:14px">${topicLinks(p)}</div></div><section><div class="label">Our reading</div><div class="prose">${text(p.summary)}</div></section><section><h2>Why it matters</h2><div class="prose">${text(p.why_it_matters)}</div></section><section><h2>What to watch</h2><div class="prose">${text(p.what_to_watch)}</div></section>${p.caveats?`<section><h2>Key caveats</h2><div class="prose">${text(p.caveats)}</div></section>`:''}<p class="disclaimer">An editorial reading of an arXiv preprint, not an independent verification of every calculation or formal peer review. Scientific claims and limitations should be evaluated in the original manuscript.</p><p><a class="back" href="/archive/">← Back to the archive</a></p></main>${footer}`)
}
function issuesIndex(){let list=issues.length?issues.map(i=>{const n=papers.filter(p=>p.issue===i.number).length;return `<article class="card"><div class="meta">Issue #${esc(i.number)} · ${esc(prettyDate(i.date))} · ${n} reviewed papers</div><h2><a href="${issueUrl(i)}">${esc(i.title)}</a></h2><p>${esc(i.intro?.slice(0,320)||'Read the scientific highlights and selected papers from this edition.')}</p><a href="${issueUrl(i)}" class="more">Read issue →</a></article>`}).join(''):`<div class="status">No editions have been published yet. The first issue will appear here after editorial approval.</div>`;
 page('issues/index.html',siteHead('Past issues','Read the complete archive of The HEP Signal weekly research selections.','/issues/')+`<main class="wrap"><section class="intro"><div class="kicker">The weekly editions</div><h1>Past issues.</h1><p class="lead">Every published Friday edition, accessible in one place. Discover the issue that featured a paper or browse individual scientific reviews by topic.</p></section><div class="list issueslist">${list}</div></main>${footer}`)
}
function issuePage(i){const pi=papers.filter(p=>p.issue===i.number).sort((a,b)=>({cover:0,selection:1,honorable:2}[a.tier]-{cover:0,selection:1,honorable:2}[b.tier]));
 page(`issues/${i.number}/index.html`,siteHead(`Issue #${i.number} — ${i.title}`,i.intro||'Weekly hep-ph selection',issueUrl(i))+`<main class="wrap"><section class="intro"><a class="back" href="/issues/">← All issues</a><div class="kicker">Issue #${esc(i.number)} · ${esc(prettyDate(i.date))}</div><h1>${esc(i.title)}</h1><p class="lead">${esc(i.intro||'')}</p>${i.email_archive_url?`<p><a class="more" href="${esc(i.email_archive_url)}" target="_blank" rel="noopener noreferrer">Read the complete original email ↗</a></p>`:''}</section><div class="list">${pi.map(paperCard).join('')}</div>${i.closing?`<section style="padding-bottom:55px"><div class="kicker">Beyond the background</div><h2>What we take from this week</h2><div class="lead">${text(i.closing)}</div></section>`:''}</main>${footer}`)
}
function latestSection(){let i=issues[0];return `<section class="section rule" id="latest-issue"><div class="page"><div class="section-head"><div class="eyebrow">Our published reviews</div><h2>${i?'The latest issue.':'The review archive is taking shape.'}</h2><p>${i?`Issue #${esc(i.number)} · ${esc(prettyDate(i.date))} · ${esc(i.title)}. Browse its papers by topic, or read the edition in full.`:'Our first scientifically reviewed selections will appear here after the inaugural issue is published. The archive will grow every Friday.'}</p><p><a class="btn" href="${i?issueUrl(i):'/archive/'}">${i?'Read the latest issue':'Explore the review archive'} <span aria-hidden="true">↗</span></a> &nbsp; <a style="font-size:13px;font-weight:750;color:#b31b1b" href="/archive/">All reviews →</a></p></div></div></section>`}
function buildHome(){let s=read('site/index.html');const start='<!-- LATEST_ISSUE_START -->',end='<!-- LATEST_ISSUE_END -->';requireIt(s.includes(start)&&s.includes(end),'Homepage must define latest issue marker');s=s.replace(new RegExp(`${start}[\\s\\S]*?${end}`),`${start}\n${latestSection()}\n${end}`);page('index.html',s)}
function sitemap(){let urls=['/','/archive/','/issues/',...issues.map(issueUrl),...papers.map(paperUrl)];let data=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${SITE}${u}</loc></url>`).join('')}</urlset>`;page('sitemap.xml',data);page('robots.txt','User-agent: *\nAllow: /\nSitemap: '+SITE+'/sitemap.xml\n')}
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
buildHome();archive();issuesIndex();for(const i of issues)issuePage(i);for(const p of papers)paperPage(p);sitemap();
page('404.html',siteHead('Page not found','Page not found','/')+`<main class="wrap intro"><div class="kicker">404</div><h1>Signal not found.</h1><p class="lead">This page does not exist. <a href="/archive/">Browse our research archive</a> or <a href="/">return to the homepage</a>.</p></main>${footer}`);
console.log(`Built ${papers.length} reviewed papers and ${issues.length} issues in dist/`);
