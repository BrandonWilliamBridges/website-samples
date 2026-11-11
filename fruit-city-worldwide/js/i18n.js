/* ============================================================
   Fruit City Worldwide — Language switcher
   ============================================================
   Adds a language menu (globe button) to the header of every page. A page loads it with
   <script src="js/i18n.js"></script> after main.js; nothing else in the
   page's markup has to change.

   How translation works:
   - TRANSLATIONS below maps a string id to its text in each language.
     EN holds the English text exactly as it appears on the site.
   - On load, every text on the page whose English matches an EN entry
     (ignoring extra spaces) is swapped for the chosen language.
   - Anything not in the table stays in English, and the menu offers a
     link to read the whole page through Google Translate.
   - The choice is remembered on this device and can be shared with
     ?lang=es (or any code in LANGUAGES).

   To translate more of the site: add an id to EN with the exact English
   text, then add that id to each language. Keep "Fruit City" in English:
   it is the name.
   ============================================================ */
(function () {
  'use strict';

  /* Languages in the menu, in order. `en` is the English name shown under each; `google` is Google Translate's code. */
  var LANGUAGES = [
    { code: 'en', en: 'English', name: 'English' },
    { code: 'es', en: 'Spanish', name: 'Español' },
    { code: 'fr', en: 'French', name: 'Français' },
    { code: 'ar', en: 'Arabic', name: 'العربية', dir: 'rtl' },
    { code: 'ur', en: 'Urdu', name: 'اردو', dir: 'rtl' },
    { code: 'it', en: 'Italian', name: 'Italiano' },
    { code: 'zh', en: 'Chinese', name: '中文', google: 'zh-CN' },
    { code: 'hi', en: 'Hindi', name: 'हिन्दी' },
    { code: 'bn', en: 'Bengali', name: 'বাংলা' },
    { code: 'pt', en: 'Portuguese', name: 'Português' },
    { code: 'ru', en: 'Russian', name: 'Русский' },
    { code: 'id', en: 'Indonesian', name: 'Bahasa Indonesia' },
    { code: 'de', en: 'German', name: 'Deutsch' }
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

  /* The menu brings its own styles (colours written out, not var()), so it
     looks right even when a browser still has an older cached copy of
     css/styles.css. */
  var FONT = '"Segoe UI","Helvetica Neue",Arial,sans-serif';
  var STYLES = [
    /* Header: push the nav toward the globe and keep everything on one line */
    '.site-header .container>.site-nav{margin-inline-start:auto}',
    '.site-header .site-nav__list a{white-space:nowrap}',
    '.site-header .site-logo{flex:none;white-space:nowrap}',

    '.lang-picker{position:relative;margin-inline-start:1.5rem;flex:0 0 auto}',
    '.lang-picker .lang-picker__btn{-webkit-appearance:none;appearance:none;display:inline-flex;align-items:center;gap:.4rem;' +
      'height:36px;margin:0;padding:0 .7rem 0 .6rem;background:transparent;color:rgba(255,255,255,.85);' +
      'border:1px solid rgba(255,255,255,.22);border-radius:999px;box-shadow:none;font:600 .82rem/1 ' + FONT + ';' +
      'letter-spacing:.05em;cursor:pointer;transition:background-color .25s ease,border-color .25s ease,color .25s ease}',
    '.lang-picker .lang-picker__btn:hover,.lang-picker .lang-picker__btn[aria-expanded="true"]{background-color:rgba(255,255,255,.08);' +
      'border-color:#6BBF7A;color:#fff}',
    '.lang-picker .lang-picker__btn:focus-visible,.lang-picker .lang-picker__opt:focus-visible{outline:2px solid #6BBF7A;outline-offset:2px}',
    '.lang-picker__btn svg{color:#6BBF7A;flex:none}',
    '.lang-picker__caret{width:6px;height:6px;margin-inline-start:.1rem;border-right:1.5px solid currentColor;' +
      'border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg);transition:transform .25s ease}',
    '.lang-picker__btn[aria-expanded="true"] .lang-picker__caret{transform:translateY(1px) rotate(225deg)}',

    '.lang-picker__menu{position:absolute;top:calc(100% + 10px);inset-inline-end:0;z-index:110;width:372px;padding:.6rem;' +
      'background-color:#fff;color:#1C1C1C;text-align:start;border-radius:12px;' +
      'box-shadow:0 12px 32px rgba(0,0,0,.28),0 0 0 1px rgba(13,40,24,.08)}',
    '.lang-picker__menu[hidden]{display:none}',
    '.lang-picker__title{margin:.15rem .5rem .5rem;font:700 .72rem/1.4 ' + FONT + ';letter-spacing:.1em;' +
      'text-transform:uppercase;color:#6A6A6A}',
    '.lang-picker__list{display:grid;grid-template-columns:1fr 1fr;gap:2px}',
    '.lang-picker .lang-picker__opt{-webkit-appearance:none;appearance:none;position:relative;display:flex;flex-direction:column;' +
      'justify-content:center;align-items:flex-start;gap:1px;min-height:46px;margin:0;padding:.4rem .6rem;padding-inline-end:1.6rem;' +
      'background:transparent;border:0;border-radius:8px;box-shadow:none;color:#1C1C1C;font-family:' + FONT + ';' +
      'text-align:start;cursor:pointer;transition:background-color .25s ease}',
    '.lang-picker .lang-picker__opt:hover,.lang-picker .lang-picker__opt:focus-visible{background-color:rgba(58,140,80,.09)}',
    '.lang-picker__native{font-size:.95rem;font-weight:600;line-height:1.25}',
    '.lang-picker__en{font-size:.75rem;color:#6A6A6A;line-height:1.2}',
    '.lang-picker .lang-picker__opt[aria-checked="true"]{background-color:rgba(58,140,80,.14)}',
    '.lang-picker__opt[aria-checked="true"] .lang-picker__native{color:#1A5C33}',
    '.lang-picker__opt[aria-checked="true"]::after{content:"";position:absolute;top:50%;inset-inline-end:.7rem;width:5px;height:10px;' +
      'border-right:2px solid #3A8C50;border-bottom:2px solid #3A8C50;transform:translateY(-65%) rotate(45deg)}',
    '.lang-picker__notice{margin:.5rem 0 0;padding:.6rem .5rem .2rem;border-top:1px solid rgba(13,40,24,.1);' +
      'font:400 .8rem/1.45 ' + FONT + ';color:#3E3E3E}',
    '.lang-picker__notice a{color:#3A8C50;font-weight:600}',

    /* A page without the usual header: the button floats in the corner */
    '.lang-picker.lang-picker--floating{position:fixed;top:1rem;inset-inline-end:1rem;z-index:200;margin:0}',
    '.lang-picker--floating .lang-picker__btn{background-color:#0D2818}',

    /* Small laptops and tablets: tighten the nav in steps so the globe and
       all seven links stay on one line */
    '@media (max-width:1100px) and (min-width:769px){.site-header .site-nav__list{gap:1rem}.lang-picker{margin-inline-start:1rem}}',
    '@media (max-width:1000px) and (min-width:769px){.site-header .site-nav__list{gap:.75rem}.lang-picker{margin-inline-start:.6rem}' +
      '.lang-picker .lang-picker__btn{width:36px;padding:0;justify-content:center}.lang-picker__code,.lang-picker__caret{display:none}}',
    '@media (max-width:880px) and (min-width:769px){.site-header .site-nav__list{gap:.55rem}.site-header .site-nav__list a{font-size:.8rem}' +
      '.site-header .site-nav__list .nav-cta{padding-left:.9rem;padding-right:.9rem}.lang-picker{margin-inline-start:.5rem}}',
    /* Phones: the globe sits just before the menu toggle */
    '@media (max-width:768px){.lang-picker{order:1;margin-inline-start:auto}.site-header .nav-toggle{order:2;margin-inline-start:.5rem}}',
    /* Small phones: full-width menu pinned under the header (the script sets its top) */
    '@media (max-width:560px){.lang-picker__menu{position:fixed;top:72px;left:1rem;right:1rem;width:auto;' +
      'max-height:calc(100vh - 96px);overflow-y:auto}}'
  ].join('\n');

  function addStyles() {
    if (document.getElementById('lang-picker-styles')) return;
    var style = document.createElement('style');
    style.id = 'lang-picker-styles';
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

  var GLOBE = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';

  /* A globe button in the header that opens a menu of languages. */
  function buildPicker() {
    var picker = document.createElement('div');
    picker.className = 'lang-picker';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-picker__btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'lang-picker-menu');
    btn.innerHTML = GLOBE + '<span class="lang-picker__code"></span><span class="lang-picker__caret" aria-hidden="true"></span>';
    picker.appendChild(btn);

    var menu = document.createElement('div');
    menu.className = 'lang-picker__menu';
    menu.id = 'lang-picker-menu';
    menu.hidden = true;

    var title = document.createElement('p');
    title.className = 'lang-picker__title';
    title.id = 'lang-picker-title';
    menu.appendChild(title);

    var list = document.createElement('div');
    list.className = 'lang-picker__list';
    list.setAttribute('role', 'menu');
    list.setAttribute('aria-labelledby', 'lang-picker-title');
    LANGUAGES.forEach(function (lang) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'lang-picker__opt';
      opt.setAttribute('role', 'menuitemradio');
      opt.setAttribute('data-lang', lang.code);
      opt.tabIndex = -1;
      var native = document.createElement('span');
      native.className = 'lang-picker__native';
      native.lang = lang.code;
      native.dir = lang.dir || 'ltr';
      native.textContent = lang.name;
      var english = document.createElement('span');
      english.className = 'lang-picker__en';
      english.lang = 'en';
      english.textContent = lang.en;
      opt.appendChild(native);
      if (lang.code !== 'en') opt.appendChild(english);
      opt.addEventListener('click', function () {
        save(lang.code);
        apply(lang.code);
        close(true);
      });
      list.appendChild(opt);
    });
    menu.appendChild(list);

    var notice = document.createElement('p');
    notice.className = 'lang-picker__notice';
    notice.hidden = true;
    var noticeText = document.createElement('span');
    var noticeLink = document.createElement('a');
    noticeLink.target = '_blank';
    noticeLink.rel = 'noopener';
    notice.appendChild(noticeText);
    notice.appendChild(document.createTextNode(' '));
    notice.appendChild(noticeLink);
    menu.appendChild(notice);
    picker.appendChild(menu);

    var options = list.querySelectorAll('.lang-picker__opt');
    function focusOption(i) { options[(i + options.length) % options.length].focus(); }
    function open() {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      /* On a phone the menu is pinned under the header (see CSS); place it below the button. */
      menu.style.top = window.matchMedia('(max-width: 560px)').matches ? (btn.getBoundingClientRect().bottom + 10) + 'px' : '';
      var current = list.querySelector('[aria-checked="true"]') || options[0];
      current.focus();
    }
    function close(refocus) {
      if (menu.hidden) return;
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    }
    btn.addEventListener('click', function () { menu.hidden ? open() : close(false); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    list.addEventListener('keydown', function (e) {
      var i = Array.prototype.indexOf.call(options, document.activeElement);
      var cols = window.getComputedStyle(list).gridTemplateColumns.split(' ').length;
      if (e.key === 'ArrowDown') focusOption(i + cols);
      else if (e.key === 'ArrowUp') focusOption(i - cols);
      else if (e.key === 'ArrowRight') focusOption(i + (document.documentElement.dir === 'rtl' ? -1 : 1));
      else if (e.key === 'ArrowLeft') focusOption(i + (document.documentElement.dir === 'rtl' ? 1 : -1));
      else if (e.key === 'Home') focusOption(0);
      else if (e.key === 'End') focusOption(-1);
      else return;
      e.preventDefault();
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      if (e.key === 'Tab') close(false);
    });
    document.addEventListener('click', function (e) { if (!picker.contains(e.target)) close(false); });
    window.addEventListener('resize', function () { close(false); });

    picker._btn = btn;
    picker._code = btn.querySelector('.lang-picker__code');
    picker._title = title;
    picker._notice = notice;
    picker._noticeText = noticeText;
    picker._noticeLink = noticeLink;
    return picker;
  }

  var picker;

  function apply(code) {
    var lang = findLanguage(code) || LANGUAGES[0];
    code = lang.code;

    document.documentElement.lang = code;
    document.documentElement.dir = lang.dir || 'ltr';

    targets.forEach(function (item) {
      item.node.nodeValue = item.lead + t(item.id, code) + item.trail;
    });

    var label = t('language', code);
    picker._code.textContent = code.toUpperCase();
    picker._btn.setAttribute('aria-label', label + ': ' + lang.name);
    picker._btn.title = label;
    picker._title.textContent = label;
    picker._title.lang = code;
    picker.querySelectorAll('.lang-picker__opt').forEach(function (opt) {
      opt.setAttribute('aria-checked', opt.getAttribute('data-lang') === code ? 'true' : 'false');
    });

    if (code === 'en') {
      picker._notice.hidden = true;
    } else {
      picker._notice.hidden = false;
      picker._notice.lang = code;
      picker._notice.dir = lang.dir || 'ltr';
      picker._noticeText.textContent = t('notice', code);
      picker._noticeLink.textContent = t('translateFull', code) + ' ↗';
      picker._noticeLink.href = 'https://translate.google.com/translate?sl=en&tl=' +
        encodeURIComponent(lang.google || code) + '&u=' + encodeURIComponent(window.location.href);
    }
  }

  function init() {
    addStyles();
    picker = buildPicker();
    var slot = document.querySelector('.site-header .container');
    if (slot) {
      slot.appendChild(picker);
    } else { /* a page without the usual header: float the button in the corner */
      picker.classList.add('lang-picker--floating');
      document.body.appendChild(picker);
    }
    collectTargets(picker);

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
