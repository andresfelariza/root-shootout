/* Tutor Quest Engine v2.4: strategy card -> choose path -> items (mc | num | tap) with
 * confidence rating, hints, growth-mindset feedback, progress bar -> reflection -> scorecard.
 * Requires tracker.js. Usage: QuestEngine.start(CONFIG)  (see README). */
(function(){
const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const NS='no solution',INF='infinitely many';
function norm(s){s=String(s).toLowerCase().replace(/[−–]/g,'-').replace(/[$,°]/g,'').replace(/\s+/g,' ').trim().replace(/^[a-z]\s*(=|<=|≤)\s*/,'').replace(/ ?(degrees|deg|square units|sq units|units|weeks|minutes|min|months|rounds)$/,'');
 s=s.replace(/^(-?\d+(?:\.\d+)?)\s*(%|[a-z][a-z ]*)$/,(m,n,u)=>/^(no|none)/.test(u)?m:n);
 if(/infinit|all real|always/.test(s))return INF;if(/^(no sol|none|no$)/.test(s))return NS;
 let m=s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);if(m)return +m[1]/+m[2];
 if(/^-?\d*\.?\d+$/.test(s))return +s;return s}
function same(u,a){let x=norm(u),y=norm(a);return typeof x=='number'&&typeof y=='number'?Math.abs(x-y)<1e-9:x===y}
const GOOD=["Yes! Your strategy paid off.","Nailed it — that's careful thinking.","Correct! You checked your work like a pro.","Boom! Your brain just got stronger.","Exactly right. Notice what you did there!"];
const GROW=["Not yet — and that's how brains grow. Try the hint.","Mistakes are data! Re-read and try again.","Close call. Slow down and use the strategy card.","Good effort — every expert misses some. One more try!"];
const pick=a=>a[Math.random()*a.length|0];
let C,T,st;
function start(cfg){C=cfg;T=TutorTracker.init({game:C.game,defaultPlayer:C.defaultPlayer});T.mountControls($('#ctl'));intro();tryRestore()}
function intro(){T.reset();st={refl:undefined,points:0,seen:{},done:{},challenge:false,missed:[],sureWrong:0,firstTry:0,count:0,current:null};
 $('#app').innerHTML=`<div class="card center"><div class="big">${C.emoji}</div><h2>${C.title}</h2><p>${C.story}</p>
 <button class="go" onclick="QE.strategy()">Start the mission ➜</button></div>`}
function strategy(){$('#app').innerHTML=`<div class="card"><h2>🧠 Strategy Card</h2>${C.strategy}
 <p class="small">This card stays one tap away the whole game (📇 button).</p><button class="go" onclick="QE.hub()">I've got it ➜</button></div>`}
function total(){return C.paths.reduce((n,p)=>n+p.items.filter(i=>!i.challenge||st.challenge).length*(p.optional&&!st.optIn?.[p.id]?0:1),0)}
function doneCount(){return Object.keys(st.done).filter(k=>st.done[k].counted).length}
function bar(){const t=Math.max(total(),1),d=Math.min(doneCount(),t);return `<div class="prog"><div style="width:${d/t*100}%"></div></div><div class="small center">${d} / ${t} ${C.unit||'steps'} · <a href="#" onclick="QE.quit();return false">✕ Quit</a> ·${C.confBonus?` ⭐ ${st.points} pts ·`:''} <a href="#" onclick="QE.card();return false">📇 Strategy card</a></div>`}
function card(){const el=document.createElement('div');el.className='modal';el.innerHTML=`<div class="card">${C.strategy}${C.paths.filter(p=>p.strategy).map(p=>`<hr><h3>${p.emoji} ${p.name}</h3>${p.strategy}`).join('')}<button class="go" onclick="this.closest('.modal').remove()">Back</button></div>`;document.body.appendChild(el)}
function pathDone(p){return p.items.filter(i=>!i.challenge||st.challenge).every(i=>st.done[i.id])}
function hub(){st.optIn=st.optIn||{};const core=C.paths.filter(p=>!p.optional);
 if(core.every(pathDone)&&C.paths.filter(p=>p.optional&&st.optIn[p.id]).every(pathDone)&&!st.hubOnce){}
 const left=core.filter(p=>!pathDone(p));
 $('#app').innerHTML=bar()+`<div class="card"><h2>${C.hubTitle||'Choose your path'}</h2><p class="small">${C.hubHint||'You pick the order. Do them all to finish!'}</p>
 ${C.paths.map(p=>`<button class="path ${pathDone(p)&&(!p.optional||st.optIn[p.id])?'donep':''}" onclick="QE.enter('${p.id}')"><b>${p.emoji} ${p.name}</b>${p.optional?' <span class="tag">BONUS</span>':''}<br><span class="small">${p.desc}</span>${pathDone(p)&&(!p.optional||st.optIn[p.id])?' ✅':''}</button>`).join('')}
 ${C.challengeLabel?`<label class="chal"><input type="checkbox" ${st.challenge?'checked':''} onchange="QE.setChal(this.checked)"> ${C.challengeLabel}</label>`:''}
 ${left.length==0?`<button class="go" onclick="QE.reflect()">Finish mission 🏁</button>`:''}</div>`}
function setChal(v){st.challenge=v;hub()}
function enter(id){const p=C.paths.find(x=>x.id==id);if(p.optional)st.optIn[id]=true;st.path=p;if(p.strategy&&!st.seen[id]){st.seen[id]=1;$('#app').innerHTML=bar()+`<div class="card"><h2>🧠 ${p.emoji} Strategy Card: ${p.name}</h2>${p.strategy}<button class="go" onclick="QE.next()">Let's go ➜</button></div>`;return}nextItem()}
function nextItem(){const p=st.path;const it=p.items.find(i=>(!i.challenge||st.challenge)&&!st.done[i.id]);if(!it){return pathEnd()}show(it)}
function pathEnd(){$('#app').innerHTML=bar()+`<div class="card center"><div class="big">${st.path.emoji}✨</div><h2>${st.path.doneMsg||'Path complete!'}</h2><button class="go" onclick="QE.hub()">Back to map ➜</button></div>`}
function hcost(it){return C.confBonus?(it.hintCost??C.hintCost??0):0}
function show(it){st.current=it;st.sel=null;st.tries=0;st.hint=false;st.hintPaid=0;st.answers=[];st.conf=null;const p=st.path;
 let pas='';if(p.passage){pas=`<div class="card passage"><h3>${p.emoji} ${p.title||p.name}</h3>${p.passage.map((s,i)=>`<span class="sent ${it.type=='tap'?'tap':''}" data-i="${i}" onclick="${it.type=='tap'?`QE.sel(${i})`:''}">${s}</span> `).join('')}</div>`}
 let inp='';if(it.type=='mc')inp=it.opts.map((o,i)=>`<button class="opt" data-i="${i}" onclick="QE.sel(${i})">${o}</button>`).join('');
 else if(it.type=='num')inp=`<input id="numin" placeholder="${it.ph||'Type your answer'}" oninput="QE.sel(this.value)">`;
 else if(it.type=='steps'){st.si=0;st.wrongAny=false;st.shownAny=false;inp=`<div id="work" class="steps" style="display:none"></div><div id="stepq">${stepHTML(it)}</div>`}
 else inp=`<p class="small">👆 Tap the sentence in the passage above.</p>`;
 $('#app').innerHTML=bar()+pas+`<div class="card qcard">${it.challenge?'<span class="tag">🚀 CHALLENGE</span> ':''}<span class="small">${it.label||''}</span>
 ${it.ctx?`<div class="ctx">${it.ctx}</div>`:''}<div class="q">${it.q}</div>${inp}
 <div><button class="go" id="chk" onclick="QE.check()">Check ✔</button><button class="alt" onclick="QE.hintBtn()">💡 Hint${hcost(it)?` (−${hcost(it)} ⭐)`:''}</button></div><div id="fb"></div></div>`;
 if(it.type=='tap')window.scrollTo(0,0)}
function stepHTML(it){const s=it.steps[st.si];st.sel=null;st.stries=0;return `<div class="small">Move ${st.si+1} of ${it.steps.length}</div><div class="eqbox">${s.eq}</div><div class="q">${s.q||'What is the best next move?'}</div>`+s.opts.map((o,i)=>`<button class="opt" data-i="${i}" onclick="QE.sel(${i})">${o}</button>`).join('')}
function sel(v){st.sel=v;const it=st.current;if(it.type=='mc'||it.type=='steps')document.querySelectorAll('.opt').forEach(b=>b.classList.toggle('picked',+b.dataset.i===v));
 if(it.type=='tap')document.querySelectorAll('.sent').forEach(b=>b.classList.toggle('picked',+b.dataset.i===v))}
function hintBtn(){const c=hcost(st.current);let m='';if(!st.hint&&!st.hintPaid&&c){st.hintPaid=c;st.points=Math.max(0,st.points-c);m=` <span class="small">(−${c} ⭐)</span>`}st.hint=true;$('#fb').innerHTML=`<p class="hint">💡 ${st.current.h}${m}</p>`}
function check(){if(st.sel===null||st.sel==='')return $('#fb').innerHTML='<p class="small">Pick or type an answer first.</p>';
 if(st.tries==0&&st.conf===null){$('#fb').innerHTML=`<p><b>Before we check: how confident are you?</b> <span class="small">(No default: you must pick.)</span></p>${C.confBonus?`<p class="small">⭐ Honest confidence pays: 😎 Sure + right = <b>+5 bonus</b>. 😬 Guessing + not yet = <b>+3 honesty bonus</b> (knowing what you don't know is a superpower). 🙂 = no bonus.</p>`:''}
  <button class="alt" onclick="QE.conf(1)">😬 Guessing</button><button class="alt" onclick="QE.conf(2)">🙂 Kinda sure</button><button class="alt" onclick="QE.conf(3)">😎 Sure</button>`;return}
 evaluate()}
function conf(c){st.conf=c;evaluate()}
function isRight(it,v){if(it.type=='num')return same(v,it.a);if(it.type=='tap')return (Array.isArray(it.a)?it.a:[it.a]).includes(v);return v===it.a}
function ansText(it,v){return it.type=='mc'?it.opts[v]:it.type=='tap'?'S'+(v+1)+': '+st.path.passage[v]:String(v)}
function stepEval(){const it=st.current,v=st.sel,s=it.steps[st.si];st.answers.push('move'+(st.si+1)+': '+s.opts[v]);const w=$('#work');w.style.display='block';
 if(v!==s.a){st.wrongAny=true;st.stries++;if(st.stries<2){$('#fb').innerHTML=`<p class="bad">🌱 ${pick(GROW)}</p><p class="hint">💡 ${s.why}</p>`;st.hint=true;return}st.shownAny=true;w.innerHTML+=`<div>📖 ${s.opts[s.a]}${s.res?' → <b>'+s.res+'</b>':''}  (shown: ${s.why})</div>`}
 else w.innerHTML+=`<div>✔ ${s.opts[s.a]}${s.res?' → <b>'+s.res+'</b>':''}</div>`;
 st.si++;if(st.si<it.steps.length){$('#stepq').innerHTML=stepHTML(it);$('#fb').innerHTML=v===s.a?`<p class="good">✅ Good move!</p>`:'';return}
 $('#stepq').innerHTML='';finishItem(!st.wrongAny,st.shownAny);$('#fb').innerHTML=`<p class="${st.wrongAny?'bad':'good'}">${st.wrongAny?'🌱 Solved, with a fix along the way. That IS learning.':'✅ '+pick(GOOD)}</p>${st.bonusMsg}<div class="steps">${it.s}</div>${nextOrSC()}`;$('#chk').disabled=true}
function evaluate(){const it=st.current,v=st.sel;if(it.type=='steps'){st.tries++;return stepEval()}st.tries++;st.answers.push(ansText(it,v));const ok=isRight(it,v);
 if(ok){finishItem(st.tries==1,false);$('#fb').innerHTML=`<p class="good">✅ ${pick(GOOD)}${st.conf==1&&st.tries==1?' And you weren\'t even sure — trust your thinking more!':''}</p>${st.bonusMsg}<div class="steps">${it.s}</div>${nextOrSC()}`;$('#chk').disabled=true}
 else if(st.tries<2){$('#fb').innerHTML=`<p class="bad">🌱 ${pick(GROW)}${st.conf==3?' (You felt sure — that\'s a great moment to double-check how you got it.)':''}</p><p class="hint">💡 ${it.h}</p>`;st.hint=true}
 else{finishItem(false,true);$('#fb').innerHTML=`<p class="bad">🌱 This one's tricky — let's learn it.</p>${st.bonusMsg}<div class="steps">${it.s}</div><p class="small">Added to your review list. Learning from a worked example IS studying!</p>${nextOrSC()}`;$('#chk').disabled=true}}
function finishItem(first,shown){const it=st.current;let bonus=0;st.bonusMsg='';if(C.confBonus){const base=first?10:(shown?2:5);bonus=(st.conf==3&&first)?5:(st.conf==1&&!first)?3:0;st.points+=base+bonus;st.bonusMsg=`<p class="small">⭐ +${base} pts${bonus?` +${bonus} ${st.conf==3?'“Called it!” bonus':'honesty bonus'}`:''}</p>`}st.done[it.id]={counted:true};st.count++;if(first)st.firstTry++;else st.missed.push(it);if(!first&&st.conf==3)st.sureWrong++;
 T.record({id:it.id,lesson:st.path.id,skill:it.skill,question:it.q.replace(/<[^>]+>/g,''),answers:st.answers.slice(),correct:it.type=='mc'?it.opts[it.a]:it.type=='tap'?'S'+((Array.isArray(it.a)?it.a[0]:it.a)+1):it.a,
  correctFirstTry:first,hintUsed:st.hint,hintBought:st.hintPaid||0,solutionShown:shown,confidence:st.conf,bonus,challenge:!!it.challenge})}
function next(){nextItem()}
function nextOrSC(){const s=st.current.selfCheck;if(!s)return '<button class="go" onclick="QE.next()">Next ➜</button>';
 return `<div id="scbox" class="card"><h3>🔍 Check your own answer</h3><p class="small">Experts don't wait for a teacher: they check their own work.</p><div class="q">${s.q}</div>${s.opts.map((o,i)=>`<button class="opt scopt" onclick="QE.sc(${i})">${o}</button>`).join('')}</div>`}
function sc(i){const s=st.current.selfCheck,ok=i===s.a;let b=0;if(ok&&C.confBonus){b=C.selfCheckBonus??3;st.points+=b}
 const rec=T.state.items[T.state.items.length-1];if(rec&&rec.id===st.current.id)rec.selfCheck={answer:s.opts[i],correct:ok};
 $('#scbox').innerHTML=`<h3>🔍 Check your own answer</h3><p class="${ok?'good':'bad'}">${ok?'✅ Great self-check!':'🌱 Here is how to check it:'}${b?` <span class="small">⭐ +${b} self-check</span>`:''}</p><div class="steps">${s.why}</div><button class="go" onclick="QE.next()">Next ➜</button>`;save()}
function reflect(){$('#app').innerHTML=bar()+`<div class="card"><h2>🪞 One last question</h2><p><b>${C.reflectQ||'What strategy helped you most today, and why?'}</b></p>
 <div>${(C.reflectChips||[]).map(c=>`<button class="alt chip" onclick="document.getElementById('refl').value+=(document.getElementById('refl').value?' ':'')+this.textContent">${c}</button>`).join('')}</div>
 <textarea id="refl" rows="4" placeholder="Type a sentence or two…"></textarea><button class="go" onclick="QE.afterReflect()">${C.askTutorName?'Next ➜':'Submit & see my results 🏆'}</button></div>`}
function afterReflect(){st.refl=$('#refl').value.trim();if(C.studyCard)return study();return afterStudy()}
function study(){const v=st.studyCard||[];$('#app').innerHTML=bar()+`<div class="card"><h2>🗂️ Make your own study card</h2><p><b>${C.studyQ||'Write 1–2 key takeaways in your own words: things future-you should remember for the test.'}</b></p>
 <p class="small">${C.studyTip||'Tip: a good card has a rule AND a tiny example.'}</p>
 <textarea id="sc1" rows="2" placeholder="Takeaway 1">${esc(v[0]||'')}</textarea><textarea id="sc2" rows="2" placeholder="Takeaway 2 (optional)">${esc(v[1]||'')}</textarea>
 <button class="go" onclick="QE.afterStudy()">Next ➜</button></div>`}
function afterStudy(){if($('#sc1'))st.studyCard=[$('#sc1').value.trim(),$('#sc2').value.trim()].filter(Boolean);if(!C.askTutorName)return end();tname()}
function tname(){$('#app').innerHTML=bar()+`<div class="card"><h2>🤖 Name your tutor! <span class="small">(optional)</span></h2><p><b>Your tutor needs a new name. What should we call it?</b></p>
 <div>${(C.tutorChips||['Coach','Sage','Professor P','Mentor']).map(c=>`<button class="alt chip" onclick="document.getElementById('tname').value=this.textContent">${c}</button>`).join('')}</div>
 <input id="tname" maxlength="40" placeholder="Type a name, or tap one above"><button class="go" onclick="QE.end()">Submit & see my results 🏆</button><button class="alt" onclick="document.getElementById('tname').value='';QE.end()">Skip</button></div>`}
async function end(){const refl=st.refl!==undefined?st.refl:($('#refl')?$('#refl').value.trim():'');const tn=$('#tname')?$('#tname').value.trim():(st.tn||'');st.tn=tn;const conf={sure:0,sureRight:0};
 const summary={firstTry:st.firstTry,total:st.count,challengeMode:st.challenge,reflection:refl,sureButWrong:st.sureWrong,points:st.points,tutorName:tn,studyCard:st.studyCard||[]};
 $('#app').innerHTML=`<div class="card center"><div class="big">🏆</div><h2>${C.winMsg||'Mission complete!'}</h2><p id="sendst" class="small">Sending results…</p>
 <p><b>${st.firstTry} / ${st.count}</b> right on the first try.${C.confBonus?` ⭐ ${st.points} points.`:''}</p>${st.sureWrong?`<p class="small">😎 You felt sure on ${st.sureWrong} that tricked you — those are the best ones to review.</p>`:''}
 ${(st.studyCard||[]).length?`<div class="card"><h3>🗂️ Your study card</h3>${st.studyCard.map(x=>`<p>• ${esc(x)}</p>`).join('')}</div>`:''}<p>${refl?'Your strategy note: “'+esc(refl)+'”':''}</p></div>
 <div class="card"><h3>📋 Review list</h3>${st.missed.length?st.missed.map(m=>`<div class="miss"><b>${m.label||''}</b> ${m.q}<div class="steps">${m.s}</div></div>`).join(''):'<p>Nothing to review — amazing!</p>'}
 <button class="go" onclick="QE.intro()">Play again</button></div>`;
 st.screen='submit';save();const r=await T.finish(summary);if(r.sent||r.reason=='preview'){clearSave();st.screen='done'}$('#sendst').textContent=r.sent?'✅ Results sent to Tutor.':(r.reason=='preview'?'👀 Preview mode: results not sent.':'⚠️ Could not send ('+r.reason+') — saved on this device.')}

/* ---------- auto-save / resume ---------- */
function saveKey(){return 'tutor_save_'+C.game+(T.state.preview?'__preview':'')+'__'+String(T.state.player||'').trim().toLowerCase()}
function findItem(id){for(const p of C.paths)for(const i of p.items)if(i.id===id)return i;return null}
function save(){if(!st||!st.screen||st.screen=='done')return;st.key=st.key||saveKey();const w=$('#work'),f=$('#fb');
 const s={v:1,game:C.game,player:T.state.player,preview:T.state.preview,started:T.state.started,items:T.state.items,screen:st.screen,savedAt:new Date().toISOString(),
  st:{points:st.points,seen:st.seen,done:st.done,challenge:st.challenge,optIn:st.optIn||{},missed:st.missed.map(m=>m.id),sureWrong:st.sureWrong,firstTry:st.firstTry,count:st.count,
  refl:st.refl,tn:st.tn,studyCard:st.studyCard,hintPaid:st.hintPaid,pathId:st.path&&st.path.id,curId:st.current&&st.current.id,tries:st.tries,hint:st.hint,answers:st.answers,conf:st.conf,si:st.si,stries:st.stries,
  wrongAny:st.wrongAny,shownAny:st.shownAny,work:w?w.innerHTML:'',fb:f&&st.screen=='item'?f.innerHTML:''}};
 try{localStorage.setItem(st.key,JSON.stringify(s))}catch(e){}}
function clearSave(){try{localStorage.removeItem(st.key||saveKey())}catch(e){}}
function banner(html){let b=$('#qe-banner');if(!b){b=document.createElement('div');b.id='qe-banner';b.className='card small';$('#app').before(b)}b.innerHTML=html;b.style.display=html?'block':'none'}
function tryRestore(){let s;try{s=JSON.parse(localStorage.getItem(saveKey())||'null')}catch(e){}if(!s||!s.screen||s.screen=='done')return false;
 const o=s.st;T.state.items=s.items||[];T.state.started=s.started;
 Object.assign(st,{points:o.points,seen:o.seen||{},done:o.done||{},challenge:!!o.challenge,optIn:o.optIn||{},missed:(o.missed||[]).map(findItem).filter(Boolean),
  sureWrong:o.sureWrong,firstTry:o.firstTry,count:o.count,refl:o.refl,tn:o.tn,studyCard:o.studyCard,key:saveKey()});
 st.path=o.pathId?C.paths.find(p=>p.id===o.pathId):null;const sc=s.screen;
 if(sc=='item'&&st.path){const it=findItem(o.curId);if(it&&!st.done[it.id]){_show(it);Object.assign(st,{hintPaid:o.hintPaid||0,tries:o.tries||0,hint:!!o.hint,answers:o.answers||[],conf:o.conf??null,wrongAny:!!o.wrongAny,shownAny:!!o.shownAny});
   if(it.type=='steps'){st.si=o.si||0;$('#stepq').innerHTML=stepHTML(it);st.stries=o.stries||0;const w=$('#work');w.innerHTML=o.work||'';w.style.display=o.work?'block':'none'}
   $('#fb').innerHTML=o.fb||'';st.screen='item'}else{st.screen='item';nextItem()}}
 else if((sc=='pathStrategy'||sc=='pathEnd'||sc=='item')&&st.path){if(sc=='pathEnd')pathEnd();else nextItem()}
 else if(sc=='reflect')reflect();
 else if(sc=='study')study();else if(sc=='tname')tname();
 else if(sc=='submit'){end()}
 else hub();
 const name=esc(T.state.player||'friend');const X=Math.min(doneCount()+1,total()),Y=total();
 banner(`👋 Welcome back, ${name}! You were on question ${X} of ${Y} — picking up where you left off. <a href="#" onclick="QE.startOver();return false">Start over</a>`);
 save();return true}
function startOver(){if(!confirm('Start over from the beginning? Your saved progress in this game will be erased.'))return;clearSave();banner('');intro()}
function quit(){if(!confirm('Leave the game? Your progress is saved, so you can come back and pick up right where you left off.'))return;save();st.quit=true;
 $('#app').innerHTML=`<div class="card center"><div class="big">💾</div><h2>Progress saved!</h2><p>You can close this tab. Next time you open the game, you'll pick up right here.</p><button class="go" onclick="QE.resume()">Keep playing ➜</button></div>`}
function resume(){st.quit=false;tryRestore();banner('')}
window.addEventListener('beforeunload',e=>{if(st&&st.screen&&st.screen!='done'&&!st.quit){save();e.preventDefault();e.returnValue=''}});
const _hub=hub;hub=function(){_hub();if(!st.screen)st.key=saveKey();st.screen='hub';save()};
const _enter=enter;enter=function(id){st.screen='pathStrategy';_enter(id);save()};
const _show=show;show=function(it){_show(it);st.screen='item';save()};
const _pathEnd=pathEnd;pathEnd=function(){_pathEnd();st.screen='pathEnd';save()};
const _hintBtn=hintBtn;hintBtn=function(){_hintBtn();save()};
const _evaluate=evaluate;evaluate=function(){_evaluate();save()};
const _reflect=reflect;reflect=function(){_reflect();if(st.refl)$('#refl').value=st.refl;st.screen='reflect';save()};
const _study=study;study=function(){_study();st.screen='study';save()};const _tname=tname;tname=function(){_tname();if(st.tn)$('#tname').value=st.tn;st.screen='tname';save()};
window.QE={sc,afterStudy,startOver,quit,resume,afterReflect:(...a)=>afterReflect(...a),start,intro,strategy,hub,enter,sel,check,conf,hintBtn,next,reflect,end,card,setChal};window.QuestEngine={start,norm,same};
})();
