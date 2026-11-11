/* ============================================================
   Fruit City Worldwide — Language switcher
   ============================================================
   Adds a language bar to the top of every page. A page loads it with
   <script src="js/i18n.js"></script> after main.js; nothing else in the
   page's markup has to change.

   How translation works:
   - TRANSLATIONS below maps a string id to its text in each language.
     EN holds the English text exactly as it appears on the site.
   - On load, every text on the page whose English matches an EN entry
     (ignoring extra spaces) is swapped for the chosen language.
   - Anything not in the table stays in English, and the bar offers a
     link to read the whole page through Google Translate.
   - The choice is remembered on this device and can be shared with
     ?lang=es (or any code in LANGUAGES).

   To translate more of the site: add an id to EN with the exact English
   text, then add that id to each language. Keep "Fruit City" in English:
   it is the name.
   ============================================================ */
(function () {
  'use strict';

  /* Languages in the bar, in order. `google` is Google Translate's code. */
  var LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
    { code: 'ur', name: 'اردو', dir: 'rtl' },
    { code: 'it', name: 'Italiano' },
    { code: 'zh', name: '中文', google: 'zh-CN' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'de', name: 'Deutsch' }
  ];

  var EN = {
    language: 'Language',
    home: 'Home',
    vision: 'The Vision',
    impact: 'Global Impact',
    news: 'News',
    volunteer: 'Volunteer',
    involved: 'Get Involved',
    join: 'Join Us',
    navigate: 'Navigate',
    roundup: 'News Roundup',
    living: 'Living Model',
    food: 'Food Innovation',
    energy: 'Energy & Transport',
    water: 'Water & Waste',
    conservation: 'Conservation',
    philosophy: 'Philosophy',
    math: 'The Math',
    contact: 'Contact',
    a11y: 'Accessibility',
    rss: 'Subscribe (RSS)',
    heroA: 'Everything Starts',
    heroB: 'With a Seed.',
    heroSub: 'A revolutionary model for sustainable urban living — ethical, moral, and lawful. From and for the people.',
    exploreVision: 'Explore the Vision',
    exploreFull: 'Explore the Full Vision',
    joinMovement: 'Join the Movement',
    ctaHeading: "This Is Humanity's Opportunity",
    desc1: 'A model generator for eco-friendly town towers.',
    desc2: 'All ideas freely given to humanity.',
    desc3: '501(c)(3) nonprofit — open budget transparency.',
    copyright: 'Fruit City Worldwide. All ideas copyrighted but freely given to humanity.',
    notice: 'Some of this page is still in English.',
    translateFull: 'Translate the full page with Google'
  };

  var TRANSLATIONS = {
    es: {
      language: 'Idioma', home: 'Inicio', vision: 'La Visión', impact: 'Impacto Global', news: 'Noticias',
      volunteer: 'Voluntariado', involved: 'Participa', join: 'Únete', navigate: 'Navegación', roundup: 'Resumen de Noticias',
      living: 'Modelo de Vida', food: 'Innovación Alimentaria', energy: 'Energía y Transporte',
      water: 'Agua y Residuos', conservation: 'Conservación', philosophy: 'Filosofía', math: 'Las Cifras',
      contact: 'Contacto', a11y: 'Accesibilidad', rss: 'Suscribirse (RSS)',
      heroA: 'Todo Empieza', heroB: 'Con una Semilla.',
      heroSub: 'Un modelo revolucionario de vida urbana sostenible: ético, moral y legal. Del pueblo y para el pueblo.',
      exploreVision: 'Explora la Visión', exploreFull: 'Explora la Visión Completa', joinMovement: 'Únete al Movimiento',
      ctaHeading: 'Esta Es la Oportunidad de la Humanidad',
      desc1: 'Un generador de modelos para torres urbanas ecológicas.',
      desc2: 'Todas las ideas, entregadas libremente a la humanidad.',
      desc3: 'Organización sin fines de lucro 501(c)(3), con presupuesto abierto y transparente.',
      copyright: 'Fruit City Worldwide. Todas las ideas tienen derechos de autor, pero se entregan libremente a la humanidad.',
      notice: 'Parte de esta página todavía está en inglés.', translateFull: 'Traducir la página completa con Google'
    },
    fr: {
      language: 'Langue', home: 'Accueil', vision: 'La Vision', impact: 'Impact Mondial', news: 'Actualités',
      volunteer: 'Bénévolat', involved: 'Participer', join: 'Rejoignez-nous', navigate: 'Navigation', roundup: 'Revue de Presse',
      living: 'Modèle de Vie', food: 'Innovation Alimentaire', energy: 'Énergie et Transport',
      water: 'Eau et Déchets', conservation: 'Conservation', philosophy: 'Philosophie', math: 'Les Chiffres',
      contact: 'Contact', a11y: 'Accessibilité', rss: "S'abonner (RSS)",
      heroA: 'Tout Commence', heroB: 'Par une Graine.',
      heroSub: 'Un modèle révolutionnaire de vie urbaine durable : éthique, moral et légal. Par le peuple et pour le peuple.',
      exploreVision: 'Découvrir la Vision', exploreFull: 'Découvrir Toute la Vision', joinMovement: 'Rejoindre le Mouvement',
      ctaHeading: "C'est l'Occasion de l'Humanité",
      desc1: 'Un générateur de modèles pour des tours urbaines écologiques.',
      desc2: "Toutes les idées offertes librement à l'humanité.",
      desc3: 'Association à but non lucratif 501(c)(3) — budget ouvert et transparent.',
      copyright: "Fruit City Worldwide. Toutes les idées sont protégées par le droit d'auteur, mais offertes librement à l'humanité.",
      notice: 'Une partie de cette page est encore en anglais.', translateFull: 'Traduire toute la page avec Google'
    },
    ar: {
      language: 'اللغة', home: 'الرئيسية', vision: 'الرؤية', impact: 'الأثر العالمي', news: 'الأخبار',
      volunteer: 'تطوّع', involved: 'شارك معنا', join: 'انضم إلينا', navigate: 'التنقل', roundup: 'ملخص الأخبار',
      living: 'نموذج المعيشة', food: 'ابتكار الغذاء', energy: 'الطاقة والنقل',
      water: 'المياه والنفايات', conservation: 'الحفاظ على البيئة', philosophy: 'الفلسفة', math: 'الأرقام',
      contact: 'اتصل بنا', a11y: 'إمكانية الوصول', rss: 'اشترك (RSS)',
      heroA: 'كل شيء يبدأ', heroB: 'ببذرة.',
      heroSub: 'نموذج ثوري للحياة الحضرية المستدامة — أخلاقي ومبدئي وقانوني. من الناس وإلى الناس.',
      exploreVision: 'استكشف الرؤية', exploreFull: 'استكشف الرؤية كاملة', joinMovement: 'انضم إلى الحركة',
      ctaHeading: 'هذه فرصة البشرية',
      desc1: 'مولّد نماذج لأبراج سكنية صديقة للبيئة.',
      desc2: 'كل الأفكار مقدَّمة للبشرية مجانًا.',
      desc3: 'منظمة غير ربحية 501(c)(3) — ميزانية مفتوحة وشفافة.',
      copyright: 'Fruit City Worldwide. جميع الأفكار محمية بحقوق النشر لكنها مقدَّمة للبشرية مجانًا.',
      notice: 'جزء من هذه الصفحة لا يزال باللغة الإنجليزية.', translateFull: 'ترجم الصفحة كاملة باستخدام Google'
    },
    ur: {
      language: 'زبان', home: 'ہوم', vision: 'وژن', impact: 'عالمی اثرات', news: 'خبریں',
      volunteer: 'رضاکار بنیں', involved: 'شامل ہوں', join: 'ہمارے ساتھ آئیں', navigate: 'فہرست', roundup: 'خبروں کا خلاصہ',
      living: 'رہائشی ماڈل', food: 'خوراک میں جدت', energy: 'توانائی اور نقل و حمل',
      water: 'پانی اور فضلہ', conservation: 'ماحولیاتی تحفظ', philosophy: 'فلسفہ', math: 'اعداد و شمار',
      contact: 'رابطہ', a11y: 'رسائی', rss: 'سبسکرائب کریں (RSS)',
      heroA: 'ہر چیز کی شروعات', heroB: 'ایک بیج سے ہوتی ہے۔',
      heroSub: 'پائیدار شہری زندگی کا ایک انقلابی ماڈل — اخلاقی، بااصول اور قانونی۔ عوام کی طرف سے، عوام کے لیے۔',
      exploreVision: 'وژن دیکھیں', exploreFull: 'مکمل وژن دیکھیں', joinMovement: 'تحریک میں شامل ہوں',
      ctaHeading: 'یہ انسانیت کے لیے ایک موقع ہے',
      desc1: 'ماحول دوست شہری ٹاورز کے ماڈل تیار کرنے والا ادارہ۔',
      desc2: 'تمام خیالات انسانیت کے لیے مفت ہیں۔',
      desc3: '501(c)(3) غیر منافع بخش ادارہ — کھلا اور شفاف بجٹ۔',
      copyright: 'Fruit City Worldwide۔ تمام خیالات کے حقوق محفوظ ہیں، لیکن یہ انسانیت کے لیے مفت ہیں۔',
      notice: 'اس صفحے کا کچھ حصہ ابھی انگریزی میں ہے۔', translateFull: 'Google سے پورا صفحہ ترجمہ کریں'
    },
    it: {
      language: 'Lingua', home: 'Home', vision: 'La Visione', impact: 'Impatto Globale', news: 'Notizie',
      volunteer: 'Volontariato', involved: 'Partecipa', join: 'Unisciti a Noi', navigate: 'Navigazione', roundup: 'Rassegna Notizie',
      living: 'Modello Abitativo', food: 'Innovazione Alimentare', energy: 'Energia e Trasporti',
      water: 'Acqua e Rifiuti', conservation: 'Conservazione', philosophy: 'Filosofia', math: 'I Numeri',
      contact: 'Contatti', a11y: 'Accessibilità', rss: 'Iscriviti (RSS)',
      heroA: 'Tutto Inizia', heroB: 'Con un Seme.',
      heroSub: 'Un modello rivoluzionario di vita urbana sostenibile: etico, morale e legale. Dal popolo e per il popolo.',
      exploreVision: 'Scopri la Visione', exploreFull: 'Scopri la Visione Completa', joinMovement: 'Unisciti al Movimento',
      ctaHeading: "Questa È l'Opportunità dell'Umanità",
      desc1: 'Un generatore di modelli per torri urbane ecosostenibili.',
      desc2: "Tutte le idee donate liberamente all'umanità.",
      desc3: 'Organizzazione non profit 501(c)(3) — bilancio aperto e trasparente.',
      copyright: "Fruit City Worldwide. Tutte le idee sono protette da copyright, ma donate liberamente all'umanità.",
      notice: 'Parte di questa pagina è ancora in inglese.', translateFull: "Traduci l'intera pagina con Google"
    },
    zh: {
      language: '语言', home: '首页', vision: '愿景', impact: '全球影响', news: '新闻',
      volunteer: '志愿服务', involved: '参与其中', join: '加入我们', navigate: '导航', roundup: '新闻汇总',
      living: '生活模式', food: '食品创新', energy: '能源与交通',
      water: '水与废弃物', conservation: '环境保护', philosophy: '理念', math: '数据',
      contact: '联系我们', a11y: '无障碍', rss: '订阅 (RSS)',
      heroA: '一切始于', heroB: '一颗种子。',
      heroSub: '一种革命性的可持续城市生活模式——合乎伦理、道德与法律。源于人民，服务人民。',
      exploreVision: '探索愿景', exploreFull: '探索完整愿景', joinMovement: '加入运动',
      ctaHeading: '这是人类的机遇',
      desc1: '生态友好型城镇高楼的模型设计者。',
      desc2: '所有创意无偿献给人类。',
      desc3: '501(c)(3) 非营利组织——预算公开透明。',
      copyright: 'Fruit City Worldwide。所有创意均受版权保护，但无偿献给人类。',
      notice: '本页部分内容仍为英文。', translateFull: '使用 Google 翻译整个页面'
    },
    hi: {
      language: 'भाषा', home: 'होम', vision: 'विज़न', impact: 'वैश्विक प्रभाव', news: 'समाचार',
      volunteer: 'स्वयंसेवा', involved: 'जुड़ें', join: 'हमसे जुड़ें', navigate: 'नेविगेशन', roundup: 'समाचार सारांश',
      living: 'जीवन मॉडल', food: 'खाद्य नवाचार', energy: 'ऊर्जा और परिवहन',
      water: 'जल और अपशिष्ट', conservation: 'संरक्षण', philosophy: 'दर्शन', math: 'आंकड़े',
      contact: 'संपर्क', a11y: 'सुलभता', rss: 'सदस्यता लें (RSS)',
      heroA: 'हर चीज़ की शुरुआत', heroB: 'एक बीज से होती है।',
      heroSub: 'टिकाऊ शहरी जीवन का एक क्रांतिकारी मॉडल — नैतिक, सिद्धांतनिष्ठ और वैध। जनता द्वारा, जनता के लिए।',
      exploreVision: 'विज़न देखें', exploreFull: 'पूरा विज़न देखें', joinMovement: 'आंदोलन से जुड़ें',
      ctaHeading: 'यह मानवता के लिए अवसर है',
      desc1: 'पर्यावरण-अनुकूल शहरी टावरों के मॉडल तैयार करने वाली संस्था।',
      desc2: 'सभी विचार मानवता को निःशुल्क समर्पित।',
      desc3: '501(c)(3) गैर-लाभकारी संस्था — खुला और पारदर्शी बजट।',
      copyright: 'Fruit City Worldwide। सभी विचार कॉपीराइट हैं, लेकिन मानवता को निःशुल्क समर्पित हैं।',
      notice: 'इस पेज का कुछ हिस्सा अभी अंग्रेज़ी में है।', translateFull: 'Google से पूरा पेज अनुवाद करें'
    },
    bn: {
      language: 'ভাষা', home: 'হোম', vision: 'ভিশন', impact: 'বৈশ্বিক প্রভাব', news: 'খবর',
      volunteer: 'স্বেচ্ছাসেবা', involved: 'যুক্ত হোন', join: 'আমাদের সাথে যোগ দিন', navigate: 'নেভিগেশন', roundup: 'খবরের সারসংক্ষেপ',
      living: 'জীবনযাপনের মডেল', food: 'খাদ্য উদ্ভাবন', energy: 'শক্তি ও পরিবহন',
      water: 'পানি ও বর্জ্য', conservation: 'সংরক্ষণ', philosophy: 'দর্শন', math: 'হিসাব',
      contact: 'যোগাযোগ', a11y: 'অ্যাক্সেসিবিলিটি', rss: 'সাবস্ক্রাইব করুন (RSS)',
      heroA: 'সবকিছু শুরু হয়', heroB: 'একটি বীজ থেকে।',
      heroSub: 'টেকসই নগরজীবনের একটি বৈপ্লবিক মডেল — নৈতিক, আদর্শনিষ্ঠ ও আইনসম্মত। জনগণের দ্বারা, জনগণের জন্য।',
      exploreVision: 'ভিশন দেখুন', exploreFull: 'সম্পূর্ণ ভিশন দেখুন', joinMovement: 'আন্দোলনে যোগ দিন',
      ctaHeading: 'এটি মানবতার জন্য একটি সুযোগ',
      desc1: 'পরিবেশবান্ধব নগর টাওয়ারের মডেল নির্মাতা।',
      desc2: 'সব ধারণা মানবতার জন্য বিনামূল্যে দেওয়া।',
      desc3: '501(c)(3) অলাভজনক প্রতিষ্ঠান — উন্মুক্ত ও স্বচ্ছ বাজেট।',
      copyright: 'Fruit City Worldwide। সব ধারণা কপিরাইটকৃত, তবে মানবতার জন্য বিনামূল্যে দেওয়া।',
      notice: 'এই পৃষ্ঠার কিছু অংশ এখনও ইংরেজিতে।', translateFull: 'Google দিয়ে পুরো পৃষ্ঠা অনুবাদ করুন'
    },
    pt: {
      language: 'Idioma', home: 'Início', vision: 'A Visão', impact: 'Impacto Global', news: 'Notícias',
      volunteer: 'Voluntariado', involved: 'Participe', join: 'Junte-se a Nós', navigate: 'Navegação', roundup: 'Resumo de Notícias',
      living: 'Modelo de Vida', food: 'Inovação Alimentar', energy: 'Energia e Transporte',
      water: 'Água e Resíduos', conservation: 'Conservação', philosophy: 'Filosofia', math: 'Os Números',
      contact: 'Contato', a11y: 'Acessibilidade', rss: 'Assinar (RSS)',
      heroA: 'Tudo Começa', heroB: 'Com uma Semente.',
      heroSub: 'Um modelo revolucionário de vida urbana sustentável — ético, moral e legal. Do povo e para o povo.',
      exploreVision: 'Explore a Visão', exploreFull: 'Explore a Visão Completa', joinMovement: 'Junte-se ao Movimento',
      ctaHeading: 'Esta É a Oportunidade da Humanidade',
      desc1: 'Um gerador de modelos para torres urbanas ecológicas.',
      desc2: 'Todas as ideias oferecidas livremente à humanidade.',
      desc3: 'Organização sem fins lucrativos 501(c)(3) — orçamento aberto e transparente.',
      copyright: 'Fruit City Worldwide. Todas as ideias são protegidas por direitos autorais, mas oferecidas livremente à humanidade.',
      notice: 'Parte desta página ainda está em inglês.', translateFull: 'Traduzir a página inteira com o Google'
    },
    ru: {
      language: 'Язык', home: 'Главная', vision: 'Видение', impact: 'Глобальное влияние', news: 'Новости',
      volunteer: 'Волонтёрство', involved: 'Участвуйте', join: 'Присоединяйтесь', navigate: 'Навигация', roundup: 'Обзор новостей',
      living: 'Модель жизни', food: 'Пищевые инновации', energy: 'Энергия и транспорт',
      water: 'Вода и отходы', conservation: 'Охрана природы', philosophy: 'Философия', math: 'Расчёты',
      contact: 'Контакты', a11y: 'Доступность', rss: 'Подписаться (RSS)',
      heroA: 'Всё начинается', heroB: 'с семени.',
      heroSub: 'Революционная модель устойчивой городской жизни — этичная, нравственная и законная. От народа и для народа.',
      exploreVision: 'Узнать о видении', exploreFull: 'Полное видение', joinMovement: 'Присоединиться к движению',
      ctaHeading: 'Это возможность для человечества',
      desc1: 'Создатель моделей экологичных городских башен.',
      desc2: 'Все идеи безвозмездно переданы человечеству.',
      desc3: 'Некоммерческая организация 501(c)(3) — открытый и прозрачный бюджет.',
      copyright: 'Fruit City Worldwide. Все идеи защищены авторским правом, но безвозмездно переданы человечеству.',
      notice: 'Часть этой страницы пока на английском.', translateFull: 'Перевести всю страницу через Google'
    },
    id: {
      language: 'Bahasa', home: 'Beranda', vision: 'Visi', impact: 'Dampak Global', news: 'Berita',
      volunteer: 'Relawan', involved: 'Ikut Terlibat', join: 'Bergabunglah', navigate: 'Navigasi', roundup: 'Rangkuman Berita',
      living: 'Model Hunian', food: 'Inovasi Pangan', energy: 'Energi & Transportasi',
      water: 'Air & Limbah', conservation: 'Konservasi', philosophy: 'Filosofi', math: 'Hitungannya',
      contact: 'Kontak', a11y: 'Aksesibilitas', rss: 'Berlangganan (RSS)',
      heroA: 'Semuanya Berawal', heroB: 'dari Sebutir Benih.',
      heroSub: 'Model revolusioner untuk kehidupan perkotaan yang berkelanjutan — etis, bermoral, dan sah. Dari rakyat dan untuk rakyat.',
      exploreVision: 'Jelajahi Visi', exploreFull: 'Jelajahi Visi Lengkap', joinMovement: 'Bergabung dengan Gerakan',
      ctaHeading: 'Inilah Kesempatan bagi Umat Manusia',
      desc1: 'Pembuat model menara kota yang ramah lingkungan.',
      desc2: 'Semua gagasan diberikan cuma-cuma kepada umat manusia.',
      desc3: 'Organisasi nirlaba 501(c)(3) — anggaran terbuka dan transparan.',
      copyright: 'Fruit City Worldwide. Semua gagasan dilindungi hak cipta, tetapi diberikan cuma-cuma kepada umat manusia.',
      notice: 'Sebagian halaman ini masih dalam bahasa Inggris.', translateFull: 'Terjemahkan seluruh halaman dengan Google'
    },
    de: {
      language: 'Sprache', home: 'Startseite', vision: 'Die Vision', impact: 'Globale Wirkung', news: 'Neuigkeiten',
      volunteer: 'Ehrenamt', involved: 'Mitmachen', join: 'Mach mit', navigate: 'Navigation', roundup: 'Nachrichtenüberblick',
      living: 'Lebensmodell', food: 'Lebensmittel-Innovation', energy: 'Energie & Verkehr',
      water: 'Wasser & Abfall', conservation: 'Naturschutz', philosophy: 'Philosophie', math: 'Die Zahlen',
      contact: 'Kontakt', a11y: 'Barrierefreiheit', rss: 'Abonnieren (RSS)',
      heroA: 'Alles beginnt', heroB: 'mit einem Samen.',
      heroSub: 'Ein revolutionäres Modell für nachhaltiges Leben in der Stadt — ethisch, moralisch und rechtmäßig. Vom Volk und für das Volk.',
      exploreVision: 'Die Vision entdecken', exploreFull: 'Die ganze Vision entdecken', joinMovement: 'Der Bewegung beitreten',
      ctaHeading: 'Das ist die Chance der Menschheit',
      desc1: 'Ein Modellentwickler für umweltfreundliche Stadttürme.',
      desc2: 'Alle Ideen frei für die Menschheit.',
      desc3: 'Gemeinnützige 501(c)(3)-Organisation — offener, transparenter Haushalt.',
      copyright: 'Fruit City Worldwide. Alle Ideen sind urheberrechtlich geschützt, aber der Menschheit frei gegeben.',
      notice: 'Teile dieser Seite sind noch auf Englisch.', translateFull: 'Ganze Seite mit Google übersetzen'
    }
  };

  var STORAGE_KEY = 'fcw-lang';

  /* The bar brings its own styles, so it looks right even when a browser
     still has an older cached copy of css/styles.css. */
  var STYLES = [
    '.lang-bar{background-color:#08190F;color:rgba(255,255,255,.85);font-size:.85rem;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.lang-bar .lang-bar__inner{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem 1rem;padding-top:.35rem;padding-bottom:.35rem}',
    '.lang-bar .lang-bar__label{font-weight:600;color:#6BBF7A;white-space:nowrap}',
    '.lang-bar .lang-bar__list{display:flex;gap:.25rem;overflow-x:auto;flex:1 1 0;min-width:0;scrollbar-width:thin}',
    '.lang-bar .lang-bar__btn{-webkit-appearance:none;appearance:none;flex:0 0 auto;margin:0;background:transparent;' +
      'color:rgba(255,255,255,.85);border:1px solid transparent;border-radius:999px;padding:.3rem .75rem;min-height:32px;' +
      'font:inherit;line-height:1.2;cursor:pointer;white-space:nowrap;box-shadow:none;transition:background-color .2s,color .2s}',
    '.lang-bar .lang-bar__btn:hover,.lang-bar .lang-bar__btn:focus-visible{background-color:rgba(255,255,255,.1);color:#fff}',
    '.lang-bar .lang-bar__btn:focus-visible{outline:2px solid #6BBF7A;outline-offset:1px}',
    '.lang-bar .lang-bar__btn[aria-pressed="true"]{background-color:#6BBF7A;color:#0D2818;font-weight:700}',
    '.lang-bar .lang-bar__notice{flex-basis:100%;margin:0;font-size:.8rem;color:rgba(255,255,255,.75)}',
    '.lang-bar .lang-bar__notice a{color:#6BBF7A}',
    '@media (max-width:768px){.lang-bar .lang-bar__label{flex-basis:100%}.lang-bar .lang-bar__btn{min-height:40px}}'
  ].join('\n');

  function addStyles() {
    if (document.getElementById('lang-bar-styles')) return;
    var style = document.createElement('style');
    style.id = 'lang-bar-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function normalize(s) { return s.replace(/\s+/g, ' ').trim(); }

  /* English text → id, for matching what is on the page. */
  var BY_ENGLISH = {};
  Object.keys(EN).forEach(function (id) { BY_ENGLISH[normalize(EN[id])] = id; });

  function findLanguage(code) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].code === code) return LANGUAGES[i];
    }
    return null;
  }

  function t(id, code) {
    var table = TRANSLATIONS[code];
    return (table && table[id]) || EN[id];
  }

  function readSaved() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function save(code) {
    try { window.localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* private mode: not remembered */ }
  }

  /* Every translatable text node on the page, with its English kept so we can switch back. */
  var targets = [];
  function collectTargets(bar) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentNode;
        if (!parent || bar.contains(node)) return NodeFilter.FILTER_REJECT;
        if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(parent.nodeName)) return NodeFilter.FILTER_REJECT;
        return BY_ENGLISH[normalize(node.nodeValue)] ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var raw = node.nodeValue;
      targets.push({
        node: node,
        id: BY_ENGLISH[normalize(raw)],
        lead: raw.match(/^\s*/)[0],
        trail: raw.match(/\s*$/)[0]
      });
    }
  }

  function buildBar() {
    var bar = document.createElement('div');
    bar.className = 'lang-bar';
    bar.setAttribute('dir', 'ltr');

    var inner = document.createElement('div');
    inner.className = 'container lang-bar__inner';

    var label = document.createElement('span');
    label.className = 'lang-bar__label';
    label.id = 'lang-bar-label';
    inner.appendChild(label);

    var list = document.createElement('div');
    list.className = 'lang-bar__list';
    list.setAttribute('role', 'group');
    list.setAttribute('aria-labelledby', 'lang-bar-label');

    LANGUAGES.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-bar__btn';
      btn.lang = lang.code;
      btn.dir = lang.dir || 'ltr';
      btn.textContent = lang.name;
      btn.setAttribute('data-lang', lang.code);
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        save(lang.code);
        apply(lang.code);
      });
      list.appendChild(btn);
    });
    inner.appendChild(list);

    var notice = document.createElement('p');
    notice.className = 'lang-bar__notice';
    notice.hidden = true;
    var noticeText = document.createElement('span');
    var noticeLink = document.createElement('a');
    noticeLink.target = '_blank';
    noticeLink.rel = 'noopener';
    notice.appendChild(noticeText);
    notice.appendChild(document.createTextNode(' '));
    notice.appendChild(noticeLink);
    inner.appendChild(notice);

    bar.appendChild(inner);
    bar._label = label;
    bar._notice = notice;
    bar._noticeText = noticeText;
    bar._noticeLink = noticeLink;
    return bar;
  }

  var bar;

  function apply(code) {
    var lang = findLanguage(code) || LANGUAGES[0];
    code = lang.code;

    document.documentElement.lang = code;
    document.documentElement.dir = lang.dir || 'ltr';

    targets.forEach(function (item) {
      item.node.nodeValue = item.lead + t(item.id, code) + item.trail;
    });

    bar._label.textContent = t('language', code);
    bar.querySelectorAll('.lang-bar__btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === code;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        /* On a phone the row scrolls sideways: bring the chosen language into view without moving the page. */
        var list = btn.parentNode;
        var left = btn.offsetLeft - list.offsetLeft;
        if (left < list.scrollLeft || left + btn.offsetWidth > list.scrollLeft + list.clientWidth) {
          list.scrollLeft = left - 8;
        }
      }
    });

    if (code === 'en') {
      bar._notice.hidden = true;
    } else {
      bar._notice.hidden = false;
      bar._notice.lang = code;
      bar._notice.dir = lang.dir || 'ltr';
      bar._noticeText.textContent = t('notice', code);
      bar._noticeLink.textContent = t('translateFull', code) + ' ↗';
      bar._noticeLink.href = 'https://translate.google.com/translate?sl=en&tl=' +
        encodeURIComponent(lang.google || code) + '&u=' + encodeURIComponent(window.location.href);
    }
  }

  function init() {
    addStyles();
    bar = buildBar();
    var header = document.querySelector('.site-header');
    document.body.insertBefore(bar, header || document.body.firstChild);
    collectTargets(bar);

    var fromUrl = null;
    try { fromUrl = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* old browser */ }
    var code = (fromUrl && findLanguage(fromUrl) && fromUrl) || readSaved() || 'en';
    if (fromUrl && findLanguage(fromUrl)) save(fromUrl);
    apply(code);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
