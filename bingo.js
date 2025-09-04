'use strict';

(function(){
  const cm = v => v * 28.3464567; 

  // PDF fontları
  let FONT_TEXT = 'helvetica';
  let FONT_NUM  = 'helvetica';

  const ready = fn => (document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn());
  ready(init);

  function init(){

    /* ===== Helpers ===== */
    const hexToRgb = (hex, fb=[255,122,0])=>{
      const m = String(hex||'').trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      return m ? [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)] : fb;
    };
    const transliterate = s => s
      .replace(/İ/g,'I').replace(/ı/g,'i')
      .replace(/Ş/g,'S').replace(/ş/g,'s')
      .replace(/Ğ/g,'G').replace(/ğ/g,'g')
      .replace(/Ç/g,'C').replace(/ç/g,'c')
      .replace(/Ö/g,'O').replace(/ö/g,'o')
      .replace(/Ü/g,'U').replace(/ü/g,'u');

    function fitTextToWidth(doc, text, maxW, maxChars=36, minSize=8, maxSize=12){
      let t = (text||'').trim();
      if (t.length > maxChars) t = t.slice(0, maxChars).trim() + '…';
      let size = maxSize;
      while(size >= minSize){
        doc.setFontSize(size);
        if (doc.getTextWidth(t) <= maxW) return {text:t, size};
        size -= 0.5;
      }
      while(doc.getTextWidth(t + '…') > maxW && t.length>1) t = t.slice(0,-1);
      return {text:(t + '…'), size:minSize};
    }

    async function tryLoadUnicodeFont(doc){
      const candidates = ['fonts/NotoSans-Regular.ttf','fonts/DejaVuSans.ttf'];
      for(const url of candidates){
        try{
          const r = await fetch(url, {cache:'no-store'});
          if(!r.ok) continue;
          const buf = await r.arrayBuffer();
          const b64 = await new Promise(res=>{
            const fr = new FileReader();
            fr.onload = () => res(fr.result.split(',')[1]);
            fr.readAsDataURL(new Blob([buf]));
          });
          doc.addFileToVFS('Uni.ttf', b64);
          doc.addFont('Uni.ttf', 'Uni', 'normal');
          FONT_TEXT = 'Uni';
          FONT_NUM  = 'Uni';
          break;
        }catch(_){}
      }
      try{
        const r = await fetch('fonts/DejaVuSans-Bold.ttf', {cache:'no-store'});
        if(r.ok){
          const buf = await r.arrayBuffer();
          const b64 = await new Promise(res=>{
            const fr = new FileReader();
            fr.onload = () => res(fr.result.split(',')[1]);
            fr.readAsDataURL(new Blob([buf]));
          });
          doc.addFileToVFS('UniBold.ttf', b64);
          doc.addFont('UniBold.ttf', 'Uni', 'bold');
        }
      }catch(_){}
    }

    /* ===== 90-ball generator ===== */
    const COLS=9, ROWS=3, CARDS_PER_STRIP=6;
    const RANGES = [
      [...Array(9).keys()].map(x=>x+1),
      [...Array(10).keys()].map(x=>x+10),
      [...Array(10).keys()].map(x=>x+20),
      [...Array(10).keys()].map(x=>x+30),
      [...Array(10).keys()].map(x=>x+40),
      [...Array(10).keys()].map(x=>x+50),
      [...Array(10).keys()].map(x=>x+60),
      [...Array(10).keys()].map(x=>x+70),
      [...Array(11).keys()].map(x=>x+80)
    ];
    const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1)|0); [a[i],a[j]]=[a[j],a[i]]; } return a; };

    function generateStrip(){
      const ticketsCols = Array.from({length:6},()=>Array.from({length:COLS},()=>[]));
      const ticketTotal = Array(6).fill(0);
      for(let col=0; col<COLS; col++){
        const nums = shuffle([...RANGES[col]]);
        const colCounts = Array(6).fill(0);
        for(const n of nums){
          const cand=[];
          for(let i=0;i<6;i++) if(ticketTotal[i]<15 && colCounts[i]<3) cand.push(i);
          if(!cand.length) return null;
          cand.sort((i,j)=> (ticketTotal[i]-ticketTotal[j]) || (colCounts[i]-colCounts[j]));
          const pick = cand.length>=3 ? cand[Math.floor(Math.random()*3)] : cand[0];
          ticketsCols[pick][col].push(n);
          ticketTotal[pick]++; colCounts[pick]++;
        }
      }
      if(ticketTotal.some(t=>t!==15)) return null;

      const tickets=[];
      for(let t=0;t<6;t++){
        const colCounts=ticketsCols[t].map(c=>c.length);
        const rowCounts=[0,0,0];
        const rowsForCol=Array.from({length:COLS},()=>[]);
        for(let c=0;c<COLS;c++) if(colCounts[c]===3){ rowsForCol[c]=[0,1,2]; rowCounts[0]++;rowCounts[1]++;rowCounts[2]++; }
        for(let c=0;c<COLS;c++) if(colCounts[c]===2){
          const ord=[0,1,2].sort((a,b)=>rowCounts[a]-rowCounts[b]);
          rowsForCol[c]=[ord[0],ord[1]]; rowCounts[ord[0]]++; rowCounts[ord[1]]++;
        }
        for(let c=0;c<COLS;c++) if(colCounts[c]===1){
          const r=[0,1,2].sort((a,b)=>rowCounts[a]-rowCounts[b])[0];
          rowsForCol[c]=[r]; rowCounts[r]++;
        }
        for(let k=0;k<100 && !(rowCounts[0]===5&&rowCounts[1]===5&&rowCounts[2]===5); k++){
          const hi=rowCounts.indexOf(Math.max(...rowCounts));
          const lo=rowCounts.indexOf(Math.min(...rowCounts));
          let moved=false;
          for(let c=0;c<COLS;c++){
            if(rowsForCol[c].length===1 && rowsForCol[c][0]===hi){ rowsForCol[c]=[lo]; rowCounts[hi]--; rowCounts[lo]++; moved=true; break; }
            if(rowsForCol[c].length===2 && rowsForCol[c].includes(hi) && !rowsForCol[c].includes(lo)){
              const other=rowsForCol[c].find(r=>r!==hi);
              rowsForCol[c]=[other,lo]; rowCounts[hi]--; rowCounts[lo]++; moved=true; break;
            }
          }
          if(!moved) break;
        }
        if(!(rowCounts[0]===5&&rowCounts[1]===5&&rowCounts[2]===5)) return null;
        const grid = Array.from({length:ROWS},()=>Array(COLS).fill(null));
        for(let c=0;c<COLS;c++){
          const vals=[...ticketsCols[t][c]].sort((a,b)=>a-b);
          const rows=[...rowsForCol[c]].sort((a,b)=>a-b);
          vals.forEach((v,i)=>{ grid[rows[i]][c]=v; });
        }
        tickets.push(grid);
      }
      return tickets;
    }
    function generateStripWithRetry(max=400){ for(let i=0;i<max;i++){ const g=generateStrip(); if(g) return g; } throw new Error('Geçerli strip üretilemedi.'); }

    const board = document.getElementById('board-90');
    const gridDrawn = document.getElementById('drawn-grid');
    const lastEl = document.getElementById('last-number');

    const ALL = Array.from({length:90}, (_,i)=>i+1);
    let called = [];

    function buildBoard(){
      board.innerHTML='';
      for(let r=0;r<6;r++){
        for(let c=0;c<15;c++){
          const n = r*15 + c + 1; 
          const d = document.createElement('div');
          d.className='cell';
          d.dataset.n = n;
          d.textContent = n;
          board.appendChild(d);
        }
      }
    }
    function markBoard(){
      document.querySelectorAll('#board-90 .cell').forEach(el=>{
        el.classList.toggle('mark', called.includes(+el.dataset.n));
      });
    }
    function renderLists(){
      gridDrawn.innerHTML='';
      for(const n of [...called].reverse()){
        const s=document.createElement('span'); s.className='pill'; s.textContent=n;
        gridDrawn.appendChild(s);
      }
      // Kalan numara sayısını Çekiliş Listesi altında göster
      const remEl = document.getElementById('remaining-count');
      if (remEl) {
        remEl.textContent = `Kalan Numara Sayısı: ${90 - called.length}`;
      }
      markBoard();
    }

    function pickLang(){
      const sel=document.getElementById('opt-lang').value;
      if(sel!=='auto') return sel;
      const nav=(navigator.language||'en-US').toLowerCase();
      if(nav.startsWith('tr')) return 'tr-TR';
      if(nav.startsWith('hi')) return 'hi-IN';
      if(nav.startsWith('de')) return 'de-DE';
      if(nav.startsWith('fr')) return 'fr-FR';
      return 'en-US';
    }
    function pickVoiceFor(lang){
      const voices = speechSynthesis.getVoices();
      const langBase = lang.split('-')[0].toLowerCase();
      let cand = voices.filter(v =>
        v.lang && (v.lang.toLowerCase() === lang.toLowerCase() ||
                   v.lang.toLowerCase().startsWith(langBase))
      );
      const femaleHints = ['seda','filiz','elif','banu','ayça','zeynep','yağmur','dilara','female','woman','wavenet-a','neural female'];
      let v = cand.find(v => femaleHints.some(h => v.name.toLowerCase().includes(h)));
      if (!v) v = cand[0];
      if (!v) v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langBase));
      return v || null;
    }
    function speakNumber(n){
      if(!('speechSynthesis' in window)) return;
      const u=new SpeechSynthesisUtterance(), lang=pickLang(); u.lang=lang;
      const map={ 'tr-TR':x=>`${x}`,'en-GB':x=>`${x}`,'hi-IN':x=>`${x}`,'de-DE':x=>`${x}`,'fr-FR':x=>`${x}` };
      u.text=(map[lang]||map['en-GB'])(n);
      const v = pickVoiceFor(lang);
      if(v) u.voice=v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
    function voicesReady(cb){ if(speechSynthesis.getVoices().length) cb(); else speechSynthesis.onvoiceschanged = cb; }
    voicesReady(function(){
      document.getElementById('btn-call').disabled = false;
    });

    function resetCaller(){ called=[]; lastEl.textContent='–'; renderLists(); }

    function callNumber(){
      if(called.length===90) return;
      let n; do{ n=(Math.random()*90|0)+1; }while(called.includes(n));
      called.push(n);             
      lastEl.textContent=n;
      renderLists();
      speakNumber(n);
    }

    let bandTexts=['BINGO'], bandIndex=0;
    const srcLocal   = document.getElementById('src-local');
    const srcPreset  = document.getElementById('src-preset');
    const srcCustom  = document.getElementById('src-custom');
    const localFile  = document.getElementById('local-file');
    const presetSelect  = document.getElementById('preset-select');
    const customText = document.getElementById('custom-text');

    function setBandsInfo(){ document.getElementById('bands-info').textContent=`${bandTexts.length} başlık yüklendi`; }
    async function loadPreset(name){
      try{
        const r=await fetch(`presets/${name}.json`,{cache:'no-store'}); if(!r.ok) throw new Error(`HTTP ${r.status}`);
        const arr=await r.json(); if(!Array.isArray(arr)||!arr.length) throw new Error('Boş JSON');
        bandTexts=arr.map(String); bandIndex=0; setBandsInfo();
      }catch(e){ console.warn('Preset yüklenemedi:',e); bandTexts=['BINGO']; bandIndex=0; setBandsInfo(); }
    }
    function loadLocalFile(file){
      const rd=new FileReader();
      rd.onload=()=>{ try{ const arr=JSON.parse(rd.result);
        if(Array.isArray(arr)&&arr.length){ bandTexts=arr.map(String); bandIndex=0; setBandsInfo(); }
        else { bandTexts=['BINGO']; bandIndex=0; setBandsInfo(); alert('JSON bir dizi olmalı.'); }
      }catch(err){ bandTexts=['BINGO']; bandIndex=0; setBandsInfo(); alert('JSON çözümlenemedi: '+err.message); } };
      rd.readAsText(file,'utf-8');
    }
    function refreshSourceUi(){
      localFile.disabled = !srcLocal.checked;
      presetSelect.disabled = !srcPreset.checked;
      customText.disabled = !srcCustom.checked;
    }
    srcLocal.addEventListener('change',refreshSourceUi);
    srcPreset.addEventListener('change',refreshSourceUi);
    srcCustom.addEventListener('change',refreshSourceUi);
    localFile.addEventListener('change', e => { if(e.target.files?.[0]) loadLocalFile(e.target.files[0]); });
    presetSelect.addEventListener('change', e => loadPreset(e.target.value));

    const nextBand = ()=>{
      if (srcCustom.checked) {
        const t = (customText.value || '').trim();
        return t || 'BINGO';
      }
      const list = bandTexts.filter(t=>t && t.trim());
      return list.length ? list[bandIndex++ % list.length] : 'BINGO';
    };

    function getOpts(){
      return {
        bandColor: document.getElementById('opt-band-color').value || '#f34f0eff',
        bandTextColor: document.getElementById('opt-band-text-color').value || '#f7f0f0ff',
        serialStart: parseInt(document.getElementById('opt-serial-start').value||'1',10),
        pages: Math.max(1, parseInt(document.getElementById('opt-pages').value||'1',10)),
        baseName: (document.getElementById('opt-basename').value||'bingo_').trim()
      };
    }

    function drawTicket(
      doc, x, y, w, h, grid, serial,
      bandColor, bandText, bandTextColor
    ){
      const [br,bg,bb]=hexToRgb(bandColor,[255,165,0]);
      const [tr,tg,tb]=hexToRgb(bandTextColor,[0,0,0]);
      const BAND_H = cm(0.8);

      const gridY = y + BAND_H, gridH = h - BAND_H;
      const cellW = w/9, cellH = gridH/3;

      // Hücreler ve sayılar
      doc.setDrawColor(40); doc.setLineWidth(0.2); doc.setTextColor(0);
      for(let r=0;r<3;r++){
        for(let c=0;c<9;c++){
          const cx=x+c*cellW, cy=gridY+r*cellH;
          doc.rect(cx,cy,cellW,cellH);
          const v=grid[r][c]; if(v==null) continue;
          const s = Math.min(22, cellH*0.8);
          doc.setFont(FONT_NUM,'bold'); doc.setFontSize(s);
          doc.text(String(v), cx+cellW/2, cy+cellH/2, {align:'center', baseline:'middle'});
        }
      }

      // Band
      const bandTop = y;
      doc.setFillColor(br,bg,bb);
      doc.rect(x, bandTop, w, BAND_H, 'F');

 
  let text = bandText; if(FONT_TEXT!=='Uni') text = transliterate(text);
  doc.setTextColor(tr,tg,tb); doc.setFont(FONT_TEXT,'bold');
  const fit = fitTextToWidth(doc, text, w*0.92, 36, 8, 12);
  doc.setFontSize(fit.size);
  const bandTextY = bandTop + BAND_H*0.42;
  doc.text(fit.text, x+w/2, bandTextY, {align:'center', baseline:'middle'});

  
  const serialStr = String(serial).padStart(5,'0');
  doc.setFont(FONT_NUM,'bold'); doc.setFontSize(6); doc.setTextColor(255,255,255);
  const serialY = bandTop + BAND_H - 2; 
  doc.text(serialStr, x+w/2, serialY, {align:'center', baseline:'bottom'});

  const dashedY = Math.max(bandTop-1, 0);
  doc.setLineDash([4,2],0); doc.setDrawColor(0);
  doc.setLineWidth(1.4); 
  doc.line(x, dashedY, x+w, dashedY);
  doc.setLineDash();
  doc.setLineWidth(0.2); 
    }

    async function generatePdf(){
      if(!window.jspdf || !window.jspdf.jsPDF){ alert('jsPDF yüklenemedi.'); return; }
      const { jsPDF } = window.jspdf;
      const o = getOpts();
      const doc = new jsPDF({unit:'pt', format:'a4', compress:true});
      await tryLoadUnicodeFont(doc);

      const pageW = doc.internal.pageSize.getWidth(), pageH = doc.internal.pageSize.getHeight();
      const STRIP_W = cm(10), CENTER_GUTTER = cm(0.5);
      const MARGIN_T = cm(0.8), MARGIN_B = cm(0.3);
      const totalW = STRIP_W*2 + CENTER_GUTTER;
      const MARGIN_LR = (pageW - totalW)/2;
      const availH = pageH - MARGIN_T - MARGIN_B;
      const ticketH = availH / CARDS_PER_STRIP;
      function drawHeaderFooter() {
        doc.setFontSize(10);
        doc.setTextColor(80,80,80);
        doc.text('https://sonsuzyasam.github.io/Bingo/', pageW/2, cm(0.5), {align:'center'});
        doc.text('https://sonsuzyasam.github.io/Bingo/', pageW/2, pageH-cm(0.2), {align:'center'});
      }

      let serial = o.serialStart;
      const ts=new Date(), pad=n=>String(n).padStart(2,'0');
      const stamp = ts.getFullYear()+pad(ts.getMonth()+1)+pad(ts.getDate())+'_'+pad(ts.getHours())+pad(ts.getMinutes())+pad(ts.getSeconds());
      const pdfName = `${o.baseName||'bingo_'}${stamp}.pdf`;

      const drawStrip = (x0, tickets) =>{
        for (let i=0; i<CARDS_PER_STRIP; i++){
          const yTop = pageH - MARGIN_B - i*ticketH;  
          const y    = yTop - ticketH;
          drawTicket(doc, x0, y, STRIP_W, ticketH, tickets[i], serial,
            o.bandColor, nextBand(), o.bandTextColor
          );
          serial++;
        }
      };

      for(let p=0; p<o.pages; p++){
  drawHeaderFooter();
  const left  = generateStripWithRetry();
  const right = generateStripWithRetry();
  drawStrip(MARGIN_LR, left);
  drawStrip(MARGIN_LR + STRIP_W + CENTER_GUTTER, right);
  if(p<o.pages-1) doc.addPage();
      }

      doc.save(pdfName);
    }

    document.getElementById('btn-call').addEventListener('click',callNumber);
    document.getElementById('btn-reset').addEventListener('click',()=>{ called=[]; lastEl.textContent='–'; renderLists(); stopAutoCall(); });
    document.getElementById('btn-pdf').addEventListener('click',generatePdf);

    let autoCallTimer = null;
  let lastAutoCallInterval = 0;
    function startAutoCall(intervalSec) {
      stopAutoCall(false);
      if (intervalSec > 0) {
        lastAutoCallInterval = intervalSec;
        autoCallTimer = setInterval(() => {
          if (called.length < 90) {
            callNumber();
          } else {
            stopAutoCall();
          }
        }, intervalSec * 1000);
        document.getElementById('btn-auto-call-stop').textContent = 'Durdur';
      }
    }
    function stopAutoCall() {
      if (autoCallTimer) {
        clearInterval(autoCallTimer);
        autoCallTimer = null;
        document.getElementById('btn-auto-call-stop').textContent = 'Devam';
      }
    }
    document.getElementById('auto-call-select').addEventListener('change', function(e) {
      const sec = parseInt(e.target.value, 10);
      if (sec > 0) {
        startAutoCall(sec);
      } else {
        stopAutoCall();
      }
    });
    document.getElementById('btn-auto-call-stop').addEventListener('click', function(){
      if (!autoCallTimer && lastAutoCallInterval > 0) {
        startAutoCall(lastAutoCallInterval);
      } else {
        stopAutoCall();
      }
    });

    refreshSourceUi(); setBandsInfo(); buildBoard(); loadPreset('valentine'); resetCaller();
  }
})();