/* The holding page's one sentence, in the visitor's language (18). */
(function () {
  'use strict';
  var LINE = {
    en: 'Documentation is coming soon. There are no downloads yet.',
    ar: 'التوثيق قادم قريبًا. لا توجد تنزيلات بعد.',
    'zh-CN': '文档即将推出。目前还没有可下载的版本。',
    nl: 'De documentatie komt binnenkort. Er zijn nog geen downloads.',
    fr: 'La documentation arrive bientôt. Aucun téléchargement pour l’instant.',
    de: 'Die Dokumentation kommt bald. Es gibt noch keine Downloads.',
    hi: 'दस्तावेज़ जल्द आ रहे हैं। अभी कोई डाउनलोड उपलब्ध नहीं है।',
    id: 'Dokumentasi segera hadir. Belum ada unduhan.',
    it: 'La documentazione arriva presto. Non ci sono ancora download.',
    ja: 'ドキュメントは近日公開予定です。ダウンロードはまだありません。',
    ko: '문서는 곧 공개됩니다. 아직 다운로드는 없습니다.',
    pl: 'Dokumentacja pojawi się wkrótce. Nie ma jeszcze plików do pobrania.',
    'pt-BR': 'A documentação chega em breve. Ainda não há downloads.',
    ru: 'Документация скоро появится. Загрузок пока нет.',
    es: 'La documentación llegará pronto. Todavía no hay descargas.',
    tr: 'Belgeler yakında geliyor. Henüz indirme yok.',
    uk: 'Документація незабаром. Завантажень поки немає.',
    vi: 'Tài liệu sắp ra mắt. Hiện chưa có bản tải xuống.',
  };
  var wanted = (navigator.languages || [navigator.language || 'en']).concat(['en']);
  for (var i = 0; i < wanted.length; i += 1) {
    var tag = wanted[i] || '';
    var code = LINE[tag] ? tag : null;
    if (!code) {
      for (var key in LINE) if (key.split('-')[0] === tag.split('-')[0]) { code = key; break; }
    }
    if (code) {
      document.getElementById('line').textContent = LINE[code];
      document.documentElement.lang = code;
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      return;
    }
  }
})();
