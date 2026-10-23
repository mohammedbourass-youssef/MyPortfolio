export type ServiceLang = 'en' | 'fr' | 'ar'
export type Service = {
  id: string
  icon: 'globe' | 'mobile' | 'architecture' | 'desktop' | 'api'
  title: Record<ServiceLang, string>
  description: Record<ServiceLang, string>
  bullets: Record<ServiceLang, string[]>
}

export const services: Service[] = [
  {
    id: 'websites', icon: 'globe',
    title: { en: 'Website creation and maintenance', fr: 'Création et maintenance de sites web', ar: 'إنشاء المواقع وصيانتها' },
    description: {
      en: 'Business websites and web apps built to work well across devices and stay easy to maintain.',
      fr: 'Des sites professionnels et applications web adaptés à tous les écrans et simples à maintenir.',
      ar: 'مواقع للأعمال وتطبيقات ويب تعمل بسلاسة على مختلف الأجهزة ويسهل صيانتها.'
    },
    bullets: {
      en: ['React and Laravel development', 'Responsive layouts and SEO basics', 'Hosting, deployment, and updates', 'Bug fixes, performance, and security checks'],
      fr: ['Développement avec React et Laravel', 'Interfaces adaptatives et bases du référencement', 'Hébergement, mise en ligne et mises à jour', 'Corrections, performances et vérifications de sécurité'],
      ar: ['التطوير باستخدام React وLaravel', 'تصميم متجاوب وأساسيات تحسين الظهور في البحث', 'الاستضافة والنشر والتحديثات', 'إصلاح الأخطاء وفحص الأداء والأمان']
    }
  },
  {
    id: 'mobile', icon: 'mobile',
    title: { en: 'Mobile applications', fr: 'Applications mobiles', ar: 'تطبيقات الهاتف' },
    description: {
      en: 'Flutter applications for Android and iOS, designed around clear structure and reliable integrations.',
      fr: 'Des applications Flutter pour Android et iOS, conçues avec une structure claire et des intégrations fiables.',
      ar: 'تطبيقات Flutter لنظامي Android وiOS، ببنية واضحة وتكاملات موثوقة.'
    },
    bullets: {
      en: ['Clean architecture with BLoC or MVVM', 'Authentication and push notifications', 'API integration', 'Store-ready builds'],
      fr: ['Architecture claire avec BLoC ou MVVM', 'Authentification et notifications push', 'Intégration d’API', 'Versions prêtes pour les stores'],
      ar: ['بنية واضحة باستخدام BLoC أو MVVM', 'المصادقة والإشعارات الفورية', 'التكامل مع واجهات API', 'إصدارات جاهزة للنشر في المتاجر']
    }
  },
  {
    id: 'architecture', icon: 'architecture',
    title: { en: 'System structure and design', fr: 'Architecture et conception de systèmes', ar: 'هيكلة وتصميم الأنظمة' },
    description: {
      en: 'Plan dependable data and application architecture that can evolve with product needs.',
      fr: 'Concevoir une architecture applicative et des données fiables, capables d’évoluer avec le produit.',
      ar: 'تصميم بنية موثوقة للتطبيقات والبيانات قابلة للتطور مع احتياجات المنتج.'
    },
    bullets: {
      en: ['Database design, ERDs, and SQL optimization', 'Schema review and data migration with Talend or SSIS', 'Multi-tenant SaaS architecture and scalability', 'Docker deployment and monitoring'],
      fr: ['Conception de bases de données, ERD et optimisation SQL', 'Revue de schéma et migration de données avec Talend ou SSIS', 'Architecture SaaS multi-tenant et évolutivité', 'Déploiement avec Docker et supervision'],
      ar: ['تصميم قواعد البيانات ومخططات ERD وتحسين SQL', 'مراجعة المخططات وترحيل البيانات باستخدام Talend أو SSIS', 'بنية SaaS متعددة المستأجرين وقابلة للتوسع', 'النشر باستخدام Docker ومراقبة الأنظمة']
    }
  },
  {
    id: 'desktop', icon: 'desktop',
    title: { en: 'Desktop applications', fr: 'Applications de bureau', ar: 'تطبيقات سطح المكتب' },
    description: {
      en: 'Windows management software designed for practical day-to-day workflows.',
      fr: 'Des logiciels de gestion Windows adaptés aux besoins quotidiens.',
      ar: 'برمجيات إدارة لنظام Windows مصممة لتلبية احتياجات العمل اليومية.'
    },
    bullets: {
      en: ['WPF and WinForms applications', 'Point of sale and management workflows', 'Invoicing and PDF reports', 'Local databases and FR/AR RTL support'],
      fr: ['Applications WPF et WinForms', 'Caisse et outils de gestion', 'Facturation et rapports PDF', 'Bases locales et prise en charge FR/AR avec RTL'],
      ar: ['تطبيقات WPF وWinForms', 'أنظمة نقاط البيع وإدارة العمليات', 'الفوترة وتقارير PDF', 'قواعد بيانات محلية ودعم الفرنسية والعربية مع RTL']
    }
  },
  {
    id: 'api', icon: 'api',
    title: { en: 'API development', fr: 'Développement d’API', ar: 'تطوير واجهات API' },
    description: {
      en: 'Backend APIs built with clear boundaries, secure access, and maintainable structure.',
      fr: 'Des API backend aux responsabilités claires, avec un accès sécurisé et une structure maintenable.',
      ar: 'واجهات خلفية بحدود واضحة ووصول آمن وبنية سهلة الصيانة.'
    },
    bullets: {
      en: ['REST APIs with ASP.NET Core and Laravel', 'JWT authentication and role-based access', 'Real-time features with SignalR', 'Layered architecture and API documentation'],
      fr: ['API REST avec ASP.NET Core et Laravel', 'Authentification JWT et accès par rôles', 'Fonctionnalités temps réel avec SignalR', 'Architecture en couches et documentation API'],
      ar: ['واجهات REST باستخدام ASP.NET Core وLaravel', 'مصادقة JWT وصلاحيات حسب الأدوار', 'ميزات فورية باستخدام SignalR', 'بنية متعددة الطبقات وتوثيق واجهات API']
    }
  }
]
