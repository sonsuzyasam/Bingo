'use strict';

(function(){
  // Global değişkenleri en başta tanımlayalım
  const boardMain = document.getElementById('board-90');
  const boardModalEl = document.getElementById('board-90-modal');
  const drawnPreviewEl = document.getElementById('drawn-preview');
  const drawnModalEl = document.getElementById('drawn-grid');
  const lastEl = document.getElementById('last-number');
  const lastModal = document.getElementById('last-modal');
  const lastModalValue = document.getElementById('last-modal-value');
  const lastHistoryEl = document.getElementById('last-history');
  const remainingCountEl = document.getElementById('remaining-count');
  let drawnModal = document.getElementById('drawn-modal');
  let boardModal = document.getElementById('board-modal');
  const autoIndicatorEl = document.getElementById('auto-indicator');
  const btnMobileOpenLast = document.getElementById('mobile-open-last');
  const btnMobileOpenDrawn = document.getElementById('mobile-open-drawn');
  const btnMobileOpenBoard = document.getElementById('mobile-open-board');
  const mobileViewQuery = window.matchMedia('(max-width: 700px)');
  const TOTAL_NUMBERS = 90;
  const MAX_HISTORY = 6;
  const STORAGE_KEY = 'bingoStateV1';
  const BACKUP_KEY = 'bingoStateBackupV1';
  const UI_LANG_KEY = 'bingoUiLang';
  const ttsLangMap = {
    tr: 'tr-TR',
    en: 'en-US',
    da: 'da-DK',
    de: 'de-DE',
    fr: 'fr-FR',
    hi: 'hi-IN'
  };
  let called = [];
  let autoCallTimer = null;
  let lastAutoCallInterval = 0;
  let isReading = false; // TTS okuma durumu
  let pausedForTTS = false; // TTS için duraklatıldı mı?
  let lastModalAutoClose = null;
  let reopenLastFrom = null;
  let switchingFromLast = false;
  let gameCompleted = false;
  const fallbackUiLang = 'tr';
  const translations = {
    tr: {
      'header.hero': 'BİNGOBALA "İster Tombala de İster Bingo"',
      'button.call': 'Numara Çek',
      'button.last': 'Son Numara',
      'button.drawn': 'Çekilen Sayılar',
      'button.board': 'Kontrol Tablosu',
      'button.restore': 'Oyunu Geri Yükle',
      'button.reset': 'Sıfırla',
      'button.pause': 'Durdur',
      'button.resume': 'Devam',
      'confirm.reset': 'Çekilişi sıfırlamak istediğinizden emin misiniz? Tüm çekilen numaralar silinecek.',
      'label.autoCall': '⚙️ Otomatik Numara Çek:',
      'option.auto.off': 'Kapalı',
      'option.auto.3s': '3 saniye',
      'option.auto.5s': '5 saniye',
      'option.auto.10s': '10 saniye',
      'status.auto': 'Otomatik',
      'status.manual': 'Manuel',
      'panel.draw.title': 'Çekiliş',
      'panel.control.title': 'Kontrol Tablosu',
      'label.history': 'Son çekilenler',
      'list.drawn.title': 'Çıkan Sayılar',
      'list.drawn.info': 'Detaylı listeyi görmek için "Çekilen Sayılar" butonuna tıklayın.',
      'summary.remaining': 'Kalan numara',
      'summary.title': 'Çekiliş Özeti',
      'summary.info': 'Çekilen sayıları görmek için "Çekilen Sayılar", tabloyu görmek için "Kontrol Tablosu" butonuna dokunun.',
      'settings.title': 'Ayarlar',
      'settings.tts': 'Dil (TTS)',
      'option.lang.auto': 'Otomatik (sistem)',
      'option.lang.tr': 'Türkçe',
      'option.lang.en': 'English',
      'option.lang.hi': 'Hindi',
      'option.lang.de': 'Deutsch',
      'option.lang.fr': 'Français',
      'option.lang.da': 'Dansk',
      'link.pdf': '📄 PDF Kart Üretici',
      'link.pdf.hint': 'Yeni sekmede mobil uyumlu PDF kartları üretin',
      'modal.last.title': 'Son Çekilen Numara',
      'modal.drawn.title': 'Çekilen Sayılar',
      'modal.drawn.subtitle': 'En son çekilen sayılar en üstte görünür.',
      'modal.drawn.sectionTitle': 'Çekilen Sayı Listesi',
      'modal.board.title': 'Kontrol Tablosu',
      'modal.board.subtitle': 'Çekilen sayılar, tabloda yeşil olarak işaretlenir.',
      'mobile.nav.last': 'Son',
      'mobile.nav.drawn': 'Liste',
      'mobile.nav.board': 'Kontrol',
      'history.empty': 'Henüz numara yok',
      'aria.remaining': 'Kalan numara: {count}'
    },
    en: {
      'header.hero': 'BINGOBALA "Call it Tombola or Bingo"',
      'button.call': 'Draw Number',
      'button.last': 'Last Number',
      'button.drawn': 'Drawn Numbers',
      'button.board': 'Control Board',
      'button.restore': 'Restore Game',
      'button.reset': 'Reset',
      'button.pause': 'Pause',
      'button.resume': 'Resume',
      'confirm.reset': 'Are you sure you want to reset the draw? All drawn numbers will be cleared.',
      'label.autoCall': '⚙️ Auto Draw:',
      'option.auto.off': 'Off',
      'option.auto.3s': 'Every 3 seconds',
      'option.auto.5s': 'Every 5 seconds',
      'option.auto.10s': 'Every 10 seconds',
      'status.auto': 'Automatic',
      'status.manual': 'Manual',
      'panel.draw.title': 'Draw',
      'panel.control.title': 'Control Board',
      'label.history': 'Recent draws',
      'list.drawn.title': 'Drawn Numbers',
      'list.drawn.info': 'Tap "Drawn Numbers" to see the full list.',
      'summary.remaining': 'Numbers left',
      'summary.title': 'Draw Summary',
      'summary.info': 'Tap "Drawn Numbers" for the list or "Control Board" for the board.',
      'settings.title': 'Settings',
      'settings.tts': 'Language (TTS)',
      'option.lang.auto': 'Automatic (system)',
      'option.lang.tr': 'Turkish',
      'option.lang.en': 'English',
      'option.lang.hi': 'Hindi',
      'option.lang.de': 'German',
      'option.lang.fr': 'French',
      'option.lang.da': 'Danish',
      'link.pdf': '📄 PDF Card Generator',
      'link.pdf.hint': 'Open in a new tab to generate mobile-friendly PDF cards.',
      'modal.last.title': 'Last Drawn Number',
      'modal.drawn.title': 'Drawn Numbers',
      'modal.drawn.subtitle': 'The latest numbers appear at the top.',
      'modal.drawn.sectionTitle': 'Drawn Number List',
      'modal.board.title': 'Control Board',
      'modal.board.subtitle': 'Drawn numbers are highlighted in green.',
      'mobile.nav.last': 'Last',
      'mobile.nav.drawn': 'List',
      'mobile.nav.board': 'Control',
      'history.empty': 'No numbers yet',
      'aria.remaining': 'Remaining numbers: {count}'
    },
    de: {
      'header.hero': 'BINGOBALA "Ob Tombola oder Bingo"',
      'button.call': 'Zahl ziehen',
      'button.last': 'Letzte Zahl',
      'button.drawn': 'Gezogene Zahlen',
      'button.board': 'Kontrolltafel',
      'button.restore': 'Spiel wiederherstellen',
      'button.reset': 'Zurücksetzen',
      'button.pause': 'Anhalten',
      'button.resume': 'Fortsetzen',
      'confirm.reset': 'Ziehung wirklich zurücksetzen? Alle gezogenen Zahlen werden gelöscht.',
      'label.autoCall': '⚙️ Automatische Ziehung:',
      'option.auto.off': 'Aus',
      'option.auto.3s': 'Alle 3 Sekunden',
      'option.auto.5s': 'Alle 5 Sekunden',
      'option.auto.10s': 'Alle 10 Sekunden',
      'status.auto': 'Automatisch',
      'status.manual': 'Manuell',
      'panel.draw.title': 'Ziehung',
      'panel.control.title': 'Kontrolltafel',
      'label.history': 'Letzte Zahlen',
      'list.drawn.title': 'Gezogene Zahlen',
      'list.drawn.info': 'Für die komplette Liste "Gezogene Zahlen" tippen.',
      'summary.remaining': 'Verbleibende Zahl',
      'summary.title': 'Ziehungsübersicht',
      'summary.info': 'Liste über "Gezogene Zahlen", Übersicht über "Kontrolltafel".',
      'settings.title': 'Einstellungen',
      'settings.tts': 'Sprache (TTS)',
      'option.lang.auto': 'Automatisch (System)',
      'option.lang.tr': 'Türkisch',
      'option.lang.en': 'Englisch',
      'option.lang.hi': 'Hindi',
      'option.lang.de': 'Deutsch',
      'option.lang.fr': 'Französisch',
      'option.lang.da': 'Dänisch',
      'link.pdf': '📄 PDF-Kartengenerator',
      'link.pdf.hint': 'In neuem Tab öffnen, um mobilfreundliche PDF-Karten zu erstellen.',
      'modal.last.title': 'Zuletzt gezogene Zahl',
      'modal.drawn.title': 'Gezogene Zahlen',
      'modal.drawn.subtitle': 'Die neuesten Zahlen stehen oben.',
      'modal.drawn.sectionTitle': 'Liste der gezogenen Zahlen',
      'modal.board.title': 'Kontrolltafel',
      'modal.board.subtitle': 'Gezogene Zahlen sind grün markiert.',
      'mobile.nav.last': 'Letzte',
      'mobile.nav.drawn': 'Liste',
      'mobile.nav.board': 'Kontrolle',
      'history.empty': 'Noch keine Zahlen',
      'aria.remaining': 'Verbleibende Zahlen: {count}'
    },
    fr: {
      'header.hero': 'BINGOBALA "Tombola ou Bingo"',
      'button.call': 'Tirer un numéro',
      'button.last': 'Dernier numéro',
      'button.drawn': 'Numéros tirés',
      'button.board': 'Tableau de contrôle',
      'button.restore': 'Restaurer la partie',
      'button.reset': 'Réinitialiser',
      'button.pause': 'Pause',
      'button.resume': 'Reprendre',
      'confirm.reset': 'Voulez-vous vraiment réinitialiser le tirage ? Tous les numéros seront effacés.',
      'label.autoCall': '⚙️ Tirage automatique :',
      'option.auto.off': 'Désactivé',
      'option.auto.3s': 'Toutes les 3 secondes',
      'option.auto.5s': 'Toutes les 5 secondes',
      'option.auto.10s': 'Toutes les 10 secondes',
      'status.auto': 'Automatique',
      'status.manual': 'Manuel',
      'panel.draw.title': 'Tirage',
      'panel.control.title': 'Tableau de contrôle',
      'label.history': 'Derniers tirages',
      'list.drawn.title': 'Numéros tirés',
      'list.drawn.info': 'Touchez « Numéros tirés » pour la liste complète.',
      'summary.remaining': 'Numéros restants',
      'summary.title': 'Résumé du tirage',
      'summary.info': 'Touchez « Numéros tirés » pour la liste ou « Tableau de contrôle » pour la vue.',
      'settings.title': 'Paramètres',
      'settings.tts': 'Langue (TTS)',
      'option.lang.auto': 'Automatique (système)',
      'option.lang.tr': 'Turc',
      'option.lang.en': 'Anglais',
      'option.lang.hi': 'Hindi',
      'option.lang.de': 'Allemand',
      'option.lang.fr': 'Français',
      'option.lang.da': 'Danois',
      'link.pdf': '📄 Générateur de cartes PDF',
      'link.pdf.hint': 'Ouvrez dans un nouvel onglet pour générer des cartes PDF mobiles.',
      'modal.last.title': 'Dernier numéro tiré',
      'modal.drawn.title': 'Numéros tirés',
      'modal.drawn.subtitle': 'Les derniers numéros apparaissent en haut.',
      'modal.drawn.sectionTitle': 'Liste des numéros tirés',
      'modal.board.title': 'Tableau de contrôle',
      'modal.board.subtitle': 'Les numéros tirés sont surlignés en vert.',
      'mobile.nav.last': 'Dernier',
      'mobile.nav.drawn': 'Liste',
      'mobile.nav.board': 'Contrôle',
      'history.empty': 'Aucun numéro pour le moment',
      'aria.remaining': 'Numéros restants : {count}'
    },
    da: {
      'header.hero': 'BINGOBALA "Kald det Tombola eller Bingo"',
      'button.call': 'Træk et tal',
      'button.last': 'Sidste tal',
      'button.drawn': 'Trukne tal',
      'button.board': 'Kontroltabel',
      'button.restore': 'Gendan spil',
      'button.reset': 'Nulstil',
      'button.pause': 'Pause',
      'button.resume': 'Fortsæt',
      'confirm.reset': 'Vil du nulstille trækket? Alle trukne tal bliver slettet.',
      'label.autoCall': '⚙️ Automatisk trækning:',
      'option.auto.off': 'Fra',
      'option.auto.3s': 'Hver 3. sekund',
      'option.auto.5s': 'Hver 5. sekund',
      'option.auto.10s': 'Hver 10. sekund',
      'status.auto': 'Automatisk',
      'status.manual': 'Manuel',
      'panel.draw.title': 'Trækning',
      'panel.control.title': 'Kontroltabel',
      'label.history': 'Seneste tal',
      'list.drawn.title': 'Trukne tal',
      'list.drawn.info': 'Tryk på "Trukne tal" for hele listen.',
      'summary.remaining': 'Tilbageværende tal',
      'summary.title': 'Trækningsoversigt',
      'summary.info': 'Tryk på "Trukne tal" for listen eller "Kontroltabel" for oversigten.',
      'settings.title': 'Indstillinger',
      'settings.tts': 'Sprog (TTS)',
      'option.lang.auto': 'Automatisk (system)',
      'option.lang.tr': 'Tyrkisk',
      'option.lang.en': 'Engelsk',
      'option.lang.hi': 'Hindi',
      'option.lang.de': 'Tysk',
      'option.lang.fr': 'Fransk',
      'option.lang.da': 'Dansk',
      'link.pdf': '📄 PDF-kortgenerator',
      'link.pdf.hint': 'Åbn i en ny fane for at lave mobilvenlige PDF-kort.',
      'modal.last.title': 'Sidste trukne tal',
      'modal.drawn.title': 'Trukne tal',
      'modal.drawn.subtitle': 'De nyeste tal vises øverst.',
      'modal.drawn.sectionTitle': 'Liste over trukne tal',
      'modal.board.title': 'Kontroltabel',
      'modal.board.subtitle': 'Trukne tal markeres med grønt.',
      'mobile.nav.last': 'Sidste',
      'mobile.nav.drawn': 'Liste',
      'mobile.nav.board': 'Kontrol',
      'history.empty': 'Ingen tal endnu',
      'aria.remaining': 'Tilbageværende tal: {count}'
    },
    hi: {
      'header.hero': 'बिंगोबाला "चाहे टोम्बोला कहें या बिंगो"',
      'button.call': 'नंबर निकालें',
      'button.last': 'अंतिम नंबर',
      'button.drawn': 'निकले हुए नंबर',
      'button.board': 'नियंत्रण तालिका',
      'button.restore': 'खेल पुनर्स्थापित करें',
      'button.reset': 'रीसेट',
      'button.pause': 'रोकें',
      'button.resume': 'जारी रखें',
      'confirm.reset': 'क्या आप वाकई ड्रॉ रीसेट करना चाहते हैं? सभी निकले हुए नंबर मिटा दिए जाएंगे।',
      'label.autoCall': '⚙️ स्वचालित ड्रॉ:',
      'option.auto.off': 'बंद',
      'option.auto.3s': 'हर 3 सेकंड',
      'option.auto.5s': 'हर 5 सेकंड',
      'option.auto.10s': 'हर 10 सेकंड',
      'status.auto': 'स्वचालित',
      'status.manual': 'मैनुअल',
      'panel.draw.title': 'ड्रॉ',
      'panel.control.title': 'नियंत्रण तालिका',
      'label.history': 'ताज़ा नंबर',
      'list.drawn.title': 'निकले हुए नंबर',
      'list.drawn.info': 'पूरी सूची के लिए "निकले हुए नंबर" पर टैप करें।',
      'summary.remaining': 'शेष नंबर',
      'summary.title': 'ड्रॉ सारांश',
      'summary.info': 'सूची के लिए "निकले हुए नंबर" और तालिका दृश्य के लिए "नियंत्रण तालिका" पर टैप करें।',
      'settings.title': 'सेटिंग्स',
      'settings.tts': 'भाषा (TTS)',
      'option.lang.auto': 'स्वचालित (सिस्टम)',
      'option.lang.tr': 'तुर्की',
      'option.lang.en': 'अंग्रेज़ी',
      'option.lang.hi': 'हिंदी',
      'option.lang.de': 'जर्मन',
      'option.lang.fr': 'फ्रेंच',
      'option.lang.da': 'डेनिश',
      'link.pdf': '📄 PDF कार्ड जनरेटर',
      'link.pdf.hint': 'मोबाइल-फ्रेंडली PDF कार्ड बनाने के लिए नई टैब में खोलें।',
      'modal.last.title': 'आखिरी निकला नंबर',
      'modal.drawn.title': 'निकले हुए नंबर',
      'modal.drawn.subtitle': 'नए नंबर ऊपर दिखाई देंगे।',
      'modal.drawn.sectionTitle': 'निकले हुए नंबरों की सूची',
      'modal.board.title': 'नियंत्रण तालिका',
      'modal.board.subtitle': 'निकले हुए नंबर हरे रंग से हाइलाइट होंगे।',
      'mobile.nav.last': 'अंतिम',
      'mobile.nav.drawn': 'सूची',
      'mobile.nav.board': 'नियंत्रण',
      'history.empty': 'अभी कोई नंबर नहीं',
      'aria.remaining': 'शेष नंबर: {count}'
    }
  };
  let currentUiLang = fallbackUiLang;
  let uiLanguageMode = 'auto';

  const ready = fn => (document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  ready(init);

  function ensureDrawnModal(){
    if(!drawnModal || !drawnModal.isConnected){
      drawnModal = document.getElementById('drawn-modal');
    }
    return drawnModal;
  }

  function ensureBoardModal(){
    if(!boardModal || !boardModal.isConnected){
      boardModal = document.getElementById('board-modal');
      if(boardModal){
        const modalBoardGrid = boardModal.querySelector('#board-90-modal');
        if(modalBoardGrid && !modalBoardGrid.childElementCount){
          buildBoard(modalBoardGrid);
          markBoard();
        }
      }
    }
    return boardModal;
  }

  function hasOptionValue(selectEl, value){
    if(!selectEl) return false;
    const normalized = String(value).toLowerCase();
    return Array.from(selectEl.options || []).some(opt => String(opt.value).toLowerCase() === normalized);
  }

  function translate(key, fallback = ''){
    const langDict = translations[currentUiLang] || translations[fallbackUiLang] || {};
    if(Object.prototype.hasOwnProperty.call(langDict, key)) return langDict[key];
    const fallbackDict = translations[fallbackUiLang] || {};
    if(Object.prototype.hasOwnProperty.call(fallbackDict, key)) return fallbackDict[key];
    return fallback;
  }

  function formatMessage(key, replacements = {}, fallback = ''){
    const template = translate(key, fallback);
    if(!template) return template;
    return template.replace(/\{(\w+)\}/g, function(match, token){
      if(Object.prototype.hasOwnProperty.call(replacements, token)) {
        return replacements[token];
      }
      return match;
    });
  }

  function applyTranslations(){
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(function(el){
      const key = el.getAttribute('data-i18n');
      if(!key) return;
      const fallback = el.getAttribute('data-i18n-default') || el.textContent;
      const allowHtml = el.hasAttribute('data-i18n-html');
      const value = translate(key, fallback);
      if(value == null) return;
      if(allowHtml) el.innerHTML = value;
      else el.textContent = value;
    });
  }

  function getStoredUiLanguage(){
    const store = getStorage();
    if(!store) return null;
    let raw;
    try {
      raw = store.getItem(UI_LANG_KEY);
    } catch(_) {
      return null;
    }
    if(!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if(parsed && parsed.mode === 'manual' && parsed.lang && translations[parsed.lang]){
        return { mode: 'manual', lang: parsed.lang };
      }
      if(parsed && parsed.mode === 'auto'){
        return { mode: 'auto', lang: null };
      }
    } catch(_) {
      if(raw === 'auto') return { mode: 'auto', lang: null };
      if(translations[raw]) return { mode: 'manual', lang: raw };
    }
    return null;
  }

  function saveUiLanguage(lang, options = {}){
    const store = getStorage();
    if(!store) return;
    const mode = options.mode === 'manual' ? 'manual' : 'auto';
    try {
      store.setItem(UI_LANG_KEY, JSON.stringify({
        mode,
        lang: mode === 'manual' ? lang : null,
        timestamp: Date.now()
      }));
    } catch(_) {
      /* ignore storage issues */
    }
  }

  function clearStoredUiLanguage(){
    const store = getStorage();
    if(!store) return;
    try {
      store.removeItem(UI_LANG_KEY);
    } catch(_) {
      /* ignore storage issues */
    }
  }

  function getNavigatorLanguageCode(){
    const nav = (navigator.language || fallbackUiLang).split('-')[0].toLowerCase();
    if(translations[nav]) return nav;
    return nav === 'tr' ? 'tr' : 'en';
  }

  function detectUiLanguage(){
    const stored = getStoredUiLanguage();
    const navLang = getNavigatorLanguageCode();
    if(stored){
      if(stored.mode === 'manual' && stored.lang){
        return { lang: stored.lang, mode: 'manual' };
      }
      if(stored.mode === 'auto'){
        return { lang: navLang, mode: 'auto' };
      }
    }
    return { lang: navLang, mode: 'auto' };
  }

  function setUiLanguage(lang, options = {}){
    const persist = options.persist !== undefined ? options.persist : true;
    const clearStored = options.clearStored === true;
    const mode = options.mode === 'manual' ? 'manual' : (options.mode === 'auto' ? 'auto' : uiLanguageMode);
    if(!lang) lang = fallbackUiLang;
    const normalized = lang.toLowerCase();
    currentUiLang = translations[normalized] ? normalized : fallbackUiLang;
    uiLanguageMode = mode;
    if(document && document.documentElement){
      document.documentElement.lang = currentUiLang;
    }
    if(persist) saveUiLanguage(currentUiLang, { mode });
    else if(clearStored) clearStoredUiLanguage();
    applyTranslations();
    renderLastHistory();
    updateRemainingProgress();
    setAutoIndicator(!!autoCallTimer);
    setAutoStopLabel(!!autoCallTimer);
  }

  function init(){
    console.log('🚀 BingoBala başlatılıyor...');
    detectCountryAndSetTTS();
    const initialLangState = detectUiLanguage();
    if(initialLangState.mode === 'auto') {
      setUiLanguage(initialLangState.lang, { persist: false, mode: 'auto' });
    } else {
      setUiLanguage(initialLangState.lang, { persist: true, mode: 'manual' });
    }
    buildBoard(boardMain);
    buildBoard(boardModalEl);
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
        const storedPref = getStoredUiLanguage();
        if(storedPref && storedPref.mode === 'manual' && storedPref.lang){
          const manualCode = ttsLangMap[storedPref.lang] || null;
          if(manualCode && hasOptionValue(langSelect, manualCode)) {
            langSelect.value = manualCode;
          } else if(hasOptionValue(langSelect, storedPref.lang)) {
            langSelect.value = storedPref.lang;
          }
        } else if(storedPref && storedPref.mode === 'auto') {
          langSelect.value = 'auto';
        } else {
          const detectedLang = ttsLangMap[langCode];
          langSelect.value = detectedLang && hasOptionValue(langSelect, detectedLang) ? detectedLang : 'auto';
        }
      }
    } catch(e) {
      console.log('Language detection failed:', e);
    }
  }

  function setupEventListeners(){
    console.log('🎧 Event listener\'lar kuruluyor...');
    drawnModal = ensureDrawnModal();
    boardModal = ensureBoardModal();
    const btnCall = document.getElementById('btn-call');
    const btnReset = document.getElementById('btn-reset'); 
    const autoSelect = document.getElementById('auto-call-select');
    const autoStop = document.getElementById('btn-auto-call-stop');
    const btnRestore = document.getElementById('btn-restore-game');
    const langSelect = document.getElementById('opt-lang');
    const btnOpenLast = document.getElementById('btn-open-last');
    const btnCloseLast = document.getElementById('btn-close-last');
    const btnLastOpenDrawn = document.getElementById('btn-last-open-drawn');
    const btnLastOpenBoard = document.getElementById('btn-last-open-board');
    const btnLastReset = document.getElementById('btn-last-reset');
    const btnLastAutoStop = document.getElementById('btn-last-auto-stop');
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
      langSelect: !!langSelect,
      btnOpenLast: !!btnOpenLast,
      btnCloseLast: !!btnCloseLast,
      btnLastOpenDrawn: !!btnLastOpenDrawn,
      btnLastOpenBoard: !!btnLastOpenBoard,
      btnOpenDrawn: !!btnOpenDrawn,
      btnCloseDrawn: !!btnCloseDrawn,
      btnOpenBoard: !!btnOpenBoard,
      btnCloseBoard: !!btnCloseBoard,
      btnLastReset: !!btnLastReset,
      btnLastAutoStop: !!btnLastAutoStop,
      btnMobileOpenLast: !!btnMobileOpenLast,
      btnMobileOpenDrawn: !!btnMobileOpenDrawn,
      btnMobileOpenBoard: !!btnMobileOpenBoard,
      lastEl: !!lastEl,
      boardMain: !!boardMain,
      boardModalEl: !!boardModalEl,
      drawnPreviewEl: !!drawnPreviewEl,
      drawnModalEl: !!drawnModalEl
    });
    
    const attachTouchFriendly = (el, handler) => {
      if(!el) return;
      let touchHandled = false;
      el.addEventListener('click', function(evt){
        if(touchHandled){
          touchHandled = false;
          return;
        }
        handler(evt);
      });
      if(window.PointerEvent){
        el.addEventListener('pointerup', function(evt){
          if(evt.pointerType === 'touch'){
            touchHandled = true;
            if(evt.cancelable) evt.preventDefault();
            handler(evt);
            setTimeout(() => { touchHandled = false; }, 0);
          }
        });
      }
      el.addEventListener('touchend', function(evt){
        if(touchHandled) {
          touchHandled = false;
          return;
        }
        touchHandled = true;
        if(evt.cancelable) evt.preventDefault();
        handler(evt);
        setTimeout(() => { touchHandled = false; }, 0);
      }, { passive: false });
    };

    if(mobileViewQuery && typeof mobileViewQuery.addEventListener === 'function'){
      mobileViewQuery.addEventListener('change', clearAutoCloseTimer);
    }

    const openLastHandler = evt => {
      if(evt && typeof evt.preventDefault === 'function') evt.preventDefault();
      const latest = called.length ? called[called.length - 1] : null;
      updateLastNumberDisplay(latest);
      clearAutoCloseTimer();
      openModal(lastModal);
    };
    const openDrawnHandler = evt => {
      if(evt && typeof evt.preventDefault === 'function') evt.preventDefault();
      clearAutoCloseTimer();
      const targetModal = ensureDrawnModal();
      if(!targetModal){
        console.warn('Çekilen sayılar penceresi bulunamadı.');
        return;
      }
      openModal(targetModal);
      if(!switchingFromLast) reopenLastFrom = null;
    };
    const openBoardHandler = evt => {
      if(evt && typeof evt.preventDefault === 'function') evt.preventDefault();
      clearAutoCloseTimer();
      const targetModal = ensureBoardModal();
      if(!targetModal){
        console.warn('Tablo penceresi bulunamadı.');
        return;
      }
      openModal(targetModal);
      if(!switchingFromLast) reopenLastFrom = null;
    };

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
    
    const toggleAutoCall = evt => {
      if(evt && typeof evt.preventDefault === 'function') evt.preventDefault();
      if (!autoCallTimer) {
        const selectVal = autoSelect ? parseInt(autoSelect.value, 10) : 0;
        const interval = lastAutoCallInterval || selectVal || 3;
        startAutoCall(interval);
        if(autoSelect) {
          const normalized = String(interval);
          const hasOption = Array.from(autoSelect.options || []).some(opt => opt.value === normalized);
          if(hasOption) autoSelect.value = normalized;
        }
      } else {
        stopAutoCall();
        saveState();
      }
    };

    if(autoStop) autoStop.addEventListener('click', toggleAutoCall);

    if(langSelect){
      langSelect.addEventListener('change', function(){
        const val = langSelect.value;
        if(val === 'auto') {
          langSelect.value = 'auto';
          uiLanguageMode = 'auto';
          saveUiLanguage(null, { mode: 'auto' });
          const autoLang = getNavigatorLanguageCode();
          setUiLanguage(autoLang, { persist: false, mode: 'auto' });
        } else {
          const base = (val || '').split('-')[0].toLowerCase();
          if(translations[base]) setUiLanguage(base, { persist: true, mode: 'manual' });
        }
      });
    }

    if(btnRestore) btnRestore.addEventListener('click', function(){
      if(restoreFromBackup()) {
        console.log('♻️ Yedekten oyun geri yüklendi.');
      }
    });

    if(btnOpenLast){
      btnOpenLast.addEventListener('click', openLastHandler);
      btnOpenLast.addEventListener('touchend', function(evt){
        openLastHandler(evt);
      }, { passive: false });
    }
    attachTouchFriendly(btnMobileOpenLast, openLastHandler);
    if(btnLastReset) attachTouchFriendly(btnLastReset, evt => {
      const resetDone = handleResetClick(evt);
      if(resetDone && lastModal && !lastModal.classList.contains('is-open')) openModal(lastModal);
    });
    if(btnLastAutoStop) attachTouchFriendly(btnLastAutoStop, toggleAutoCall);
    if(btnCloseLast) btnCloseLast.addEventListener('click', () => closeModal(lastModal));
    if(lastModal){
      lastModal.addEventListener('click', function(evt){
        if(evt.target === lastModal) closeModal(lastModal);
      });
      const lastCard = lastModal.querySelector('.modal-card');
      if(lastCard){
        lastCard.addEventListener('pointerdown', clearAutoCloseTimer);
        lastCard.addEventListener('touchstart', clearAutoCloseTimer, { passive: true });
      }
    }
    if(btnLastOpenDrawn) attachTouchFriendly(btnLastOpenDrawn, evt => {
      reopenLastFrom = ensureDrawnModal();
      switchingFromLast = true;
      openDrawnHandler(evt);
      switchingFromLast = false;
    });
    if(btnLastOpenBoard) attachTouchFriendly(btnLastOpenBoard, evt => {
      reopenLastFrom = ensureBoardModal();
      switchingFromLast = true;
      openBoardHandler(evt);
      switchingFromLast = false;
    });

    attachTouchFriendly(btnOpenDrawn, openDrawnHandler);
    attachTouchFriendly(btnMobileOpenDrawn, openDrawnHandler);
    if(btnCloseDrawn) btnCloseDrawn.addEventListener('click', () => closeModal(drawnModal));
    if(drawnModal) drawnModal.addEventListener('click', function(evt){
      if(evt.target === drawnModal) closeModal(drawnModal);
    });

    attachTouchFriendly(btnOpenBoard, openBoardHandler);
    attachTouchFriendly(btnMobileOpenBoard, openBoardHandler);
    if(btnCloseBoard) btnCloseBoard.addEventListener('click', () => closeModal(ensureBoardModal()));
    const boardModalRef = ensureBoardModal();
    if(boardModalRef) boardModalRef.addEventListener('click', function(evt){
      if(evt.target === boardModalRef) closeModal(boardModalRef);
    });

    document.addEventListener('keydown', function(evt){
      if(evt.key === 'Escape') {
        const openStack = [boardModal, drawnModal, lastModal];
        const topModal = openStack.find(m => m && m.classList.contains('is-open'));
        if(topModal) closeModal(topModal);
      }
    });

    window.addEventListener('storage', toggleRestoreButton);
    console.log("✅ Event listener'lar kuruldu!");
  }

  function setAutoIndicator(isActive){
    if(!autoIndicatorEl) return;
    const key = isActive ? 'status.auto' : 'status.manual';
    autoIndicatorEl.setAttribute('data-i18n', key);
    autoIndicatorEl.textContent = translate(key, isActive ? 'Otomatik' : 'Manuel');
    autoIndicatorEl.classList.toggle('active', !!isActive);
  }

  function highlightLatestPill(){
    const targets = [drawnPreviewEl, drawnModalEl];
    targets.forEach(function(container){
      if(!container) return;
      container.querySelectorAll('.pill.is-new').forEach(function(el){
        el.classList.remove('is-new');
      });
      const first = container.querySelector('.pill');
      if(!first) return;
      first.classList.add('is-new');
      setTimeout(function(){
        first.classList.remove('is-new');
      }, 800);
    });
  }

  function setAutoStopLabel(isRunning){
    const buttons = [
      document.getElementById('btn-auto-call-stop'),
      document.getElementById('btn-last-auto-stop')
    ];
    const labelKey = isRunning ? 'button.pause' : 'button.resume';
    const label = translate(labelKey, isRunning ? 'Durdur' : 'Devam');
    const icon = isRunning ? '⏸️' : '⏯️';
    buttons.forEach(function(btn){
      if(!btn) return;
      btn.innerHTML = icon + ' <span data-i18n="' + labelKey + '">' + label + '</span>';
    });
  }

  function handleResetClick(evt, options = {}){
    if(evt && typeof evt.preventDefault === 'function') evt.preventDefault();
    const { force = false } = options;
    if(!force && called.length){
      const message = translate('confirm.reset', 'Çekilişi sıfırlamak istediğinizden emin misiniz? Tüm çekilen numaralar silinecek.');
      if(!window.confirm(message)) return false;
    }
    resetCaller({ skipBackup: !called.length });
    return true;
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
    gameCompleted = called.length >= TOTAL_NUMBERS;
    reopenLastFrom = null;
    switchingFromLast = false;
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
    gameCompleted = called.length >= TOTAL_NUMBERS;
    reopenLastFrom = null;
    switchingFromLast = false;
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

  function clearAutoCloseTimer(){
    if(lastModalAutoClose){
      clearTimeout(lastModalAutoClose);
      lastModalAutoClose = null;
    }
  }

  function isMobileView(){
    try {
      return mobileViewQuery ? mobileViewQuery.matches : window.innerWidth <= 700;
    } catch(_) {
      return window.innerWidth <= 700;
    }
  }

  // Briefly surface the last number as a modal on mobile after manual draws.
  function maybeAutoShowLastModal(){
    if(!lastModal || !isMobileView()) return;
    if(!called.length) return;
    if(autoCallTimer) return;
    if(lastModal.classList.contains('is-open')) return;
    const activeModal = document.querySelector('.modal.is-open');
    if(activeModal && activeModal !== lastModal) return;
    clearAutoCloseTimer();
    openModal(lastModal);
    lastModalAutoClose = setTimeout(() => {
      if(lastModal && lastModal.classList.contains('is-open')) {
        closeModal(lastModal);
      }
      lastModalAutoClose = null;
    }, 2400);
  }

  // Show a compact chip list of the most recent draws.
  function renderLastHistory(){
    if(!lastHistoryEl) return;
    lastHistoryEl.innerHTML = '';
    const recent = [...called].slice(-MAX_HISTORY).reverse();
    if(!recent.length){
      const placeholder = document.createElement('span');
      placeholder.className = 'history-placeholder';
      placeholder.textContent = translate('history.empty', 'Henüz numara yok');
      lastHistoryEl.appendChild(placeholder);
      return;
    }
    recent.forEach((n, idx) => {
      const pill = document.createElement('span');
      pill.className = 'history-pill' + (idx === 0 ? ' is-latest' : '');
      pill.textContent = n;
      lastHistoryEl.appendChild(pill);
    });
  }

  function updateRemainingProgress(){
    if(!remainingCountEl) return;
    const remaining = Math.max(0, TOTAL_NUMBERS - called.length);
    const angle = Math.min(360, ((TOTAL_NUMBERS - remaining) / TOTAL_NUMBERS) * 360);
    remainingCountEl.style.setProperty('--angle', `${angle}deg`);
    remainingCountEl.setAttribute('data-total', TOTAL_NUMBERS);
    const valueEl = remainingCountEl.querySelector('.remaining-value');
    if(valueEl) valueEl.textContent = remaining;
    const ariaLabel = formatMessage('aria.remaining', { count: remaining }, `Kalan numara: ${remaining}`);
    remainingCountEl.setAttribute('aria-label', ariaLabel);
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
    drawnModal = ensureDrawnModal();
    boardModal = ensureBoardModal();
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
    const shouldReopenLast = reopenLastFrom === modal;
    if(modal === lastModal){
      if(!switchingFromLast) reopenLastFrom = null;
      clearAutoCloseTimer();
    }
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if(document.body){
      const anyOpen = document.querySelector('.modal.is-open');
      if(!anyOpen) document.body.classList.remove('modal-open');
    }
    if(shouldReopenLast && lastModal && lastModal !== modal){
      reopenLastFrom = null;
      if(!lastModal.classList.contains('is-open')){
        openModal(lastModal);
      }
    }
  }

  function buildBoard(target){
    if(!target) return;
    target.innerHTML='';
    for(let r=0;r<6;r++){
      for(let c=0;c<15;c++){
        const n = r*15 + c + 1;
        const cell = document.createElement('div');
        cell.className='cell';
        cell.dataset.n = n;
        cell.textContent = n;
        target.appendChild(cell);
      }
    }
  }

  function markBoard(){
    document.querySelectorAll('.board90 .cell').forEach(function(el){
      el.classList.toggle('mark', called.includes(Number(el.dataset.n)));
    });
  }

  function renderLists(){
    const containers = [drawnModalEl, drawnPreviewEl];
    const numbers = [...called].reverse();
    containers.forEach(function(container){
      if(!container) return;
      container.innerHTML = '';
      numbers.forEach(function(n){
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = n;
        container.appendChild(pill);
      });
    });

    updateRemainingProgress();
    renderLastHistory();
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
  const remaining = TOTAL_NUMBERS - called.length;
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
    clearAutoCloseTimer();
    reopenLastFrom = null;
    switchingFromLast = false;
    gameCompleted = false;
    updateLastNumberDisplay(null);
    isReading = false;
    pausedForTTS = false;
    renderLists();
    stopAutoCall();
    if(!skipSave) saveState();
  }

  function callNumber(){
    console.log('🎲 Numara çekiliyor...');
    if(gameCompleted && called.length === TOTAL_NUMBERS) {
      resetCaller({ skipBackup: true });
    }
    if(called.length===TOTAL_NUMBERS) {
      console.log('⚠️ Tüm numaralar çıktı!');
      speakAlert('Tüm numaralar çıktı! Oyun bitti!');
      gameCompleted = true;
      return;
    }
    let n; 
    do{ n=(Math.random()*TOTAL_NUMBERS|0)+1; }while(called.includes(n));
    called.push(n);
    console.log(`✨ Çekilen numara: ${n}`);
    updateLastNumberDisplay(n, { flash: true });
    renderLists();
    maybeAutoShowLastModal();
  highlightLatestPill();
    gameCompleted = called.length === TOTAL_NUMBERS;
    saveState();
    speakNumber(n);
    
    // Kalan sayı uyarısını kontrol et
    checkAndAnnounceRemaining();
  }

  function startAutoCall(intervalSec) {
    stopAutoCall(true, true);
    if (intervalSec > 0) {
      lastAutoCallInterval = intervalSec;
      const dropdown = document.getElementById('auto-call-select');
      if(dropdown){
        const normalized = String(intervalSec);
        const hasOption = Array.from(dropdown.options || []).some(opt => opt.value === normalized);
        if(hasOption) dropdown.value = normalized;
      }
      autoCallTimer = setInterval(() => {
        // TTS okuma sırasında numara çekme
        if (!isReading && called.length < TOTAL_NUMBERS) {
          callNumber();
        } else if (called.length >= TOTAL_NUMBERS) {
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
