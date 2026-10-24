/* Tutor results tracker — reusable for every game.
 * Sends one finished-game record to the Tutor inbox via FormSubmit (no secrets:
 * the endpoint id below is a public routing alias, not a credential).
 * Usage in a game:
 *   <script src="tracker.js"></script>
 *   const T = TutorTracker.init({game:'math8-unit1-boss', defaultPlayer:'Sebastian'});
 *   T.record({id, lesson, skill, answer, correctFirstTry, hintUsed, solutionShown});
 *   T.finish({extra:{...}})   // sends unless preview mode
 * Preview mode: URL ?preview=1, or the on-page switch (T.mountControls(el)).
 */
(function(){
  const ENDPOINT='https://formsubmit.co/ajax/0fba0379de97a2210792247763de28df';
  const BEGIN='TUTORJSON>>', END='<<TUTORJSON';
  function init(opt){
    const qs=new URLSearchParams(location.search);
    const st={game:opt.game,version:opt.version||1,items:[],started:new Date().toISOString(),
      preview: qs.get('preview')==='1' || localStorage.getItem('tutor_preview')==='1',
      player: qs.get('player') || localStorage.getItem('tutor_player') || opt.defaultPlayer || 'Sebastian'};
    const api={state:st,
      record(it){st.items.push(Object.assign({t:new Date().toISOString()},it));},
      reset(){st.items=[];st.started=new Date().toISOString();},
      setPreview(v){st.preview=!!v;localStorage.setItem('tutor_preview',v?'1':'0');},
      setPlayer(n){st.player=(n||'').trim()||opt.defaultPlayer||'Sebastian';localStorage.setItem('tutor_player',st.player);},
      mountControls(el){
        el.innerHTML=`<label style="margin-right:14px">Player: <input id="tt_name" value="${st.player.replace(/"/g,'')}" style="width:9em;font-size:1em;padding:4px;margin:0"></label>
        <label><input type="checkbox" id="tt_prev" ${st.preview?'checked':''} style="width:auto;margin:0"> Parent preview (don't send results)</label>`;
        el.querySelector('#tt_name').onchange=e=>api.setPlayer(e.target.value);
        el.querySelector('#tt_prev').onchange=e=>api.setPreview(e.target.checked);
      },
      async finish(extra){
        const rec={schema:'tutor-result-v1',game:st.game,version:st.version,player:st.player,
          started:st.started,finished:new Date().toISOString(),page:location.origin+location.pathname,
          items:st.items,summary:extra||{}};
        const hist=JSON.parse(localStorage.getItem('tutor_results_'+st.game)||'[]');hist.push(rec);
        localStorage.setItem('tutor_results_'+st.game,JSON.stringify(hist.slice(-30)));
        if(st.preview) return {sent:false,reason:'preview'};
        try{
          const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
            body:JSON.stringify({_subject:`[tutor-results] ${st.game} – ${st.player}`,_template:'box',_captcha:'false',
              payload:BEGIN+JSON.stringify(rec)+END})});
          const j=await r.json().catch(()=>({}));
          return {sent:String(j.success)==='true',reason:j.message||r.status};
        }catch(e){return {sent:false,reason:String(e)};}
      }};
    return api;
  }
  window.TutorTracker={init};
})();
