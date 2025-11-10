'use strict';

(function(){
  // Global değişkenleri en başta tanımlayalım
  const board = document.getElementById('board-90');
  const gridDrawn = document.getElementById('drawn-grid');
  const lastEl = document.getElementById('last-number');
  let called = [];
  let autoCallTimer = null;
  let lastAutoCallInterval = 0;
  let isReading = false; // TTS okuma durumu
  let pausedForTTS = false; // TTS için duraklatıldı mı?

  const ready = fn => (document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  ready(init);

  function init(){
    console.log('🚀 BingoBala başlatılıyor...');
    detectCountryAndSetTTS();
    buildBoard(); 
    resetCaller();
    setupEventListeners();
    console.log('✅ BingoBala hazır!');
  }

  async function detectCountryAndSetTTS(){
    try {
      const lang = navigator.language || 'en-US';
      const langCode = lang.split('-')[0] || 'en';
      const langSelect = document.getElementById('opt-lang');
      if(langSelect) {
        const langMap = {
          'tr': 'tr-TR', 'en': 'en-US', 'da': 'da-DK', 
          'de': 'de-DE', 'fr': 'fr-FR', 'hi': 'hi-IN'
        };
        const detectedLang = langMap[langCode];
        if(detectedLang) langSelect.value = detectedLang;
      }
    } catch(e) {
      console.log('Language detection failed:', e);
    }
  }

  function setupEventListeners(){
    console.log('🎧 Event listener\'lar kuruluyor...');
    const btnCall = document.getElementById('btn-call');
    const btnReset = document.getElementById('btn-reset'); 
    const autoSelect = document.getElementById('auto-call-select');
    const autoStop = document.getElementById('btn-auto-call-stop');
    
    console.log('Elements found:', {
      btnCall: !!btnCall,
      btnReset: !!btnReset,
      autoSelect: !!autoSelect,
      autoStop: !!autoStop,
      lastEl: !!lastEl,
      board: !!board,
      gridDrawn: !!gridDrawn
    });
    
    if(btnCall) btnCall.addEventListener('click', callNumber);
    if(btnReset) btnReset.addEventListener('click', ()=>{ 
      called=[]; lastEl.textContent='–'; renderLists(); stopAutoCall(); 
    });
    
    if(autoSelect) autoSelect.addEventListener('change', function(e) {
      const sec = parseInt(e.target.value, 10);
      if (sec > 0) startAutoCall(sec); else stopAutoCall();
    });
    
    if(autoStop) autoStop.addEventListener('click', function(){
      if (!autoCallTimer && lastAutoCallInterval > 0) {
        startAutoCall(lastAutoCallInterval);
      } else {
        stopAutoCall();
      }
    });
    console.log('✅ Event listener\'lar kuruldu!');
  }

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
      const s=document.createElement('span'); 
      s.className='pill'; 
      s.textContent=n;
      gridDrawn.appendChild(s);
    }
    
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
    if(nav.startsWith('da')) return 'da-DK';
    return 'en-US';
  }

  function pickVoiceFor(lang){
    const voices = speechSynthesis.getVoices();
    const langBase = lang.split('-')[0].toLowerCase();
    let cand = voices.filter(v => v.lang && (v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(langBase)));
    const femaleHints = ['seda','filiz','elif','banu','ay�a','zeynep','yagmur','dilara','female','woman','wavenet-a','neural female'];
    let v = cand.find(v => femaleHints.some(h => v.name.toLowerCase().includes(h)));
    if (!v) v = cand[0];
    if (!v) v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langBase));
    return v || null;
  }

  function speakNumber(n){
    if(!('speechSynthesis' in window)) return;
    const u=new SpeechSynthesisUtterance(), lang=pickLang(); 
    u.lang=lang;
    const map={ 'tr-TR':x=>`${x}`,'en-GB':x=>`${x}`,'hi-IN':x=>`${x}`,'de-DE':x=>`${x}`,'fr-FR':x=>`${x}`,'da-DK':x=>`${x}` };
    u.text=(map[lang]||map['en-GB'])(n);
    const v = pickVoiceFor(lang);
    if(v) u.voice=v;
    speechSynthesis.cancel(); 
    speechSynthesis.speak(u);
  }

  function speakAlert(message){
    if(!('speechSynthesis' in window)) return;
    
    // TTS okumaya başladığımızı işaretle
    isReading = true;
    
    // Eğer otomatik çekim aktifse ve TTS için duraklatmamışsak, duraklat
    if(autoCallTimer && !pausedForTTS) {
      clearInterval(autoCallTimer);
      autoCallTimer = null;
      pausedForTTS = true;
      console.log('🔊 TTS için otomatik çekim duraklatıldı');
    }
    
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance();
      const lang = pickLang();
      u.lang = lang;
      u.text = message;
      const v = pickVoiceFor(lang);
      if(v) u.voice = v;
      u.rate = 0.9; // Biraz daha yavaş konuş
      u.pitch = 1.1; // Biraz daha yüksek ton
      
      // TTS bittiğinde otomatik çekimi yeniden başlat
      u.onend = () => {
        isReading = false;
        if(pausedForTTS) {
          pausedForTTS = false;
          // Son interval değerini kullanarak otomatik çekimi devam ettir
          if(lastAutoCallInterval > 0) {
            startAutoCall(lastAutoCallInterval);
            console.log('🔄 TTS bitti, otomatik çekim devam ediyor');
          }
        }
      };
      
      // TTS hatası durumunda da temizle
      u.onerror = () => {
        isReading = false;
        if(pausedForTTS) {
          pausedForTTS = false;
          if(lastAutoCallInterval > 0) {
            startAutoCall(lastAutoCallInterval);
          }
        }
      };
      
      speechSynthesis.speak(u);
    }, 800); // Sayı okuduktan sonra bekle
  }

  function checkAndAnnounceRemaining(){
    const remaining = 90 - called.length;
    
    // 45 sayı kaldığında
    if(remaining === 45) {
      speakAlert('Kalan numara sayısı kırk beş');
    }
    // Her 10 sayıda (40, 30, 20 kaldığında) ama 15'ten büyükse
    else if(remaining > 15 && remaining % 10 === 0) {
      const numberWord = {
        40: 'kırk', 30: 'otuz', 20: 'yirmi'
      }[remaining] || remaining.toString();
      speakAlert(`Kalan numara sayısı ${numberWord}`);
    }
    // Son 15 sayıda her 5'te (15, 10, 5 kaldığında)
    else if(remaining <= 15 && remaining > 0 && remaining % 5 === 0) {
      const numberWord = {
        15: 'on beş', 10: 'on', 5: 'beş'
      }[remaining] || remaining.toString();
      speakAlert(`Dikkat! Kalan numara sayısı ${numberWord}`);
    }
    // Son sayı
    else if(remaining === 1) {
      speakAlert('Dikkat! Son numara!');
    }
  }

  function voicesReady(cb){ 
    if(speechSynthesis.getVoices().length) cb(); 
    else speechSynthesis.onvoiceschanged = cb; 
  }

  voicesReady(function(){
    document.getElementById('btn-call').disabled = false;
  });

  function resetCaller(){ 
    called=[]; 
    lastEl.textContent='–'; 
    renderLists(); 
  }

  function callNumber(){
    console.log('🎲 Numara çekiliyor...');
    if(called.length===90) {
      console.log('⚠️ Tüm numaralar çıktı!');
      speakAlert('Tüm numaralar çıktı! Oyun bitti!');
      return;
    }
    let n; 
    do{ n=(Math.random()*90|0)+1; }while(called.includes(n));
    called.push(n);
    console.log(`✨ Çekilen numara: ${n}`);
    lastEl.textContent=n;
    renderLists();
    speakNumber(n);
    
    // Kalan sayı uyarısını kontrol et
    checkAndAnnounceRemaining();
  }

  function startAutoCall(intervalSec) {
    stopAutoCall();
    if (intervalSec > 0) {
      lastAutoCallInterval = intervalSec;
      autoCallTimer = setInterval(() => {
        // TTS okuma sırasında numara çekme
        if (!isReading && called.length < 90) {
          callNumber();
        } else if (called.length >= 90) {
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
      pausedForTTS = false; // Stop tuşuna basıldığında TTS pauseını da sıfırla
      document.getElementById('btn-auto-call-stop').textContent = 'Devam';
    }
  }
})();
