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
    detectCountryAndSetDefaults();
    setupForm();
    loadPresets();
  }

  // Ülke tespiti ve otomatik ayarlar
  async function detectCountryAndSetDefaults(){
    try {
      // Tarayıcı dili ile ülke tahmini
      const lang = navigator.language || 'en-US';
      const countryCode = lang.split('-')[1] || 'US';
      const langCode = lang.split('-')[0] || 'en';
      
      // IP bazlı ülke tespiti (opsiyonel, hata durumunda sessiz geçilir)
      let detectedCountry = getCountryFromLanguage(langCode);
      
      try {
        const ipResponse = await fetch('https://ipapi.co/json/', {timeout: 3000});
        if(ipResponse.ok) {
          const ipData = await ipResponse.json();
          if(ipData.country_code) {
            detectedCountry = ipData.country_name || detectedCountry;
            updatePresetForCountry(ipData.country_code);
          }
        }
      } catch(e) {
        console.log('IP detection failed, using language fallback');
      }
      
      // Ülke bilgisini göster
      document.getElementById('detected-country').textContent = detectedCountry;
      document.getElementById('country-info').style.display = 'block';
      
    } catch(e) {
      console.log('Country detection failed:', e);
    }
  }

  function getCountryFromLanguage(langCode) {
    const langMap = {
      'tr': 'Türkiye',
      'en': 'United States', 
      'da': 'Denmark',
      'de': 'Germany',
      'fr': 'France',
      'hi': 'India'
    };
    return langMap[langCode] || 'Unknown';
  }

  function updatePresetForCountry(countryCode) {
    const presetSelect = document.getElementById('preset-select');
    const countryPresets = {
      'TR': 'general',
      'DK': 'danish', 
      'US': 'english',
      'GB': 'english'
    };
    
    const suggestedPreset = countryPresets[countryCode];
    if(suggestedPreset) {
      presetSelect.value = suggestedPreset;
      loadPreset(suggestedPreset);
    }
  }

  function setupForm() {
    const srcPreset = document.getElementById('src-preset');
    const srcCustom = document.getElementById('src-custom');
    const customText = document.getElementById('custom-text');
    const presetSelect = document.getElementById('preset-select');
    
    function refreshSourceUi(){
      customText.disabled = !srcCustom.checked;
      presetSelect.disabled = !srcPreset.checked;
    }
    
    srcPreset.addEventListener('change', refreshSourceUi);
    srcCustom.addEventListener('change', refreshSourceUi);
    presetSelect.addEventListener('change', e => loadPreset(e.target.value));
    
    document.getElementById('btn-pdf').addEventListener('click', generatePdf);
    
    refreshSourceUi();
  }

  // Preset yükleme
  let bandTexts = ['BINGO'];
  let bandIndex = 0;

  async function loadPresets() {
    // Başlangıç olarak valentine'ı yükle
    await loadPreset('valentine');
  }

  async function loadPreset(name) {
    try {
      // Önce mevcut preset dosyalarını dene
      let presetData = null;
      
      if(name === 'valentine') {
        const r = await fetch('presets/band_texts_valentine.json', {cache:'no-store'});
        if(r.ok) presetData = await r.json();
      } else {
        // Yeni preset dosyaları için
        const r = await fetch(`presets/band_texts_${name}.json`, {cache:'no-store'});
        if(r.ok) presetData = await r.json();
      }
      
      // Fallback preset'ler
      if(!presetData) {
        presetData = getFallbackPreset(name);
      }
      
      if(Array.isArray(presetData) && presetData.length) {
        bandTexts = presetData.map(String);
        bandIndex = 0;
        setBandsInfo();
      } else {
        throw new Error('Invalid preset data');
      }
      
    } catch(e) {
      console.warn('Preset yüklenemedi:', e);
      bandTexts = getFallbackPreset('default');
      bandIndex = 0;
      setBandsInfo();
    }
  }

  function getFallbackPreset(name) {
    const presets = {
      'general': ['BINGO', 'TOMBALA', 'ÇEKİLİŞ', 'OYUN'],
      'school': ['OKUL ÇEKİLİŞİ', 'SINIF OYUNU', 'EĞİTİM BINGO', 'ÖĞRETMEN BINGO'],
      'english': ['BINGO', 'GAME TIME', 'LUCKY DRAW', 'WIN BIG'],
      'danish': ['BINGO', 'SPIL TID', 'LYKKE TRÆK', 'VIND STORT'],
      'default': ['BINGO']
    };
    return presets[name] || presets['default'];
  }

  function setBandsInfo() {
    document.getElementById('bands-info').textContent = `${bandTexts.length} başlık yüklendi`;
  }

  const nextBand = () => {
    if (document.getElementById('src-custom').checked) {
      const t = (document.getElementById('custom-text').value || '').trim();
      return t || 'BINGO';
    }
    const list = bandTexts.filter(t=>t && t.trim());
    return list.length ? list[bandIndex++ % list.length] : 'BINGO';
  };

  function getOpts(){
    return {
      bandColor: document.getElementById('opt-band-color').value || '#ff7a00',
      bandTextColor: document.getElementById('opt-band-text-color').value || '#000000',
      serialStart: parseInt(document.getElementById('opt-serial-start').value||'1',10),
      pages: Math.max(1, parseInt(document.getElementById('opt-pages').value||'1',10)),
      baseName: (document.getElementById('opt-basename').value||'bingo_').trim()
    };
  }

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

  function generateStripWithRetry(max=400){ 
    for(let i=0;i<max;i++){ 
      const g=generateStrip(); 
      if(g) return g; 
    } 
    throw new Error('Geçerli strip üretilemedi.'); 
  }

  function drawTicket(doc, x, y, w, h, grid, serial, bandColor, bandText, bandTextColor){
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

    let text = bandText; 
    if(FONT_TEXT!=='Uni') text = transliterate(text);
    doc.setTextColor(tr,tg,tb); doc.setFont(FONT_TEXT,'bold');
    const fit = fitTextToWidth(doc, text, w*0.92, 36, 8, 12);
    doc.setFontSize(fit.size);
    const bandTextY = bandTop + BAND_H*0.42;
    doc.text(fit.text, x+w/2, bandTextY, {align:'center', baseline:'middle'});

    const serialStr = String(serial).padStart(4,'0');
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
    if(!window.jspdf || !window.jspdf.jsPDF){ 
      alert('jsPDF yüklenemedi.'); 
      return; 
    }

    const loadingEl = document.getElementById('loading');
    const btnEl = document.getElementById('btn-pdf');
    
    try {
      // Loading durumunu göster
      loadingEl.style.display = 'block';
      btnEl.disabled = true;
      btnEl.textContent = 'PDF Üretiliyor...';
      
      const { jsPDF } = window.jspdf;
      const o = getOpts();
      const doc = new jsPDF({unit:'pt', format:'a4', compress:true});
      await tryLoadUnicodeFont(doc);

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const STRIP_W = cm(10), CENTER_GUTTER = cm(0.5);
      const MARGIN_T = cm(0.8), MARGIN_B = cm(0.3);
      const totalW = STRIP_W*2 + CENTER_GUTTER;
      const MARGIN_LR = (pageW - totalW)/2;
      const availH = pageH - MARGIN_T - MARGIN_B;
      const ticketH = availH / CARDS_PER_STRIP;

      function drawHeaderFooter(currentPageNum, totalPages) {
        doc.setFontSize(10);
        doc.setTextColor(80,80,80);
        // Üstte yalnızca URL
        doc.text(`https://sonsuzyasam.github.io/Bingo/`, pageW/2, cm(0.5), {align:'center'});
        // Altta sayfa numarası (ör. 1/10)
        doc.text(`${currentPageNum}/${totalPages}`, pageW/2, pageH - cm(0.5), {align:'center'});
      }

      const ts=new Date(), pad=n=>String(n).padStart(2,'0');
      const stamp = ts.getFullYear()+pad(ts.getMonth()+1)+pad(ts.getDate())+'_'+pad(ts.getHours())+pad(ts.getMinutes())+pad(ts.getSeconds());
      const pdfName = `${o.baseName||'bingo_'}${stamp}.pdf`;

      for(let p=0; p<o.pages; p++){
        const currentPageNum = p+1;
        const totalPages = o.pages;
        drawHeaderFooter(currentPageNum, totalPages);
        
        // Sol/sağ seri numaraları
        let leftSerial = o.serialStart + p*CARDS_PER_STRIP;
        let rightSerial = o.serialStart + o.pages*CARDS_PER_STRIP + p*CARDS_PER_STRIP;
        
        const left  = generateStripWithRetry();
        const right = generateStripWithRetry();
        
        for (let i=0; i<CARDS_PER_STRIP; i++) {
          const yTop = pageH - MARGIN_B - i*ticketH;
          const y    = yTop - ticketH;
          
          // Sol kart
          drawTicket(doc, MARGIN_LR, y, STRIP_W, ticketH, left[i], leftSerial,
            o.bandColor, nextBand(), o.bandTextColor
          );
          leftSerial++;
          
          // Sağ kart
          drawTicket(doc, MARGIN_LR + STRIP_W + CENTER_GUTTER, y, STRIP_W, ticketH, right[i], rightSerial,
            o.bandColor, nextBand(), o.bandTextColor
          );
          rightSerial++;
        }
        
        if(p < o.pages-1) doc.addPage();
      }

      doc.save(pdfName);
      
    } catch(error) {
      alert('PDF oluşturulurken hata: ' + error.message);
      console.error('PDF error:', error);
    } finally {
      // Loading durumunu gizle
      loadingEl.style.display = 'none';
      btnEl.disabled = false;
      btnEl.textContent = '📄 PDF Kartları Üret';
    }
  }

})();