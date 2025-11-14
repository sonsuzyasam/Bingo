'use strict';

(function(){
  // Global değişkenleri en başta tanımlayalım
  const board = document.getElementById('board-90');
  const gridDrawn = document.getElementById('drawn-grid');
  const lastEl = document.getElementById('last-number');
  const lastModal = document.getElementById('last-modal');
  const lastModalValue = document.getElementById('last-modal-value');
  const drawnModal = document.getElementById('drawn-modal');
  const boardModal = document.getElementById('board-modal');
  const autoIndicatorEl = document.getElementById('auto-indicator');
  const STORAGE_KEY = 'bingoStateV1';
  const BACKUP_KEY = 'bingoStateBackupV1';
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
    const restored = loadState();
    if(!restored) {
      resetCaller({ skipBackup: true, skipSave: true });
      saveState();
    }
    setupEventListeners();
    toggleRestoreButton();
    setAutoIndicator(!!autoCallTimer);
    setAutoStopLabel(!!autoCallTimer);
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
    const btnRestore = document.getElementById('btn-restore-game');
  const btnOpenLast = document.getElementById('btn-open-last');
  const btnCloseLast = document.getElementById('btn-close-last');
  const btnLastOpenDrawn = document.getElementById('btn-last-open-drawn');
  const btnLastOpenBoard = document.getElementById('btn-last-open-board');
  const btnOpenDrawn = document.getElementById('btn-open-drawn');
    const btnCloseDrawn = document.getElementById('btn-close-drawn');
    const btnOpenBoard = document.getElementById('btn-open-board');
    const btnCloseBoard = document.getElementById('btn-close-board');
    
    console.log('Elements found:', {
      btnCall: !!btnCall,
      btnReset: !!btnReset,
      autoSelect: !!autoSelect,
    autoStop: !!autoStop,
    btnRestore: !!btnRestore,
  btnOpenLast: !!btnOpenLast,
  btnCloseLast: !!btnCloseLast,
  btnLastOpenDrawn: !!btnLastOpenDrawn,
  btnLastOpenBoard: !!btnLastOpenBoard,
  btnOpenDrawn: !!btnOpenDrawn,
    btnCloseDrawn: !!btnCloseDrawn,
    btnOpenBoard: !!btnOpenBoard,
    btnCloseBoard: !!btnCloseBoard,
      lastEl: !!lastEl,
      board: !!board,
      gridDrawn: !!gridDrawn
    });
    
    if(btnCall) btnCall.addEventListener('click', callNumber);
    if(btnReset) btnReset.addEventListener('click', handleResetClick);
    
    if(autoSelect) autoSelect.addEventListener('change', function(e) {
      const sec = parseInt(e.target.value, 10);
      if (sec > 0) {
        startAutoCall(sec);
      } else {
        stopAutoCall();
        saveState();
      }
    });
    
    if(autoStop) autoStop.addEventListener('click', function(){
      if (!autoCallTimer) {
        const selectVal = autoSelect ? parseInt(autoSelect.value, 10) : 0;
        const interval = lastAutoCallInterval || selectVal || 3;
        startAutoCall(interval);
      } else {
        stopAutoCall();
        saveState();
      }
    });

    if(btnRestore) btnRestore.addEventListener('click', function(){
      if(restoreFromBackup()) {
        console.log('♻️ Yedekten oyun geri yüklendi.');
      }
    });

    const openLastHandler = () => {
      const latest = called.length ? called[called.length - 1] : null;
      updateLastNumberDisplay(latest);
      openModal(lastModal);
    };
    if(btnOpenLast) {
      btnOpenLast.addEventListener('click', openLastHandler);
      btnOpenLast.addEventListener('pointerup', openLastHandler);
    }
    if(btnCloseLast) btnCloseLast.addEventListener('click', () => closeModal(lastModal));
    if(lastModal) lastModal.addEventListener('click', function(evt){
      if(evt.target === lastModal) closeModal(lastModal);
    });
    if(btnLastOpenDrawn) btnLastOpenDrawn.addEventListener('click', () => {
      closeModal(lastModal);
      openModal(drawnModal);
    });
    if(btnLastOpenBoard) btnLastOpenBoard.addEventListener('click', () => {
      closeModal(lastModal);
      openModal(boardModal);
    });

    if(btnOpenDrawn) btnOpenDrawn.addEventListener('click', () => openModal(drawnModal));
    if(btnCloseDrawn) btnCloseDrawn.addEventListener('click', () => closeModal(drawnModal));
    if(drawnModal) drawnModal.addEventListener('click', function(evt){
      if(evt.target === drawnModal) closeModal(drawnModal);
    });

    if(btnOpenBoard) btnOpenBoard.addEventListener('click', () => openModal(boardModal));
    if(btnCloseBoard) btnCloseBoard.addEventListener('click', () => closeModal(boardModal));
    if(boardModal) boardModal.addEventListener('click', function(evt){
      if(evt.target === boardModal) closeModal(boardModal);
    });

    document.addEventListener('keydown', function(evt){
      if(evt.key === 'Escape') {
        closeModal(lastModal);
        closeModal(drawnModal);
        closeModal(boardModal);
      }
    });

    window.addEventListener('storage', toggleRestoreButton);
    console.log("✅ Event listener'lar kuruldu!");
  }

  function setAutoIndicator(isActive){
    if(!autoIndicatorEl) return;
    autoIndicatorEl.textContent = isActive ? 'Otomatik' : 'Manuel';
    autoIndicatorEl.classList.toggle('active', !!isActive);
  }

  function highlightLatestPill(){
    if(!gridDrawn) return;
    const existing = gridDrawn.querySelectorAll('.pill.is-new');
    existing.forEach(el => el.classList.remove('is-new'));
    const first = gridDrawn.querySelector('.pill');
    if(!first) return;
    first.classList.add('is-new');
    setTimeout(()=>first.classList.remove('is-new'), 800);
  }

  function setAutoStopLabel(isRunning){
    const btn = document.getElementById('btn-auto-call-stop');
    if(!btn) return;
    btn.innerHTML = isRunning ? '⏸️ <span>Durdur</span>' : '⏯️ <span>Devam</span>';
  }

  function handleResetClick(){
    resetCaller({ skipBackup: !called.length });
  }

  function getStorage(){
    try {
      return window.localStorage;
    } catch(err) {
      console.warn('localStorage erişilemedi:', err);
      return null;
    }
  }

  function saveState(){
    const store = getStorage();
    if(!store) return;
    try {
      const state = {
        called: [...called],
        lastNumber: called.length ? called[called.length - 1] : null,
        lastAutoCallInterval,
        autoRunning: !!autoCallTimer,
        timestamp: Date.now()
      };
      store.setItem(STORAGE_KEY, JSON.stringify(state));
      toggleRestoreButton();
    } catch(err) {
      console.warn('Oyun durumu kaydedilemedi:', err);
    }
  }

  function backupState(){
    if(!called.length) return;
    const store = getStorage();
    if(!store) return;
    try {
      const backup = {
        called: [...called],
        lastNumber: called[called.length - 1],
        lastAutoCallInterval,
        autoRunning: !!autoCallTimer,
        timestamp: Date.now()
      };
      store.setItem(BACKUP_KEY, JSON.stringify(backup));
      toggleRestoreButton();
    } catch(err) {
      console.warn('Yedek kaydedilemedi:', err);
    }
  }

  function loadState(){
    const store = getStorage();
    if(!store) return false;
    try {
      const raw = store.getItem(STORAGE_KEY);
      if(!raw) return false;
      const state = JSON.parse(raw);
      if(!state || !Array.isArray(state.called)) return false;

      called = [...state.called];
      lastAutoCallInterval = typeof state.lastAutoCallInterval === 'number' ? state.lastAutoCallInterval : 0;
      const lastNumber = state.lastNumber != null ? state.lastNumber : (called.length ? called[called.length - 1] : null);
    updateLastNumberDisplay(lastNumber);
      renderLists();
  if(called.length) highlightLatestPill();
      stopAutoCall(true, true);
      if(state.autoRunning && lastAutoCallInterval > 0) {
        startAutoCall(lastAutoCallInterval);
      } else {
        setAutoStopLabel(false);
        setAutoIndicator(false);
      }
      return called.length > 0;
    } catch(err) {
      console.warn('Oyun durumu yüklenemedi:', err);
      return false;
    }
  }

  function restoreFromBackup(){
    const store = getStorage();
    if(!store) return false;
    try {
      const raw = store.getItem(BACKUP_KEY);
      if(!raw) return false;
      const state = JSON.parse(raw);
      if(!state || !Array.isArray(state.called) || !state.called.length) return false;

      called = [...state.called];
      lastAutoCallInterval = typeof state.lastAutoCallInterval === 'number' ? state.lastAutoCallInterval : 0;
      const lastNumber = state.lastNumber != null ? state.lastNumber : called[called.length - 1];
    updateLastNumberDisplay(lastNumber);
      renderLists();
  if(called.length) highlightLatestPill();
      stopAutoCall(true, true);
      isReading = false;
      pausedForTTS = false;
      if(state.autoRunning && lastAutoCallInterval > 0) {
        startAutoCall(lastAutoCallInterval);
      } else {
        setAutoStopLabel(false);
        setAutoIndicator(false);
        saveState();
      }
      return true;
    } catch(err) {
      console.warn('Yedekten yükleme başarısız:', err);
      return false;
    }
  }

  function toggleRestoreButton(){
    const btn = document.getElementById('btn-restore-game');
    const store = getStorage();
    if(!btn || !store) {
      if(btn) btn.style.display = 'none';
      return;
    }
    try {
      const raw = store.getItem(BACKUP_KEY);
      if(!raw) {
        btn.style.display = 'none';
        return;
      }
      const backup = JSON.parse(raw);
      const hasBackup = backup && Array.isArray(backup.called) && backup.called.length > 0;
      btn.style.display = hasBackup ? 'inline-flex' : 'none';
    } catch(err) {
      btn.style.display = 'none';
    }
  }

  function updateLastNumberDisplay(value, options = {}){
    const { flash = false } = options;
    const text = value != null ? value : '–';
    const targets = [lastEl, lastModalValue];
    targets.forEach(el => {
      if(!el) return;
      el.textContent = text;
      if(flash) {
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
      } else {
        el.classList.remove('flash');
      }
    });
  }

  function openModal(modal){
    if(!modal) return;
    [lastModal, drawnModal, boardModal].forEach(m => {
      if(m && m !== modal) closeModal(m);
    });
    renderLists();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if(document.body) document.body.classList.add('modal-open');
  }

  function closeModal(modal){
    if(!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if(document.body){
      const anyOpen = document.querySelector('.modal.is-open');
      if(!anyOpen) document.body.classList.remove('modal-open');
    }
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
    if(gridDrawn) {
      gridDrawn.innerHTML='';
      for(const n of [...called].reverse()){
        const s=document.createElement('span'); 
        s.className='pill'; 
        s.textContent=n;
        gridDrawn.appendChild(s);
      }
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
    if(remaining > 45) return;
    
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

  function resetCaller(options = {}){
    const { skipBackup = false, skipSave = false } = options;
    if(!skipBackup) backupState();
    called = [];
    updateLastNumberDisplay(null);
    isReading = false;
    pausedForTTS = false;
    renderLists();
    stopAutoCall();
    if(!skipSave) saveState();
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
  updateLastNumberDisplay(n, { flash: true });
    renderLists();
    highlightLatestPill();
    saveState();
    speakNumber(n);
    
    // Kalan sayı uyarısını kontrol et
    checkAndAnnounceRemaining();
  }

  function startAutoCall(intervalSec) {
    stopAutoCall(true, true);
    if (intervalSec > 0) {
      lastAutoCallInterval = intervalSec;
      autoCallTimer = setInterval(() => {
        // TTS okuma sırasında numara çekme
        if (!isReading && called.length < 90) {
          callNumber();
        } else if (called.length >= 90) {
          stopAutoCall();
          saveState();
        }
      }, intervalSec * 1000);
      setAutoStopLabel(true);
      setAutoIndicator(true);
      saveState();
    }
  }

  function stopAutoCall(skipButtonUpdate = false, skipIndicatorUpdate = false) {
    if (autoCallTimer) {
      clearInterval(autoCallTimer);
      autoCallTimer = null;
    }
    pausedForTTS = false; // Stop tuşuna basıldığında TTS pauseını da sıfırla
    if(!skipButtonUpdate) setAutoStopLabel(false);
    if(!skipIndicatorUpdate) setAutoIndicator(false);
  }
})();
