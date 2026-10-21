import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(issues=[], papers=[]){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hep-signal-test-'));
 for(const d of ['content','scripts','site']) fs.mkdirSync(path.join(dir,d),{recursive:true});
 for(const f of ['scripts/build.mjs','site/index.html']) fs.copyFileSync(path.join(root,f),path.join(dir,f));
 fs.writeFileSync(path.join(dir,'content/issues.json'),JSON.stringify(issues));
 fs.writeFileSync(path.join(dir,'content/papers.json'),JSON.stringify(papers));
 const run=()=>spawnSync(process.execPath,['scripts/build.mjs'],{cwd:dir,encoding:'utf8'});
 const output=f=>fs.readFileSync(path.join(dir,'dist',f),'utf8');
 const cleanup=()=>fs.rmSync(dir,{recursive:true,force:true});
 return {dir,run,output,cleanup};
}
const issue={number:'001',date:'2026-10-23',title:'An issue to test',intro:'A carefully reviewed opening editorial.',closing:'A meaningful editorial conclusion.',status:'published'};
function paper(n,tier='selection',status='approved'){
 const id=`2610.${String(10000+n).padStart(5,'0')}`;
 return {id,title:`Test paper ${n} on & mathematical <questions>`,authors:['First Scientist','Second Scientist'],announced:'2026-10-22',issue:'001',tier,status,headline:`Editorial headline ${n}`,summary:`The approved scientific account for test paper ${n}.`,why_it_matters:'This explains the contribution and scientific context.',what_to_watch:'Tests and further studies.',topics:['dark-matter','qcd']};
}
const complete=()=>[paper(1,'cover'),...Array.from({length:7},(_,i)=>paper(2+i)),...Array.from({length:4},(_,i)=>paper(9+i,'honorable'))];
test('empty starter builds cleanly, homepage links and subscriber script retained',()=>{
 const f=fixture();try {const r=f.run();assert.equal(r.status,0,r.stderr);const home=f.output('index.html');
 assert.equal((home.match(/class="topic" href="\/archive\//g)||[]).length,8);
 assert.equal((home.match(/45b9972c-ccfa-11f1-b704-ffc28d665f6e/g)||[]).length,2);
 assert.doesNotMatch(home,/subscribe-forms\.beehiiv/);
 assert.match(home,/id="hep-signal-motion-toggle"/);
 assert.match(f.output('archive/index.html'),/first scientifically reviewed papers/i);
 assert.match(f.output('issues/index.html'),/No editions have been published yet/);
 assert.match(f.output('sitemap.xml'),/\/issues\//);
 } finally {f.cleanup()}
});
test('published issue generates topic-filterable reviews, escapes user text, preserves unique pages',()=>{
 const f=fixture([issue],complete());try {const r=f.run();assert.equal(r.status,0,r.stderr);
 let review=f.output('reviews/2610.10001/index.html');
 assert.match(review,/Test paper 1 on &amp; mathematical &lt;questions&gt;/);
 assert.doesNotMatch(review,/<questions>/);
 assert.match(review,/\?topic=qcd/);assert.match(review,/\?topic=dark-matter/);
 assert.match(review,/https:\/\/arxiv.org\/abs\/2610.10001/);
 const archive=f.output('archive/index.html');
 assert.equal((archive.match(/class="card review-card"/g)||[]).length,12);
 assert.match(f.output('issues/001/index.html'),/An issue to test/);
 assert.match(f.output('index.html'),/Read the latest issue/);
 }finally{f.cleanup()}
});
test('draft paper and draft issue do not render publicly',()=>{
 const all=complete().concat({...paper(13),id:'2610.10013',status:'draft'});
 const f=fixture([issue,{...issue,number:'002',status:'draft'}],all);
 try {const r=f.run();assert.equal(r.status,0,r.stderr);
 assert.equal(fs.existsSync(path.join(f.dir,'dist/reviews/2610.10013/index.html')),false);
 assert.equal(fs.existsSync(path.join(f.dir,'dist/issues/002/index.html')),false);
 }finally{f.cleanup()}
});
test('published issue with incomplete selection fails the build',()=>{
 const f=fixture([issue],[paper(1,'cover')]);try {const r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/7–10/)}finally{f.cleanup()}
});
test('published issue requires complete editorial content and unique cover',()=>{
 const f=fixture([{...issue,closing:''}],complete());try {let r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/missing closing/)}finally{f.cleanup()}
 const arr=complete();arr[1].tier='cover';const g=fixture([issue],arr);try {let r=g.run();assert.notEqual(r.status,0);assert.match(r.stderr,/exactly one/)}finally{g.cleanup()}
});
test('invalid category is rejected, including inherited prototype keys',()=>{
 const arr=complete();arr[0].topics=['__proto__'];const f=fixture([issue],arr);
 try {const r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/recognized category/)}finally{f.cleanup()}
});
test('duplicate preprint is rejected',()=>{
 const arr=complete();arr.push({...arr[0]});const f=fixture([issue],arr);
 try {const r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/Duplicate arXiv ID/)}finally{f.cleanup()}
});
test('malformed or insecure issue archive link is rejected',()=>{
 const f=fixture([{...issue,email_archive_url:'http://bad.example'}],complete());
 try {const r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/invalid HTTPS/)}finally{f.cleanup()}
});
