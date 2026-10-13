/* The holding page in the visitor's language (18), with a language picker in
   the header like Freally Flipcopy's (owner, 2026-10-01: "i need language
   switches for all my sites … just like 'Freally Flipcopy'"). The choice is
   remembered for every Freally holding page. */
(function () {
  'use strict';
  /* English first, the other seventeen alphabetically by English name; each
     shown by its own name, so a reader who can't read the current language can
     still find theirs. */
  var LOCALES = [
    { code: 'en', name: 'English', line: 'Documentation is coming soon. There are no downloads yet.' },
    { code: 'ar', name: 'العربية', line: 'التوثيق قادم قريبًا. لا توجد تنزيلات بعد.' },
    { code: 'zh-CN', name: '简体中文', line: '文档即将推出。目前还没有可下载的版本。' },
    { code: 'nl', name: 'Nederlands', line: 'De documentatie komt binnenkort. Er zijn nog geen downloads.' },
    { code: 'fr', name: 'Français', line: 'La documentation arrive bientôt. Aucun téléchargement pour l’instant.' },
    { code: 'de', name: 'Deutsch', line: 'Die Dokumentation kommt bald. Es gibt noch keine Downloads.' },
    { code: 'hi', name: 'हिन्दी', line: 'दस्तावेज़ जल्द आ रहे हैं। अभी कोई डाउनलोड उपलब्ध नहीं है।' },
    { code: 'id', name: 'Bahasa Indonesia', line: 'Dokumentasi segera hadir. Belum ada unduhan.' },
    { code: 'it', name: 'Italiano', line: 'La documentazione arriva presto. Non ci sono ancora download.' },
    { code: 'ja', name: '日本語', line: 'ドキュメントは近日公開予定です。ダウンロードはまだありません。' },
    { code: 'ko', name: '한국어', line: '문서는 곧 공개됩니다. 아직 다운로드는 없습니다.' },
    { code: 'pl', name: 'Polski', line: 'Dokumentacja pojawi się wkrótce. Nie ma jeszcze plików do pobrania.' },
    { code: 'pt-BR', name: 'Português (Brasil)', line: 'A documentação chega em breve. Ainda não há downloads.' },
    { code: 'ru', name: 'Русский', line: 'Документация скоро появится. Загрузок пока нет.' },
    { code: 'es', name: 'Español', line: 'La documentación llegará pronto. Todavía no hay descargas.' },
    { code: 'tr', name: 'Türkçe', line: 'Belgeler yakında geliyor. Henüz indirme yok.' },
    { code: 'uk', name: 'Українська', line: 'Документація незабаром. Завантажень поки немає.' },
    { code: 'vi', name: 'Tiếng Việt', line: 'Tài liệu sắp ra mắt. Hiện chưa có bản tải xuống.' },
  ];
  var STORE = 'freally.holding.language';

  function find(tag) {
    if (!tag) return null;
    for (var i = 0; i < LOCALES.length; i += 1) if (LOCALES[i].code === tag) return LOCALES[i];
    for (var j = 0; j < LOCALES.length; j += 1) {
      if (LOCALES[j].code.split('-')[0] === tag.split('-')[0]) return LOCALES[j];
    }
    return null;
  }

  function stored() {
    try { return window.localStorage.getItem(STORE); } catch (e) { return null; }
  }

  function remember(code) {
    try { window.localStorage.setItem(STORE, code); } catch (e) { /* private window */ }
  }

  function apply(locale) {
    document.getElementById('line').textContent = locale.line;
    document.documentElement.lang = locale.code;
    document.documentElement.dir = locale.code === 'ar' ? 'rtl' : 'ltr';
    picker.value = locale.code;
  }

  var picker = document.querySelector('select.locale');
  for (var k = 0; k < LOCALES.length; k += 1) {
    var option = document.createElement('option');
    option.value = LOCALES[k].code;
    option.textContent = LOCALES[k].name;
    option.lang = LOCALES[k].code;
    picker.appendChild(option);
  }
  picker.addEventListener('change', function () {
    var locale = find(picker.value) || LOCALES[0];
    remember(locale.code);
    apply(locale);
  });

  var chosen = find(stored());
  if (!chosen) {
    var wanted = navigator.languages || [navigator.language];
    for (var w = 0; w < wanted.length && !chosen; w += 1) chosen = find(wanted[w]);
  }
  apply(chosen || LOCALES[0]);
})();
